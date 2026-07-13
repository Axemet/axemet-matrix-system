import { createClient } from '@supabase/supabase-js';
import { Client, RawMaterial, InternalServiceItem, MachiningType, BudgetDraft } from '../types';

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

// 5. Budgets (Drafts)
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
