import { supabase, isSupabaseConfigured } from './supabase';

export type Supplier = { id?: string; legal_name: string; trade_name?: string; cnpj?: string; category: string; contact_name?: string; email?: string; phone?: string; lead_time_days?: number; payment_terms?: string; quality_score?: number; active?: boolean };
export const productionStages = [
  ['engenharia', 'Engenharia e viabilidade'], ['planejamento', 'Planejamento PCP'], ['compras', 'Suprimentos'],
  ['fabricacao', 'Fabricação'], ['montagem', 'Montagem e bancada'], ['tryout', 'Try-out'],
  ['ajustes', 'Ajustes'], ['qualidade', 'Validação da qualidade'], ['pronto_entrega', 'Pronto para entrega'],
  ['entregue', 'Entregue'], ['garantia', 'Garantia'], ['cancelado', 'Cancelado']
] as const;

export type ManufacturingProject = { id: string; project_code: string; description: string; status: string; due_date?: string; progress_pct: number; approved_budget_value?: number; client_id?: string; created_at?: string };
export type PurchaseRequestDb = { id?: string; project_id?: string; request_code: string; item_description: string; quantity: number; unit?: string; needed_by?: string; status: 'aberta'|'cotacao'|'aprovada'|'pedido_emitido'|'recebida'|'cancelada'; created_at?: string; manufacturing_projects?: { project_code: string; description: string } | null };

const ensure = () => { if (!isSupabaseConfigured) throw new Error('Supabase não está configurado.'); };

export async function listSuppliers(): Promise<Supplier[]> {
  ensure(); const { data, error } = await supabase.from('suppliers').select('*').order('legal_name');
  if (error) throw error; return data || [];
}
export async function saveSupplier(supplier: Supplier) {
  ensure(); const { id, ...values } = supplier;
  const query = id ? supabase.from('suppliers').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id) : supabase.from('suppliers').insert(values);
  const { error } = await query; if (error) throw error;
}
export async function deleteSupplier(id: string) { ensure(); const { error } = await supabase.from('suppliers').delete().eq('id', id); if (error) throw error; }
export async function listManufacturingProjects(): Promise<ManufacturingProject[]> {
  ensure(); const { data, error } = await supabase.from('manufacturing_projects').select('*').order('created_at', { ascending: false });
  if (error) throw error; return data || [];
}
export async function approveBudgetToProject(budgetId: string, projectCode: string, dueDate?: string, responsibleId?: string) {
  ensure(); const { data, error } = await supabase.rpc('approve_budget_to_project', { p_budget_id: budgetId, p_project_code: projectCode, p_due_date: dueDate, p_responsible_profile_id: responsibleId || null });
  if (error) throw error; return data as string;
}

export async function advanceManufacturingProject(projectId: string, status: string, note?: string) {
  ensure();
  const { data, error } = await supabase.rpc('advance_manufacturing_project', { p_project_id: projectId, p_to_status: status, p_note: note || null });
  if (error) throw error;
  return data as ManufacturingProject;
}
export async function listPurchaseRequests(): Promise<PurchaseRequestDb[]> { ensure(); const {data,error}=await supabase.from('purchase_requests').select('*, manufacturing_projects(project_code,description)').order('created_at',{ascending:false}); if(error) throw error; return data || []; }
export async function savePurchaseRequest(item: PurchaseRequestDb) { ensure(); const {id,manufacturing_projects,...values}=item; const q=id ? supabase.from('purchase_requests').update(values).eq('id',id) : supabase.from('purchase_requests').insert(values); const {error}=await q; if(error) throw error; }
export async function deletePurchaseRequest(id: string) { ensure(); const {error}=await supabase.from('purchase_requests').delete().eq('id',id); if(error) throw error; }
