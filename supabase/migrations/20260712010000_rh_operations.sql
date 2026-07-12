-- RH and operational structure. Run after production_security.sql.
create table if not exists public.work_sectors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  code text not null,
  name text not null,
  leader_profile_id uuid references public.profiles(id),
  default_shift text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);
create table if not exists public.job_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  sector_id uuid references public.work_sectors(id),
  title text not null,
  cbo_code text,
  required_skills text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.employee_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  profile_id uuid unique references public.profiles(id),
  sector_id uuid references public.work_sectors(id),
  job_role_id uuid references public.job_roles(id),
  employee_name text not null,
  employment_status text not null default 'ativo' check (employment_status in ('ativo','ferias','afastado','inativo')),
  shift text,
  skills text,
  nr12_expires_on date,
  aso_expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.work_machines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  sector_id uuid references public.work_sectors(id),
  code text not null,
  name text not null,
  machine_type text,
  operational_status text not null default 'disponivel' check (operational_status in ('disponivel','em_operacao','manutencao','bloqueada')),
  maintenance_due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);
create table if not exists public.machine_authorizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  machine_id uuid not null references public.work_machines(id) on delete cascade,
  employee_id uuid not null references public.employee_records(id) on delete cascade,
  training_name text not null default 'NR-12',
  certificate_url text,
  expires_on date,
  authorized boolean not null default true,
  unique (machine_id, employee_id, training_name)
);
create table if not exists public.operation_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_reference text not null,
  operation_reference text not null,
  employee_id uuid references public.employee_records(id),
  machine_id uuid references public.work_machines(id),
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique (organization_id, project_reference, operation_reference)
);

alter table public.work_sectors enable row level security;
alter table public.job_roles enable row level security;
alter table public.employee_records enable row level security;
alter table public.work_machines enable row level security;
alter table public.machine_authorizations enable row level security;
alter table public.operation_assignments enable row level security;

create policy "work_sectors_org" on public.work_sectors for all using (public.is_active_member() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());
create policy "job_roles_org" on public.job_roles for all using (public.is_active_member() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());
create policy "employee_records_org" on public.employee_records for all using (public.is_active_member() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());
create policy "work_machines_org" on public.work_machines for all using (public.is_active_member() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());
create policy "machine_authorizations_org" on public.machine_authorizations for all using (public.is_active_member() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());
create policy "operation_assignments_org" on public.operation_assignments for all using (public.is_active_member() and organization_id = public.current_organization_id()) with check (public.is_organization_admin() and organization_id = public.current_organization_id());
