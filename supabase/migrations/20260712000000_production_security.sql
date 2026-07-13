-- Production hardening: organization isolation, active profiles and no hard-coded administrators.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.organizations (name) values ('Axemet Solution LTDA') on conflict (name) do nothing;

create or replace function public.default_organization_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.organizations order by created_at limit 1
$$;

alter table public.profiles add column if not exists organization_id uuid references public.organizations(id);
alter table public.clients add column if not exists organization_id uuid references public.organizations(id);
alter table public.materials add column if not exists organization_id uuid references public.organizations(id);
alter table public.services add column if not exists organization_id uuid references public.organizations(id);
alter table public.machining_types add column if not exists organization_id uuid references public.organizations(id);
alter table public.budgets add column if not exists organization_id uuid references public.organizations(id);

update public.profiles set organization_id = public.default_organization_id() where organization_id is null;
update public.clients set organization_id = public.default_organization_id() where organization_id is null;
update public.materials set organization_id = public.default_organization_id() where organization_id is null;
update public.services set organization_id = public.default_organization_id() where organization_id is null;
update public.machining_types set organization_id = public.default_organization_id() where organization_id is null;
update public.budgets set organization_id = public.default_organization_id() where organization_id is null;

alter table public.profiles alter column organization_id set not null;
alter table public.clients alter column organization_id set not null;
alter table public.materials alter column organization_id set not null;
alter table public.services alter column organization_id set not null;
alter table public.machining_types alter column organization_id set not null;
alter table public.budgets alter column organization_id set not null;

alter table public.profiles alter column organization_id set default public.default_organization_id();

create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- SQL Editor migrations run without an authenticated browser user. In that context,
-- bootstrap rows must still belong to the first organization rather than violating NOT NULL.
create or replace function public.organization_for_write()
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(public.current_organization_id(), public.default_organization_id())
$$;

alter table public.clients alter column organization_id set default public.organization_for_write();
alter table public.materials alter column organization_id set default public.organization_for_write();
alter table public.services alter column organization_id set default public.organization_for_write();
alter table public.machining_types alter column organization_id set default public.organization_for_write();
alter table public.budgets alter column organization_id set default public.organization_for_write();

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and status = 'active')
$$;

create or replace function public.is_organization_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and status = 'active' and role in ('admin','manager'))
$$;

-- New accounts are pending. An existing admin approves them through the application or SQL console.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, status, organization, organization_id)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'viewer', 'pending', 'Axemet Solution LTDA', public.default_organization_id());
  return new;
end;
$$;

drop policy if exists "Enable read access for all profiles" on public.profiles;
drop policy if exists "Enable update for users own profile" on public.profiles;
drop policy if exists "Enable full access for admins" on public.profiles;
drop policy if exists "profile_self_or_org_admin" on public.profiles;
drop policy if exists "profile_admin_manage" on public.profiles;
create policy "profile_self_or_org_admin" on public.profiles for select using (id = auth.uid() or (organization_id = public.current_organization_id() and public.is_organization_admin()));
create policy "profile_admin_manage" on public.profiles for update using (organization_id = public.current_organization_id() and public.is_organization_admin()) with check (organization_id = public.current_organization_id() and public.is_organization_admin());

drop policy if exists "Enable read access for all clients" on public.clients;
drop policy if exists "Enable insert for all clients" on public.clients;
drop policy if exists "Enable update for all clients" on public.clients;
drop policy if exists "Enable delete for all clients" on public.clients;
drop policy if exists "clients_organization_access" on public.clients;
create policy "clients_organization_access" on public.clients for all using (public.is_active_member() and organization_id = public.current_organization_id()) with check (public.is_active_member() and organization_id = public.current_organization_id());

drop policy if exists "Enable read access for all materials" on public.materials;
drop policy if exists "Enable write access for all materials" on public.materials;
drop policy if exists "materials_organization_read" on public.materials;
drop policy if exists "materials_organization_manage" on public.materials;
create policy "materials_organization_read" on public.materials for select using (public.is_active_member() and organization_id = public.current_organization_id());
create policy "materials_organization_manage" on public.materials for all using (public.is_organization_admin() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());

drop policy if exists "Enable read access for all services" on public.services;
drop policy if exists "Enable write access for all services" on public.services;
drop policy if exists "services_organization_read" on public.services;
drop policy if exists "services_organization_manage" on public.services;
create policy "services_organization_read" on public.services for select using (public.is_active_member() and organization_id = public.current_organization_id());
create policy "services_organization_manage" on public.services for all using (public.is_organization_admin() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());

drop policy if exists "Enable read access for all machining_types" on public.machining_types;
drop policy if exists "Enable write access for all machining_types" on public.machining_types;
drop policy if exists "machining_organization_read" on public.machining_types;
drop policy if exists "machining_organization_manage" on public.machining_types;
create policy "machining_organization_read" on public.machining_types for select using (public.is_active_member() and organization_id = public.current_organization_id());
create policy "machining_organization_manage" on public.machining_types for all using (public.is_organization_admin() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());

drop policy if exists "Enable read access for all budgets" on public.budgets;
drop policy if exists "Enable insert for all budgets" on public.budgets;
drop policy if exists "Enable update for all budgets" on public.budgets;
drop policy if exists "Enable delete for all budgets" on public.budgets;
drop policy if exists "budgets_organization_access" on public.budgets;
create policy "budgets_organization_access" on public.budgets for all using (public.is_active_member() and organization_id = public.current_organization_id()) with check (public.is_active_member() and organization_id = public.current_organization_id());
