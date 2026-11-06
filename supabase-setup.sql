-- ROBY & ADEL — SETUP SUPABASE
-- Buat SATU akun admin di Authentication > Users > Add user > Create new user.
-- Ganti ADMIN_UID_DI_SINI dengan User UID akun admin, lalu jalankan SQL ini.
-- PERINGATAN: kebijakan SELECT publik membuka nama, alamat, nominal, dan beras untuk siapa pun.

create extension if not exists pgcrypto;
create table if not exists public.tamu_undangan (
 id uuid primary key default gen_random_uuid(),
 nama text not null check(char_length(trim(nama)) between 1 and 160),
 alamat text not null check(char_length(trim(alamat)) between 1 and 300),
 nominal numeric(14,0) not null default 0 check(nominal >= 0),
 beras_liter numeric(10,1) null check(beras_liter is null or beras_liter >= 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.tamu_undangan enable row level security;
drop policy if exists "Publik dapat melihat daftar tamu" on public.tamu_undangan;
drop policy if exists "Admin dapat menambahkan tamu" on public.tamu_undangan;
drop policy if exists "Admin dapat mengedit tamu" on public.tamu_undangan;
drop policy if exists "Admin dapat menghapus tamu" on public.tamu_undangan;
create policy "Publik dapat melihat daftar tamu" on public.tamu_undangan for select to anon,authenticated using(true);
create policy "Admin dapat menambahkan tamu" on public.tamu_undangan for insert to authenticated with check(auth.uid()='ADMIN_UID_DI_SINI'::uuid);
create policy "Admin dapat mengedit tamu" on public.tamu_undangan for update to authenticated using(auth.uid()='ADMIN_UID_DI_SINI'::uuid) with check(auth.uid()='ADMIN_UID_DI_SINI'::uuid);
create policy "Admin dapat menghapus tamu" on public.tamu_undangan for delete to authenticated using(auth.uid()='ADMIN_UID_DI_SINI'::uuid);
grant usage on schema public to anon,authenticated;
grant select on public.tamu_undangan to anon,authenticated;
grant insert,update,delete on public.tamu_undangan to authenticated;
