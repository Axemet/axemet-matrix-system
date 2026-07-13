-- Core transaction flow: quote approval → project → procurement → manufacturing → delivery.
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  legal_name text not null, trade_name text, cnpj text, category text not null,
  contact_name text, email text, phone text, lead_time_days integer, payment_terms text,
  quality_score numeric(3,1), active boolean not null default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.supplier_catalog_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_code text, description text not null, unit text default 'un', last_price numeric(14,2), lead_time_days integer, active boolean default true
);
create table if not exists public.manufacturing_projects (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  budget_id text references public.budgets(id), project_code text not null, client_id text references public.clients(id),
  description text not null, status text not null default 'engenharia' check (status in ('engenharia','planejamento','compras','fabricacao','montagem','tryout','ajustes','qualidade','pronto_entrega','entregue','garantia','cancelado')),
  due_date date, responsible_profile_id uuid references public.profiles(id), progress_pct numeric(5,2) default 0,
  approved_budget_value numeric(14,2), created_at timestamptz default now(), updated_at timestamptz default now(), unique(organization_id, project_code)
);
create table if not exists public.project_stage_history (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  project_id uuid not null references public.manufacturing_projects(id) on delete cascade,
  from_status text, to_status text not null, note text, changed_by uuid references public.profiles(id), changed_at timestamptz default now()
);
create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  project_id uuid references public.manufacturing_projects(id), request_code text not null, item_description text not null, quantity numeric(12,3) not null, unit text default 'un',
  needed_by date, status text not null default 'aberta' check (status in ('aberta','cotacao','aprovada','pedido_emitido','recebida','cancelada')),
  requested_by uuid references public.profiles(id), created_at timestamptz default now(), unique(organization_id, request_code)
);
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  supplier_id uuid not null references public.suppliers(id), project_id uuid references public.manufacturing_projects(id),
  order_code text not null, status text not null default 'rascunho' check (status in ('rascunho','enviado','confirmado','parcial','recebido','cancelado')),
  expected_delivery date, total_value numeric(14,2), created_at timestamptz default now(), unique(organization_id, order_code)
);
-- Tenant ownership is derived server-side from the authenticated session.
alter table public.suppliers alter column organization_id set default public.organization_for_write();
alter table public.supplier_catalog_items alter column organization_id set default public.organization_for_write();
alter table public.manufacturing_projects alter column organization_id set default public.organization_for_write();
alter table public.project_stage_history alter column organization_id set default public.organization_for_write();
alter table public.purchase_requests alter column organization_id set default public.organization_for_write();
alter table public.purchase_orders alter column organization_id set default public.organization_for_write();
alter table public.suppliers enable row level security; alter table public.supplier_catalog_items enable row level security;
alter table public.manufacturing_projects enable row level security; alter table public.project_stage_history enable row level security;
alter table public.purchase_requests enable row level security; alter table public.purchase_orders enable row level security;
-- Read access is scoped to the current organization. Direct writes are manager/admin-only;
-- controlled RPCs below are used for workflow transitions and create their audit rows.
create policy "suppliers_read_org" on public.suppliers for select using (public.is_active_member() and organization_id=public.current_organization_id());
create policy "suppliers_manage_org" on public.suppliers for all using (public.is_organization_admin() and organization_id=public.current_organization_id()) with check (public.is_organization_admin() and organization_id=public.current_organization_id());
create policy "supplier_catalog_read_org" on public.supplier_catalog_items for select using (public.is_active_member() and organization_id=public.current_organization_id());
create policy "supplier_catalog_manage_org" on public.supplier_catalog_items for all using (public.is_organization_admin() and organization_id=public.current_organization_id()) with check (public.is_organization_admin() and organization_id=public.current_organization_id());
create policy "manufacturing_projects_read_org" on public.manufacturing_projects for select using (public.is_active_member() and organization_id=public.current_organization_id());
create policy "manufacturing_projects_manage_org" on public.manufacturing_projects for all using (public.is_organization_admin() and organization_id=public.current_organization_id()) with check (public.is_organization_admin() and organization_id=public.current_organization_id());
create policy "project_history_read_org" on public.project_stage_history for select using (public.is_active_member() and organization_id=public.current_organization_id());
create policy "purchase_requests_read_org" on public.purchase_requests for select using (public.is_active_member() and organization_id=public.current_organization_id());
create policy "purchase_requests_manage_org" on public.purchase_requests for all using (public.is_organization_admin() and organization_id=public.current_organization_id()) with check (public.is_organization_admin() and organization_id=public.current_organization_id());
create policy "purchase_orders_read_org" on public.purchase_orders for select using (public.is_active_member() and organization_id=public.current_organization_id());
create policy "purchase_orders_manage_org" on public.purchase_orders for all using (public.is_organization_admin() and organization_id=public.current_organization_id()) with check (public.is_organization_admin() and organization_id=public.current_organization_id());

