import { isSupabaseConfigured, supabase } from './supabase';
export type OrganizationProfile = { id?: string; name: string; cnpj?: string | null; phone?: string | null; email?: string | null; address?: string | null; logo_url?: string | null };
const ensure=()=>{if(!isSupabaseConfigured)throw new Error('Supabase não está configurado.');};
export async function getOrganizationProfile():Promise<OrganizationProfile|null>{ensure();const {data,error}=await supabase.from('organizations').select('id,name,cnpj,phone,email,address,logo_url').maybeSingle();if(error)throw error;return data;}
export async function updateOrganizationProfile(profile:OrganizationProfile):Promise<OrganizationProfile>{
  ensure();
  if(!profile.id) throw new Error('Organização não encontrada. Atualize a página e tente novamente.');
  const {id,...values}=profile;
  const {data,error}=await supabase.from('organizations')
    .update({...values,updated_at:new Date().toISOString()})
    .eq('id',id)
    .select('id,name,cnpj,phone,email,address,logo_url')
    .maybeSingle();
  if(error) throw error;
  if(!data) throw new Error('Não foi possível confirmar a gravação da organização. Verifique as permissões deste usuário.');
  // This denormalized field only feeds legacy labels. The organization record is
  // the source of truth, so a failed sync must not invalidate a saved logo.
  const {error:profileError}=await supabase.from('profiles').update({organization:profile.name,updated_at:new Date().toISOString()}).eq('organization_id',id);
  if(profileError) console.warn('A organização foi salva, mas não foi possível sincronizar o nome nos perfis.', profileError);
  return data;
}
