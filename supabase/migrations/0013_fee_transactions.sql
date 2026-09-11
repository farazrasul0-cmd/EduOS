-- Transaction-safe invoicing and payments.
create unique index if not exists payments_school_reference_unique
  on payments (school_id, reference) where reference is not null;

create or replace function create_fee_invoice(
  target_student_id uuid,
  target_fee_plan_id uuid,
  new_plan_name text,
  new_plan_period text,
  invoice_amount numeric,
  invoice_due_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid := auth_school_id();
  plan_id uuid := target_fee_plan_id;
  invoice_id uuid;
  generated_no text;
begin
  if auth.uid() is null or not is_school_admin() then
    raise exception 'Only school owners and admins may create invoices';
  end if;
  if invoice_amount <= 0 then raise exception 'Invoice amount must be positive'; end if;
  if not exists (select 1 from students where id = target_student_id and school_id = sid and active) then
    raise exception 'Student is not active in this school';
  end if;

  if plan_id is not null then
    if not exists (select 1 from fee_plans where id = plan_id and school_id = sid) then
      raise exception 'Fee plan does not belong to this school';
    end if;
  else
    if nullif(trim(new_plan_name), '') is null then raise exception 'Fee plan name is required'; end if;
    insert into fee_plans (school_id, name, amount, period)
    values (sid, trim(new_plan_name), invoice_amount, nullif(trim(new_plan_period), ''))
    returning id into plan_id;
  end if;

  generated_no := 'EDU-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into invoices (school_id, student_id, fee_plan_id, invoice_no, amount, due_date, status)
  values (sid, target_student_id, plan_id, generated_no, invoice_amount, invoice_due_date,
    case when invoice_due_date < current_date then 'overdue'::invoice_status else 'due'::invoice_status end)
  returning id into invoice_id;
  return invoice_id;
end;
$$;

create or replace function record_invoice_payment(
  target_invoice_id uuid,
  payment_amount numeric,
  payment_method_name payment_method,
  payment_reference text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid := auth_school_id();
  inv invoices%rowtype;
  payment_id uuid;
  new_paid numeric;
begin
  if auth.uid() is null or not is_school_admin() then
    raise exception 'Only school owners and admins may record payments';
  end if;
  if nullif(trim(payment_reference), '') is null then raise exception 'Payment reference is required'; end if;

  select * into inv from invoices where id = target_invoice_id and school_id = sid for update;
  if not found then raise exception 'Invoice not found'; end if;

  select id into payment_id from payments
  where school_id = sid and reference = trim(payment_reference) and status = 'success';
  if payment_id is not null then return payment_id; end if;

  if payment_amount <= 0 or payment_amount > inv.amount - inv.paid_amount then
    raise exception 'Payment must be positive and no greater than the outstanding balance';
  end if;

  insert into payments (school_id, invoice_id, amount, method, status, reference, gateway)
  values (sid, inv.id, payment_amount, payment_method_name, 'success', trim(payment_reference), 'manual')
  returning id into payment_id;

  new_paid := inv.paid_amount + payment_amount;
  update invoices set paid_amount = new_paid,
    status = case when new_paid >= amount then 'paid'::invoice_status else 'partial'::invoice_status end,
    updated_at = now()
  where id = inv.id;
  return payment_id;
end;
$$;

revoke all on function create_fee_invoice(uuid, uuid, text, text, numeric, date) from public;
revoke all on function record_invoice_payment(uuid, numeric, payment_method, text) from public;
grant execute on function create_fee_invoice(uuid, uuid, text, text, numeric, date) to authenticated;
grant execute on function record_invoice_payment(uuid, numeric, payment_method, text) to authenticated;
