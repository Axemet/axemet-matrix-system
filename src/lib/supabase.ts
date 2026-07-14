import { createClient } from '@supabase/supabase-js';
import {
  Client, RawMaterial, InternalServiceItem, MachiningType, BudgetDraft, StandardComponentStock,
  MatrixProject, RawMaterialStock, QualityInspection, NonConformance,
  BillingMilestone, CashTransaction, MaintenanceLog,
} from '../types';

// @ts-ignore
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
// @ts-ignore
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseUrl !== '' &&
  !!supabaseAnonKey && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseAnonKey !== '';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);

// --- AUTHENTICATION ---

export async function signUpUser(email: string, password: string, fullName?: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase não está configurado');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function signInUser(email: string, password: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase não está configurado');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function getCurrentUserProfile(uid: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
  if (error) {
    console.warn('Erro ao buscar perfil do usuário (pode ser contornado):', error.message || error);
    return null;
  }
  return data;
}

export async function fetchProfiles() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('Erro ao buscar perfis (pode ser contornado):', error.message || error);
    return [];
  }
  return data;
}

export async function updateProfile(id: string, updates: any) {
  if (!isSupabaseConfigured) throw new Error('Supabase não está configurado.');

  // A profile is created only by the Auth trigger. Using upsert here asks RLS for
  // INSERT permission as well and consequently blocks an otherwise authorized edit.
  const allowed = ['full_name', 'role', 'status', 'organization', 'sector', 'phone', 'permissions'];
  const payload = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- TYPE MAPPERS ---

export function mapDbClientToClient(db: any): Client {
  return {
    id: db.id,
    name: db.name,
    corporateName: db.corporate_name || undefined,
    cnpj: db.cnpj || undefined,
    stateInscription: db.state_inscription || undefined,
    phone: db.phone || undefined,
    email: db.email || undefined,
    responsible: db.responsible || undefined,
    cep: db.cep || undefined,
    address: db.address || undefined,
    number: db.number || undefined,
    neighborhood: db.neighborhood || undefined,
    city: db.city || undefined,
    state: db.state || undefined,
  };
}

export function mapClientToDbClient(client: Client) {
  return {
    id: client.id,
    name: client.name,
    corporate_name: client.corporateName || null,
    cnpj: client.cnpj || null,
    state_inscription: client.stateInscription || null,
    phone: client.phone || null,
    email: client.email || null,
    responsible: client.responsible || null,
    cep: client.cep || null,
    address: client.address || null,
    number: client.number || null,
    neighborhood: client.neighborhood || null,
    city: client.city || null,
    state: client.state || null,
  };
}

export function mapDbMaterialToRawMaterial(db: any): RawMaterial {
  return {
    id: db.id,
    name: db.name,
    density: Number(db.density),
    pricePerKg: Number(db.price_per_kg),
  };
}

export function mapRawMaterialToDbMaterial(rm: RawMaterial) {
  return {
    id: rm.id,
    name: rm.name,
    density: rm.density,
    price_per_kg: rm.pricePerKg,
  };
}

export function mapDbServiceToService(db: any) {
  return {
    id: db.id,
    name: db.name,
    unit: db.unit as 'dia' | 'h',
    valUnit: Number(db.val_unit),
  };
}

export function mapServiceToDbService(srv: any) {
  return {
    id: srv.id,
    name: srv.name,
    unit: srv.unit,
    val_unit: srv.valUnit,
  };
}

export function mapDbMachiningToMachining(db: any): MachiningType {
  return {
    id: db.id,
    name: db.name,
    hourlyRate: Number(db.hourly_rate),
  };
}

export function mapMachiningToDbMachining(mt: MachiningType) {
  return {
    id: mt.id,
    name: mt.name,
    hourly_rate: mt.hourlyRate,
  };
}

export function mapDbBudgetToBudget(db: any): BudgetDraft {
  const configObj = db.config || {};
  return {
    id: db.id,
    reference: db.reference || undefined,
    clientName: db.client_name,
    contactName: db.contact_name || undefined,
    moldType: db.mold_type || undefined,
    moldingMaterial: db.molding_material || undefined,
    productQuantity: db.product_quantity !== null && db.product_quantity !== undefined ? Number(db.product_quantity) : undefined,
    deliveryTime: db.delivery_time || undefined,
    observations: db.observations || undefined,
    status: db.status || undefined,
    moldDescription: db.mold_description || '',
    date: db.date || '',
    moldWidth: Number(db.mold_width || 0),
    moldLength: Number(db.mold_length || 0),
    discountPercent: db.discount_percent !== null ? Number(db.discount_percent) : 0,
    discountValue: db.discount_value !== null ? Number(db.discount_value) : 0,
    totals: db.totals,
    config: db.config,
    materials: db.materials || [],
    thirdPartyItems: db.third_party_items || [],
    internalServices: db.internal_services || [],
    machiningTypes: db.machining_types || [],
    productionStages: configObj.productionStages || undefined,
    crmStatus: configObj.crmStatus || undefined,
    proposalItems: configObj.proposalItems || undefined,
    commercialTerms: configObj.commercialTerms || undefined,
    representativeName: configObj.representativeName || undefined,
    representativePhone: configObj.representativePhone || undefined,
    representativeEmail: configObj.representativeEmail || undefined,
  };
}

export function mapBudgetToDbBudget(b: BudgetDraft) {
  // Inject crmStatus and productionStages into config object for persistent storage
  const configWithCrm = {
    ...(b.config || {}),
    productionStages: b.productionStages || [],
    crmStatus: b.crmStatus || 'quoting',
    proposalItems: b.proposalItems || [],
    commercialTerms: b.commercialTerms || null,
    representativeName: b.representativeName || null,
    representativePhone: b.representativePhone || null,
    representativeEmail: b.representativeEmail || null,
  };

  return {
    id: b.id,
    reference: b.reference || null,
    client_name: b.clientName,
    contact_name: b.contactName || null,
    mold_type: b.moldType || null,
    molding_material: b.moldingMaterial || null,
    product_quantity: b.productQuantity !== undefined ? b.productQuantity : null,
    delivery_time: b.deliveryTime || null,
    observations: b.observations || null,
    status: b.status || null,
    mold_description: b.moldDescription || '',
    date: b.date || null,
    mold_width: b.moldWidth,
    mold_length: b.moldLength,
    discount_percent: b.discountPercent || 0,
    discount_value: b.discountValue || 0,
    totals: b.totals,
    config: configWithCrm,
    materials: b.materials,
    third_party_items: b.thirdPartyItems,
    internal_services: b.internalServices,
    machining_types: b.machiningTypes || [],
  };
}

// --- DB SYNC OPERATIONS ---

// 1. Clients
export async function syncFetchClients(): Promise<Client[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapDbClientToClient);
}

