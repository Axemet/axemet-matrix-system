-- A manufacturing project must inherit the negotiated proposal value, not only
-- the last technical calculation stored in budgets.totals.finalPrice.
with budget_values as (
  select b.id,
    coalesce(
      nullif((select sum(coalesce((item->>'quantity')::numeric, 0) * coalesce((item->>'unitPrice')::numeric, 0)) from jsonb_array_elements(coalesce(b.config->'proposalItems', '[]'::jsonb)) item), 0),
      greatest(0, coalesce((b.totals->>'finalPrice')::numeric, 0) - coalesce(b.discount_value, 0))
    ) as commercial_value
  from public.budgets b
)
update public.manufacturing_projects project
set approved_budget_value = budget_values.commercial_value,
    updated_at = now()
from budget_values
where project.budget_id = budget_values.id
  and project.approved_budget_value is distinct from budget_values.commercial_value;

create or replace function public.approve_budget_to_project(p_budget_id text, p_project_code text, p_due_date date, p_responsible_profile_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  b public.budgets%rowtype;
  result_id uuid;
  commercial_value numeric(14,2);
begin
  if not public.is_organization_admin() then
    raise exception 'Apenas administradores ou gestores podem aprovar orçamentos';
  end if;

  select * into b from public.budgets
    where id = p_budget_id and organization_id = public.current_organization_id();
  if not found then raise exception 'Orçamento não encontrado'; end if;
  if b.status not in ('approved','aprovado') then
    raise exception 'O orçamento precisa estar aprovado antes de iniciar o projeto';
  end if;

  select coalesce(sum(
    coalesce((item->>'quantity')::numeric, 0) * coalesce((item->>'unitPrice')::numeric, 0)
  ), 0) into commercial_value
  from jsonb_array_elements(coalesce(b.config->'proposalItems', '[]'::jsonb)) item;
  if commercial_value <= 0 then
    commercial_value := greatest(0, coalesce((b.totals->>'finalPrice')::numeric, 0) - coalesce(b.discount_value, 0));
  end if;

  insert into public.manufacturing_projects (
    organization_id, budget_id, project_code, client_id, description,
    due_date, responsible_profile_id, approved_budget_value
  ) values (
    public.current_organization_id(), b.id, p_project_code,
    coalesce(b.client_id, (select c.id from public.clients c where c.organization_id = public.current_organization_id() and lower(c.name) = lower(b.client_name) limit 1)),
    coalesce(b.mold_description, b.client_name), p_due_date, p_responsible_profile_id, commercial_value
  ) returning id into result_id;

  insert into public.project_stage_history (organization_id, project_id, to_status, note, changed_by)
  values (public.current_organization_id(), result_id, 'engenharia', 'Projeto criado automaticamente a partir do orçamento aprovado', auth.uid());
  return result_id;
end;
$$;
