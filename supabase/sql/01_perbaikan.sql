-- =====================================================================
-- 01_perbaikan.sql  —  Personal Notes & Finance App
-- Jalankan di Supabase → SQL Editor → paste semua → Run.
-- Aman dijalankan ulang (idempotent).
--
-- URUTAN DEPLOY (penting):
--   1) Deploy 3 Edge Function (login, create-user, delete-user)
--   2) Jalankan file SQL ini
--   3) Deploy frontend baru (src-fixed)
-- =====================================================================


-- ---------------------------------------------------------------------
-- A. handle_new_user: role TIDAK BOLEH diambil dari raw_user_meta_data
--    (metadata ini bisa diisi siapa saja lewat supabase.auth.signUp,
--     sehingga sebelumnya siapa pun bisa mendaftar sebagai admin).
--    Role admin hanya dibaca dari raw_app_meta_data, yang hanya bisa
--    diisi server-side (Edge Function create-user).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New User'
    ),
    case when new.raw_app_meta_data->>'role' = 'admin' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;


-- ---------------------------------------------------------------------
-- B. profiles: AKTIFKAN RLS (sebelumnya MATI = semua orang bisa baca
--    dan ubah role siapa pun lewat anon key).
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- user: lihat profil sendiri (policy lama dipertahankan)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- user: ubah profil sendiri, TAPI tidak boleh menaikkan role jadi admin
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and (role = 'user' or public.is_admin()));

-- admin: lihat & ubah semua profil (dipakai halaman Kelola User + dashboard admin)
drop policy if exists "Admin can view all profiles" on public.profiles;
create policy "Admin can view all profiles" on public.profiles
  for select to authenticated
  using (public.is_admin());

drop policy if exists "Admin can update all profiles" on public.profiles;
create policy "Admin can update all profiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Tidak ada policy INSERT/DELETE di profiles untuk client:
--   INSERT dilakukan trigger handle_new_user (security definer)
--   DELETE dilakukan Edge Function delete-user (hapus auth.users → cascade)


-- ---------------------------------------------------------------------
-- C. notes: AKTIFKAN RLS (policy sudah ada tapi sebelumnya tidak berlaku
--    karena RLS mati — semua catatan bisa dibaca/diubah siapa pun).
-- ---------------------------------------------------------------------
alter table public.notes enable row level security;


-- ---------------------------------------------------------------------
-- D. activity_logs: tutup insert bebas + rapikan policy duplikat
-- ---------------------------------------------------------------------
-- Sebelumnya policy "Izinkan insert activity_logs" (check true) membuat
-- siapa pun (termasuk anon) bisa memalsukan log. Sekarang log ditulis
-- oleh Edge Function (service role) saja.
drop policy if exists "Izinkan insert activity_logs" on public.activity_logs;

-- tiga policy SELECT admin identik → sisakan satu (is_admin())
drop policy if exists "Admin can view activity logs" on public.activity_logs;
drop policy if exists "Admins can view activity logs" on public.activity_logs;
drop policy if exists "Admin dapat melihat semua log aktivitas" on public.activity_logs;
create policy "Admin dapat melihat semua log aktivitas" on public.activity_logs
  for select to authenticated
  using (public.is_admin());

-- insert_activity_log: hanya admin yang boleh memanggil (dipakai UsersPage
-- untuk mencatat "Akun baru dibuat oleh admin"). Login dicatat oleh Edge Function.
create or replace function public.insert_activity_log(
  p_activity text,
  p_email text,
  p_status text,
  p_user_id uuid default null::uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then
    raise exception 'Access denied: Requires admin role';
  end if;

  insert into public.activity_logs (activity, email, status, user_id)
  values (p_activity, p_email, p_status, p_user_id);
end;
$function$;

revoke execute on function public.insert_activity_log(text, text, text, uuid) from public, anon;
grant  execute on function public.insert_activity_log(text, text, text, uuid) to authenticated;

-- index untuk pengecekan kunci login (email + waktu)
create index if not exists activity_logs_email_created_at_idx
  on public.activity_logs (email, created_at desc);


-- ---------------------------------------------------------------------
-- E. updated_at otomatis (sebelumnya tidak ada trigger sama sekali,
--    jadi updated_at tidak pernah berubah saat data diedit)
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists set_updated_at on public.notes;
create trigger set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.transactions;
create trigger set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- F. CEK MANUAL (jalankan terpisah, lihat hasilnya):
--    Pastikan tidak ada admin yang tidak Anda kenal.
-- ---------------------------------------------------------------------
-- select id, name, role, created_at from public.profiles where role = 'admin';


-- ---------------------------------------------------------------------
-- G. OPSIONAL — jalankan SETELAH frontend baru ter-deploy.
--    Frontend baru menyimpan transactions.source sebagai 'cash'/'cashless'
--    (sesuai Database/ERD), nama dompet tetap di kolom account.
--    Langkah ini merapikan data lama lalu mengunci nilainya.
-- ---------------------------------------------------------------------
-- update public.transactions
--    set source = case when lower(account) like 'cash%' then 'cash' else 'cashless' end
--  where source not in ('cash', 'cashless');
--
-- alter table public.transactions
--   add constraint transactions_source_check check (source in ('cash', 'cashless'));