export async function syncSaveClient(client: Client): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const dbClient = mapClientToDbClient(client);
  const { error } = await supabase
    .from('clients')
    .upsert(dbClient);
  if (error) throw error;
}

export async function syncDeleteClient(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// 2. Materials (Raw Materials)
export async function syncFetchMaterials(): Promise<RawMaterial[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapDbMaterialToRawMaterial);
}

export async function syncSaveRawMaterials(materials: RawMaterial[]): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const dbMaterials = materials.map(mapRawMaterialToDbMaterial);
  const { error } = await supabase
    .from('materials')
    .upsert(dbMaterials);
  if (error) throw error;
}

// 3. Services (Service rates)
export async function syncFetchServices(): Promise<any[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapDbServiceToService);
}

export async function syncSaveServices(services: any[]): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const dbServices = services.map(mapServiceToDbService);
  const { error } = await supabase
    .from('services')
    .upsert(dbServices);
  if (error) throw error;
}

// 4. Machining Types
export async function syncFetchMachiningTypes(): Promise<MachiningType[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('machining_types')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapDbMachiningToMachining);
}

export async function syncSaveMachiningTypes(types: MachiningType[]): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const dbTypes = types.map(mapMachiningToDbMachining);
  const { error } = await supabase
    .from('machining_types')
    .upsert(dbTypes);
  if (error) throw error;
}

