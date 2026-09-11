-- Link a verified Auth email to a unique guardian record. This keeps the
-- passwordless email delivery on Supabase Auth while the database remains the
-- authority for school and parent membership.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_school_id uuid;
  matched_school_count integer := 0;
begin
  if new.email is not null then
    select (array_agg(distinct g.school_id))[1], count(distinct g.school_id)
      into matched_school_id, matched_school_count
    from guardians g
    where lower(g.email) = lower(new.email) and g.profile_id is null;
  end if;

  insert into public.profiles (id, school_id, full_name, email, role)
  values (
    new.id,
    case when matched_school_count = 1 then matched_school_id else null end,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    case when matched_school_count = 1 then 'parent'::user_role else 'teacher'::user_role end
  );

  if matched_school_count = 1 then
    update guardians
    set profile_id = new.id
    where school_id = matched_school_id
      and lower(email) = lower(new.email)
      and profile_id is null;
  end if;
  return new;
end;
$$;

-- Existing Auth users do not fire handle_new_user again. Call this after
-- authentication to claim a still-unassigned profile by its verified email.
create or replace function claim_guardian_membership()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text;
  current_school_id uuid;
  matched_school_id uuid;
  matched_school_count integer := 0;
begin
  if auth.uid() is null then return false; end if;

  select p.school_id, u.email into current_school_id, caller_email
  from profiles p join auth.users u on u.id = p.id
  where p.id = auth.uid()
  for update of p;

  if not found or current_school_id is not null or caller_email is null then return false; end if;

  select (array_agg(distinct g.school_id))[1], count(distinct g.school_id)
    into matched_school_id, matched_school_count
  from guardians g
  where lower(g.email) = lower(caller_email) and (g.profile_id is null or g.profile_id = auth.uid());

  if matched_school_count <> 1 then return false; end if;

  perform set_config('eduos.membership_change', 'allowed', true);
  update profiles set school_id = matched_school_id, role = 'parent' where id = auth.uid();
  update guardians set profile_id = auth.uid()
  where school_id = matched_school_id and lower(email) = lower(caller_email)
    and (profile_id is null or profile_id = auth.uid());
  return true;
end;
$$;

revoke all on function claim_guardian_membership() from public;
grant execute on function claim_guardian_membership() to authenticated;
