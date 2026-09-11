-- Secure onboarding and prevent users from promoting themselves by updating
-- profiles.role or moving themselves to another school.

drop policy if exists schools_insert on schools;

create or replace function protect_profile_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role or old.school_id is distinct from new.school_id then
    if coalesce(current_setting('eduos.membership_change', true), '') <> 'allowed' then
      raise exception 'role and school membership cannot be changed directly'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_membership on profiles;
create trigger protect_profile_membership
  before update of role, school_id on profiles
  for each row execute function protect_profile_membership();

-- Creates a school and assigns its creator as owner atomically. Only an
-- authenticated user without an existing school may call this function.
create or replace function create_school_for_current_user(school_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_school_id uuid;
  caller_profile profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into caller_profile
  from profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if caller_profile.school_id is not null then
    raise exception 'user already belongs to a school' using errcode = '23505';
  end if;
  if nullif(btrim(school_name), '') is null then
    raise exception 'school name is required' using errcode = '22023';
  end if;

  insert into schools (name, currency)
  values (btrim(school_name), 'BDT')
  returning id into new_school_id;

  perform set_config('eduos.membership_change', 'allowed', true);
  update profiles
  set school_id = new_school_id, role = 'owner'
  where id = auth.uid();

  return new_school_id;
end;
$$;

-- Demo access remains an explicit product feature, but the school id and role
-- are chosen server-side rather than accepted from an arbitrary client update.
create or replace function join_demo_school()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_school_id constant uuid := '11111111-1111-1111-1111-111111111111';
  current_school_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select school_id into current_school_id
  from profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if current_school_id is not null then
    raise exception 'user already belongs to a school' using errcode = '23505';
  end if;
  if not exists (select 1 from schools where id = demo_school_id) then
    raise exception 'demo school is unavailable' using errcode = 'P0002';
  end if;

  perform set_config('eduos.membership_change', 'allowed', true);
  update profiles
  set school_id = demo_school_id, role = 'owner'
  where id = auth.uid();

  return demo_school_id;
end;
$$;

revoke all on function create_school_for_current_user(text) from public;
revoke all on function join_demo_school() from public;
grant execute on function create_school_for_current_user(text) to authenticated;
grant execute on function join_demo_school() to authenticated;