// 5. Standard components catalog
export async function syncFetchStandardComponents(): Promise<StandardComponentStock[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('standard_components')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map((component: any) => ({
    id: component.id,
    catalog: component.catalog as StandardComponentStock['catalog'],
    code: component.code,
    name: component.name,
    stock: Number(component.stock || 0),
    minStock: Number(component.min_stock || 0),
    price: Number(component.price || 0),
  }));
}

export async function syncSaveStandardComponents(components: StandardComponentStock[]): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const { data: existing, error: readError } = await supabase.from('standard_components').select('id');
  if (readError) throw readError;
  const activeIds = new Set(components.map(component => component.id));
  const removedIds = (existing || []).map((row: any) => row.id).filter((id: string) => !activeIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase.from('standard_components').delete().in('id', removedIds);
    if (error) throw error;
  }
  if (!components.length) return;

  const payload = components.map(component => ({
    id: component.id,
    catalog: component.catalog,
    code: component.code,
    name: component.name,
    stock: component.stock,
    min_stock: component.minStock,
    price: component.price,
  }));
  const { error } = await supabase.from('standard_components').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

// 6. Budgets (Drafts)
export async function syncFetchBudgets(): Promise<BudgetDraft[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbBudgetToBudget);
}

export async function syncSaveBudget(budget: BudgetDraft): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const dbBudget = mapBudgetToDbBudget(budget);
  const { data, error } = await supabase
    .from('budgets')
    .upsert(dbBudget, { onConflict: 'id' })
    .select('id');
  if (error) throw error;
  if (!data || data.length !== 1) {
    throw new Error('O Supabase não confirmou a gravação do orçamento.');
  }
}

