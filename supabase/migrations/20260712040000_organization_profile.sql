-- Organization profile shown throughout the system and on commercial documents.
alter table public.organizations add column if not exists cnpj text;
alter table public.organizations add column if not exists phone text;
alter table public.organizations add column if not exists email text;
alter table public.organizations add column if not exists address text;
alter table public.organizations add column if not exists logo_url text;
alter table public.organizations add column if not exists updated_at timestamptz not null default now();
alter table public.organizations enable row level security;
create policy "organizations_member_read" on public.organizations for select using (id = public.current_organization_id() and public.is_active_member());
create policy "organizations_admin_update" on public.organizations for update using (id = public.current_organization_id() and public.is_organization_admin()) with check (id = public.current_organization_id() and public.is_organization_admin());
