-- Avatar object names use {school_id}/{uuid}.{ext}. Restrict all mutations to
-- administrators of the school named by the first path segment.

drop policy if exists "avatars authed insert" on storage.objects;
drop policy if exists "avatars authed update" on storage.objects;
drop policy if exists "avatars authed delete" on storage.objects;

create policy "avatars school admin insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and is_school_admin()
    and (storage.foldername(name))[1] = auth_school_id()::text
  );

create policy "avatars school admin update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and is_school_admin()
    and (storage.foldername(name))[1] = auth_school_id()::text
  )
  with check (
    bucket_id = 'avatars'
    and is_school_admin()
    and (storage.foldername(name))[1] = auth_school_id()::text
  );

create policy "avatars school admin delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and is_school_admin()
    and (storage.foldername(name))[1] = auth_school_id()::text
  );
