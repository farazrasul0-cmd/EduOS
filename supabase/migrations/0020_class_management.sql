-- Admin-only class creation/editing with normalized unique names.
create unique index if not exists classes_school_name_uidx on classes(school_id,lower(name));

create or replace function save_school_class(target_id uuid, target_name text, target_grade text, target_teacher_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare sid uuid:=auth_school_id(); class_id uuid;
begin
  if not is_school_admin() then raise exception 'not_authorized'; end if;
  if nullif(trim(target_name),'') is null or length(trim(target_name))>40 then raise exception 'invalid_name'; end if;
  if target_teacher_id is not null and not exists(select 1 from profiles where id=target_teacher_id and school_id=sid and role='teacher') then raise exception 'invalid_teacher'; end if;
  if target_id is null then
    insert into classes(school_id,name,grade,teacher_id) values(sid,trim(target_name),nullif(trim(target_grade),''),target_teacher_id) returning id into class_id;
  else
    update classes set name=trim(target_name),grade=nullif(trim(target_grade),''),teacher_id=target_teacher_id where id=target_id and school_id=sid returning id into class_id;
    if class_id is null then raise exception 'not_authorized'; end if;
  end if;
  return class_id;
exception when unique_violation then raise exception 'duplicate_class';
end; $$;
revoke all on function save_school_class(uuid,text,text,uuid) from public;
grant execute on function save_school_class(uuid,text,text,uuid) to authenticated;