export async function syncDeleteBudget(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ================================================================
// ERP OPERATIONAL SYNC — Modules 2–11
// ================================================================

// --- Mappers ---

function mapDbProjectToProject(db: any): MatrixProject {
  return {
    id: db.id,
    reference: db.reference,
    clientName: db.client_name,
    moldDescription: db.mold_description,
    moldType: db.mold_type,
    moldingMaterial: db.molding_material,
    productQuantity: Number(db.product_quantity),
    deliveryTime: db.delivery_time,
    status: db.status,
    date: db.date,
    moldWidth: Number(db.mold_width),
    moldLength: Number(db.mold_length),
    subprojects: db.subprojects || [],
    bom: db.bom || [],
    revisions: db.revisions || [],
    costs: db.costs || { orçado: 0, real: 0, detalhado: { materials: 0, normalizados: 0, horasMaquina: 0, maoDeObra: 0, terceiros: 0, refugo: 0 } },
    documents: db.documents || [],
  };
}

function mapProjectToDb(p: MatrixProject) {
  return {
    id: p.id,
    reference: p.reference,
    client_name: p.clientName,
    mold_description: p.moldDescription,
    mold_type: p.moldType,
    molding_material: p.moldingMaterial,
    product_quantity: p.productQuantity,
    delivery_time: p.deliveryTime,
    status: p.status,
    date: p.date,
    mold_width: p.moldWidth,
    mold_length: p.moldLength,
    subprojects: p.subprojects,
    bom: p.bom,
    revisions: p.revisions,
    costs: p.costs,
    documents: p.documents,
  };
}

function mapDbStockToRawStock(db: any): RawMaterialStock {
  return {
    id: db.id,
    type: db.type,
    dimensions: db.dimensions,
    weight: Number(db.weight),
    batch: db.batch,
    certificateUrl: db.certificate_url || undefined,
    status: db.status,
    reservedForProjId: db.reserved_for_proj_id || undefined,
    qualityDureza: db.quality_dureza || undefined,
  };
}

function mapRawStockToDb(s: RawMaterialStock) {
  return {
    id: s.id,
    type: s.type,
    dimensions: s.dimensions,
    weight: s.weight,
    batch: s.batch,
    certificate_url: s.certificateUrl || null,
    status: s.status,
    reserved_for_proj_id: s.reservedForProjId || null,
    quality_dureza: s.qualityDureza || null,
  };
}

function mapDbInspectionToInspection(db: any): QualityInspection {
  return {
    id: db.id,
    projectId: db.project_id,
    projectName: db.project_name,
    bomItemId: db.bom_item_id,
    bomItemName: db.bom_item_name,
    operatorName: db.operator_name,
    date: db.date,
    dimensionsMeasured: db.dimensions_measured || [],
    overallStatus: db.overall_status,
    cmmReportUrl: db.cmm_report_url || undefined,
    nonConformanceId: db.non_conformance_id || undefined,
  };
}

function mapInspectionToDb(i: QualityInspection) {
  return {
    id: i.id,
    project_id: i.projectId,
    project_name: i.projectName,
    bom_item_id: i.bomItemId,
    bom_item_name: i.bomItemName,
    operator_name: i.operatorName,
    date: i.date,
    dimensions_measured: i.dimensionsMeasured,
    overall_status: i.overallStatus,
    cmm_report_url: i.cmmReportUrl || null,
    non_conformance_id: i.nonConformanceId || null,
  };
}

function mapDbRncToRnc(db: any): NonConformance {
  return {
    id: db.id,
    projectId: db.project_id,
    projectName: db.project_name,
    bomItemId: db.bom_item_id,
    bomItemName: db.bom_item_name,
    classification: db.classification,
    rootCause5Whys: db.root_cause_5whys || [],
    ishikawa: db.ishikawa || { method: '', machine: '', material: '', manpower: '', measurement: '', environment: '' },
    actionPlan: db.action_plan,
    responsible: db.responsible,
    deadline: db.deadline,
    cost: Number(db.cost),
    status: db.status,
  };
}

function mapRncToDb(r: NonConformance) {
  return {
    id: r.id,
    project_id: r.projectId,
    project_name: r.projectName,
    bom_item_id: r.bomItemId,
    bom_item_name: r.bomItemName,
    classification: r.classification,
    root_cause_5whys: r.rootCause5Whys,
    ishikawa: r.ishikawa,
    action_plan: r.actionPlan,
    responsible: r.responsible,
    deadline: r.deadline || null,
    cost: r.cost,
    status: r.status,
  };
}

function mapDbMilestoneToMilestone(db: any): BillingMilestone {
  return {
    id: db.id,
    projectId: db.project_id,
    projectName: db.project_name,
    description: db.description,
    percent: Number(db.percent),
    value: Number(db.value),
    dueDate: db.due_date,
    status: db.status,
  };
}

function mapMilestoneToDb(m: BillingMilestone) {
  return {
    id: m.id,
    project_id: m.projectId,
    project_name: m.projectName,
    description: m.description,
    percent: m.percent,
    value: m.value,
    due_date: m.dueDate || null,
    status: m.status,
  };
}

function mapDbTransactionToTransaction(db: any): CashTransaction {
  return {
    id: db.id,
    projectId: db.project_id,
    projectName: db.project_name,
    type: db.type,
    category: db.category,
    description: db.description,
    value: Number(db.value),
    date: db.date,
    status: db.status,
  };
}

function mapTransactionToDb(t: CashTransaction) {
  return {
    id: t.id,
    project_id: t.projectId,
    project_name: t.projectName,
    type: t.type,
    category: t.category,
    description: t.description,
    value: t.value,
    date: t.date,
    status: t.status,
  };
}

function mapDbMaintLogToMaintLog(db: any): MaintenanceLog {
  return {
    id: db.id,
    projectId: db.project_id,
    projectName: db.project_name,
    cycles: Number(db.cycles),
    type: db.type,
    description: db.description,
    partsReplaced: db.parts_replaced || [],
    cost: Number(db.cost),
    date: db.date,
    responsible: db.responsible,
    isWarranty: Boolean(db.is_warranty),
    status: db.status,
  };
}

function mapMaintLogToDb(m: MaintenanceLog) {
  return {
    id: m.id,
    project_id: m.projectId,
    project_name: m.projectName,
    cycles: m.cycles,
    type: m.type,
    description: m.description,
    parts_replaced: m.partsReplaced,
    cost: m.cost,
    date: m.date,
    responsible: m.responsible,
    is_warranty: m.isWarranty,
    status: m.status,
  };
}

// --- 7. ERP Projects ---

export async function syncFetchErpProjects(): Promise<MatrixProject[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('erp_projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbProjectToProject);
}

export async function syncSaveErpProject(project: MatrixProject): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('erp_projects')
    .upsert(mapProjectToDb(project), { onConflict: 'id' });
  if (error) throw error;
}

export async function syncDeleteErpProject(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.from('erp_projects').delete().eq('id', id);
  if (error) throw error;
}

// --- 8. Raw Material Stock ---

export async function syncFetchRawStock(): Promise<RawMaterialStock[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('erp_raw_material_stock')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbStockToRawStock);
}

