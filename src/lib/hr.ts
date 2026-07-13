import { isSupabaseConfigured, supabase } from './supabase';

export type HrSector = { id: string; name: string; code: string; leader: string; shift: string; active: boolean };
export type HrRole = { id: string; title: string; cbo: string; sectorId: string; skills: string; active: boolean };
export type HrEmployee = { id: string; name: string; roleId: string; sectorId: string; shift: string; status: 'Ativo'|'Férias'|'Afastado'|'Inativo'; skills: string; nr12Expiry: string; asoExpiry: string };
export type HrMachine = { id: string; code: string; name: string; sectorId: string; type: string; status: 'Disponível'|'Em operação'|'Manutenção'|'Bloqueada'; authorizedEmployeeIds: string[]; maintenanceDue: string };

const ensure = () => { if (!isSupabaseConfigured) throw new Error('O Supabase não está configurado.'); };
const employeeStatus: Record<string, HrEmployee['status']> = { ativo: 'Ativo', ferias: 'Férias', afastado: 'Afastado', inativo: 'Inativo' };
const machineStatus: Record<string, HrMachine['status']> = { disponivel: 'Disponível', em_operacao: 'Em operação', manutencao: 'Manutenção', bloqueada: 'Bloqueada' };
const dbEmployeeStatus: Record<HrEmployee['status'], string> = { Ativo: 'ativo', 'Férias': 'ferias', Afastado: 'afastado', Inativo: 'inativo' };
const dbMachineStatus: Record<HrMachine['status'], string> = { Disponível: 'disponivel', 'Em operação': 'em_operacao', Manutenção: 'manutencao', Bloqueada: 'bloqueada' };

export async function loadHrData(): Promise<{sectors: HrSector[]; roles: HrRole[]; employees: HrEmployee[]; machines: HrMachine[]}> {
  ensure();
  const [sectorR, roleR, employeeR, machineR] = await Promise.all([
    supabase.from('work_sectors').select('*').order('name'), supabase.from('job_roles').select('*').order('title'),
    supabase.from('employee_records').select('*').order('employee_name'), supabase.from('work_machines').select('*, machine_authorizations(employee_id)').order('code')
  ]);
  for (const r of [sectorR, roleR, employeeR, machineR]) if (r.error) throw r.error;
  return {
    sectors: (sectorR.data || []).map((x:any) => ({id:x.id,name:x.name,code:x.code,leader:'',shift:x.default_shift || '',active:x.active})),
    roles: (roleR.data || []).map((x:any) => ({id:x.id,title:x.title,cbo:x.cbo_code || '',sectorId:x.sector_id || '',skills:x.required_skills || '',active:x.active})),
    employees: (employeeR.data || []).map((x:any) => ({id:x.id,name:x.employee_name,roleId:x.job_role_id || '',sectorId:x.sector_id || '',shift:x.shift || '',status:employeeStatus[x.employment_status] || 'Ativo',skills:x.skills || '',nr12Expiry:x.nr12_expires_on || '',asoExpiry:x.aso_expires_on || ''})),
    machines: (machineR.data || []).map((x:any) => ({id:x.id,code:x.code,name:x.name,sectorId:x.sector_id || '',type:x.machine_type || '',status:machineStatus[x.operational_status] || 'Disponível',authorizedEmployeeIds:(x.machine_authorizations || []).filter((a:any)=>a.authorized !== false).map((a:any)=>a.employee_id),maintenanceDue:x.maintenance_due_on || ''}))
  };
}
async function save(table: string, id: string | undefined, values: any) { ensure(); const persisted = !!id && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id); const q = persisted ? supabase.from(table).update({...values,updated_at:new Date().toISOString()}).eq('id', id) : supabase.from(table).insert(values); const {error} = await q; if (error) throw error; }
export const saveSector = (x: HrSector) => save('work_sectors', x.id, {name:x.name,code:x.code,default_shift:x.shift || null,active:x.active});
export const saveRole = (x: HrRole) => save('job_roles', x.id, {title:x.title,cbo_code:x.cbo || null,sector_id:x.sectorId || null,required_skills:x.skills || null,active:x.active});
export const saveEmployee = (x: HrEmployee) => save('employee_records', x.id, {employee_name:x.name,job_role_id:x.roleId || null,sector_id:x.sectorId || null,shift:x.shift || null,employment_status:dbEmployeeStatus[x.status],skills:x.skills || null,nr12_expires_on:x.nr12Expiry || null,aso_expires_on:x.asoExpiry || null});
export async function saveMachine(x: HrMachine) { await save('work_machines', x.id, {code:x.code,name:x.name,sector_id:x.sectorId || null,machine_type:x.type || null,operational_status:dbMachineStatus[x.status],maintenance_due_on:x.maintenanceDue || null}); }
export async function deleteHrRecord(table: 'work_sectors'|'job_roles'|'employee_records'|'work_machines', id: string) { ensure(); const {error}=await supabase.from(table).delete().eq('id',id); if(error) throw error; }
export async function saveOperationAssignment(projectReference: string, operationReference: string, employeeId: string, machineId?: string) {
  ensure();
  const { error } = await supabase.from('operation_assignments').upsert({ project_reference: projectReference, operation_reference: operationReference, employee_id: employeeId, machine_id: machineId || null }, { onConflict: 'organization_id,project_reference,operation_reference' });
  if (error) throw error;
}