-- Only this transition creates a manufacturing project from an approved commercial budget.
create or replace function public.approve_budget_to_project(p_budget_id text, p_project_code text, p_due_date date, p_responsible_profile_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare b public.budgets%rowtype; result_id uuid;
begin
  if not public.is_organization_admin() then raise exception 'Apenas administradores ou gestores podem aprovar orçamentos'; end if;
  select * into b from public.budgets where id = p_budget_id and organization_id = public.current_organization_id();
  if not found then raise exception 'Orçamento não encontrado'; end if;
  if b.status not in ('approved','aprovado') then raise exception 'O orçamento precisa estar aprovado antes de iniciar o projeto'; end if;
  insert into public.manufacturing_projects (organization_id,budget_id,project_code,client_id,description,due_date,responsible_profile_id,approved_budget_value)
  values (public.current_organization_id(),b.id,p_project_code,coalesce(b.client_id,(select c.id from public.clients c where c.organization_id=public.current_organization_id() and lower(c.name)=lower(b.client_name) limit 1)),coalesce(b.mold_description,b.client_name),p_due_date,p_responsible_profile_id,coalesce((b.totals->>'finalPrice')::numeric,0))
  returning id into result_id;
  insert into public.project_stage_history (organization_id,project_id,to_status,note,changed_by)
  values (public.current_organization_id(),result_id,'engenharia','Projeto criado automaticamente a partir do orçamento aprovado',auth.uid());
  return result_id;
end; $$;

-- Every progress change is written to the immutable project history by the database.
create or replace function public.advance_manufacturing_project(p_project_id uuid, p_to_status text, p_note text default null)
returns public.manufacturing_projects language plpgsql security definer set search_path = public as $$
declare project_row public.manufacturing_projects%rowtype; result_row public.manufacturing_projects%rowtype;
begin
  if not public.is_organization_admin() then raise exception 'Apenas administradores ou gestores podem movimentar projetos'; end if;
  select * into project_row from public.manufacturing_projects where id=p_project_id and organization_id=public.current_organization_id();
  if not found then raise exception 'Projeto não encontrado'; end if;
  if p_to_status not in ('engenharia','planejamento','compras','fabricacao','montagem','tryout','ajustes','qualidade','pronto_entrega','entregue','garantia','cancelado') then raise exception 'Estágio inválido'; end if;
  update public.manufacturing_projects set status=p_to_status, progress_pct=case p_to_status when 'engenharia' then 5 when 'planejamento' then 12 when 'compras' then 20 when 'fabricacao' then 45 when 'montagem' then 60 when 'tryout' then 72 when 'ajustes' then 82 when 'qualidade' then 90 when 'pronto_entrega' then 97 when 'entregue' then 100 else progress_pct end, updated_at=now() where id=p_project_id returning * into result_row;
  insert into public.project_stage_history (organization_id,project_id,from_status,to_status,note,changed_by) values (project_row.organization_id,p_project_id,project_row.status,p_to_status,p_note,auth.uid());
  return result_row;
end; $$;