export async function syncSaveRawStockItem(item: RawMaterialStock): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('erp_raw_material_stock')
    .upsert(mapRawStockToDb(item), { onConflict: 'id' });
  if (error) throw error;
}

export async function syncDeleteRawStockItem(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.from('erp_raw_material_stock').delete().eq('id', id);
  if (error) throw error;
}

// --- 9. Quality Inspections ---

export async function syncFetchInspections(): Promise<QualityInspection[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('erp_quality_inspections')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbInspectionToInspection);
}

export async function syncSaveInspection(inspection: QualityInspection): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('erp_quality_inspections')
    .upsert(mapInspectionToDb(inspection), { onConflict: 'id' });
  if (error) throw error;
}

export async function syncDeleteInspection(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.from('erp_quality_inspections').delete().eq('id', id);
  if (error) throw error;
}

// --- 10. Non-Conformances (RNCs) ---

export async function syncFetchNonConformances(): Promise<NonConformance[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('erp_non_conformances')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbRncToRnc);
}

export async function syncSaveNonConformance(rnc: NonConformance): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('erp_non_conformances')
    .upsert(mapRncToDb(rnc), { onConflict: 'id' });
  if (error) throw error;
}

export async function syncDeleteNonConformance(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.from('erp_non_conformances').delete().eq('id', id);
  if (error) throw error;
}

// --- 11. Billing Milestones ---

export async function syncFetchMilestones(): Promise<BillingMilestone[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('erp_billing_milestones')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbMilestoneToMilestone);
}

export async function syncSaveMilestone(milestone: BillingMilestone): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('erp_billing_milestones')
    .upsert(mapMilestoneToDb(milestone), { onConflict: 'id' });
  if (error) throw error;
}

export async function syncDeleteMilestone(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.from('erp_billing_milestones').delete().eq('id', id);
  if (error) throw error;
}

// --- 12. Cash Transactions ---

export async function syncFetchTransactions(): Promise<CashTransaction[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('erp_cash_transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbTransactionToTransaction);
}

export async function syncSaveTransaction(transaction: CashTransaction): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('erp_cash_transactions')
    .upsert(mapTransactionToDb(transaction), { onConflict: 'id' });
  if (error) throw error;
}

export async function syncDeleteTransaction(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.from('erp_cash_transactions').delete().eq('id', id);
  if (error) throw error;
}

// --- 13. Maintenance Logs ---

export async function syncFetchMaintenanceLogs(): Promise<MaintenanceLog[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('erp_maintenance_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbMaintLogToMaintLog);
}

export async function syncSaveMaintenanceLog(log: MaintenanceLog): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('erp_maintenance_logs')
    .upsert(mapMaintLogToDb(log), { onConflict: 'id' });
  if (error) throw error;
}

export async function syncDeleteMaintenanceLog(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.from('erp_maintenance_logs').delete().eq('id', id);
  if (error) throw error;
}
