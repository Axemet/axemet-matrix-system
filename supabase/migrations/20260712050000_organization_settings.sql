-- Shared commercial parameters: markup, taxes and calculation defaults belong to the organization, not to one browser.
create table if not exists public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  calculation_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.organization_settings enable row level security;
create policy "organization_settings_read" on public.organization_settings for select using (organization_id = public.current_organization_id() and public.is_active_member());
create policy "organization_settings_manage" on public.organization_settings for all using (organization_id = public.current_organization_id() and public.is_organization_admin()) with check (organization_id = public.current_organization_id() and public.is_organization_admin());
