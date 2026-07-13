-- Fine-grained module permissions. UI visibility is convenience; these policies are the actual enforcement.
alter table public.profiles add column if not exists sector text;
alter table public.profiles add column if not exists permissions jsonb not null default '{}'::jsonb;

create or replace function public.has_module_permission(p_module text, p_action text default 'view')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active' and (
      role in ('admin','manager') or coalesce((permissions -> p_module ->> p_action)::boolean, false)
    )
  )
$$;

-- Replace broad active-member reads with module-bound policies.
drop policy if exists "clients_organization_access" on public.clients;
create policy "clients_commercial_access" on public.clients for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('comercial', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('comercial', 'edit'));

drop policy if exists "budgets_organization_access" on public.budgets;
create policy "budgets_commercial_access" on public.budgets for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('comercial', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('comercial', 'edit'));

drop policy if exists "suppliers_read_org" on public.suppliers;
drop policy if exists "suppliers_manage_org" on public.suppliers;
create policy "suppliers_procurement_access" on public.suppliers for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('compras', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('compras', 'edit'));

drop policy if exists "supplier_catalog_read_org" on public.supplier_catalog_items;
drop policy if exists "supplier_catalog_manage_org" on public.supplier_catalog_items;
create policy "supplier_catalog_procurement_access" on public.supplier_catalog_items for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('compras', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('compras', 'edit'));

drop policy if exists "manufacturing_projects_read_org" on public.manufacturing_projects;
drop policy if exists "manufacturing_projects_manage_org" on public.manufacturing_projects;
create policy "projects_production_access" on public.manufacturing_projects for select
  using (organization_id = public.current_organization_id() and public.has_module_permission('producao', 'view'));

drop policy if exists "project_history_read_org" on public.project_stage_history;
create policy "project_history_production_access" on public.project_stage_history for select
  using (organization_id = public.current_organization_id() and public.has_module_permission('producao', 'view'));

drop policy if exists "purchase_requests_read_org" on public.purchase_requests;
drop policy if exists "purchase_requests_manage_org" on public.purchase_requests;
create policy "purchase_requests_procurement_access" on public.purchase_requests for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('compras', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('compras', 'edit'));

drop policy if exists "purchase_orders_read_org" on public.purchase_orders;
drop policy if exists "purchase_orders_manage_org" on public.purchase_orders;
create policy "purchase_orders_procurement_access" on public.purchase_orders for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('compras', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('compras', 'edit'));

drop policy if exists "work_sectors_read_org" on public.work_sectors;
drop policy if exists "work_sectors_manage_org" on public.work_sectors;
create policy "work_sectors_people_access" on public.work_sectors for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('rh', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('rh', 'edit'));

drop policy if exists "job_roles_read_org" on public.job_roles;
drop policy if exists "job_roles_manage_org" on public.job_roles;
create policy "job_roles_people_access" on public.job_roles for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('rh', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('rh', 'edit'));

drop policy if exists "employee_records_read_org" on public.employee_records;
drop policy if exists "employee_records_manage_org" on public.employee_records;
create policy "employee_records_people_access" on public.employee_records for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('rh', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('rh', 'edit'));

drop policy if exists "work_machines_read_org" on public.work_machines;
drop policy if exists "work_machines_manage_org" on public.work_machines;
create policy "work_machines_production_access" on public.work_machines for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('producao', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('producao', 'edit'));

drop policy if exists "machine_authorizations_read_org" on public.machine_authorizations;
drop policy if exists "machine_authorizations_manage_org" on public.machine_authorizations;
create policy "machine_authorizations_people_access" on public.machine_authorizations for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('rh', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('rh', 'edit'));

drop policy if exists "operation_assignments_read_org" on public.operation_assignments;
drop policy if exists "operation_assignments_manage_org" on public.operation_assignments;
create policy "operation_assignments_production_access" on public.operation_assignments for all
  using (organization_id = public.current_organization_id() and public.has_module_permission('producao', 'view'))
  with check (organization_id = public.current_organization_id() and public.has_module_permission('producao', 'edit'));
