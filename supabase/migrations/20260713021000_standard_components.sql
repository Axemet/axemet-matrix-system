-- Shared catalog of normalised components used by the commercial calculator.
create table if not exists public.standard_components (
  id text primary key,
  organization_id uuid not null default public.organization_for_write() references public.organizations(id),
  catalog text not null default 'Outro',
  code text not null,
  name text not null,
  stock numeric(12,3) not null default 0,
  min_stock numeric(12,3) not null default 0,
  price numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists standard_components_org_code_unique on public.standard_components (organization_id, code);
alter table public.standard_components enable row level security;

drop policy if exists "standard_components_commercial_access" on public.standard_components;
create policy "standard_components_commercial_access" on public.standard_components for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('comercial', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('comercial', 'edit'));
