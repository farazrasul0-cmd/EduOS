-- Storage bucket for student/profile photos.
-- Public-read for simple <img> rendering; writes require an authenticated user.
-- (Later phase: scope object paths per school_id in the policy when per-role
-- RLS lands — uploads already use a {school_id}/ prefix to make that easy.)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars authed insert" on storage.objects;
create policy "avatars authed insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars authed update" on storage.objects;
create policy "avatars authed update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars authed delete" on storage.objects;
create policy "avatars authed delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');
