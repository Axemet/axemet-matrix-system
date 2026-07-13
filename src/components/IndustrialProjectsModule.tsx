import React from 'react';
import { ArrowRight, ClipboardCheck, Factory, RefreshCw } from 'lucide-react';
import { advanceManufacturingProject, listManufacturingProjects, productionStages, type ManufacturingProject } from '../lib/industrial';

const stageIndex = (status: string) => Math.max(0, productionStages.findIndex(([id]) => id === status));
const stageName = (status: string) => productionStages.find(([id]) => id === status)?.[1] || status;

export default function IndustrialProjectsModule({ canManage, showToast }: { canManage: boolean; showToast: (text: string, type?: 'success'|'error'|'info') => void }) {
  const [projects, setProjects] = React.useState<ManufacturingProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [changing, setChanging] = React.useState<string | null>(null);
  const reload = React.useCallback(async () => { try { setLoading(true); setProjects(await listManufacturingProjects()); } catch (e: any) { showToast(e.message || 'Não foi possível carregar os projetos.', 'error'); } finally { setLoading(false); } }, [showToast]);
  React.useEffect(() => { reload(); }, [reload]);
  const advance = async (project: ManufacturingProject) => {
    const next = productionStages[stageIndex(project.status) + 1];
    if (!next) return showToast('Este projeto já está no estágio final.', 'info');
    try { setChanging(project.id); await advanceManufacturingProject(project.id, next[0], `Avanço para ${next[1]}`); await reload(); showToast(`Projeto movido para ${next[1]}.`, 'success'); }
    catch (e: any) { showToast(e.message || 'Não foi possível atualizar o estágio.', 'error'); }
    finally { setChanging(null); }
  };
  return <div className="space-y-6 animate-fadeIn pb-10">
    <section className="rh-hero rounded-2xl p-6 text-white"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-200">Fluxo industrial integrado</span><h2 className="mt-2 font-display text-2xl font-black">Projetos e ordens de fabricação</h2><p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-300">Todo projeto nasce de um orçamento aprovado. A rastreabilidade registra cada mudança de engenharia até entrega e garantia.</p></div><button onClick={reload} className="rh-primary"><RefreshCw className="h-4 w-4"/>Atualizar</button></div></section>
    {!canManage && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Acesso de consulta. Somente gestores e administradores podem movimentar o fluxo.</div>}
    {loading ? <p className="py-16 text-center text-sm text-slate-400">Carregando ordens de fabricação...</p> : projects.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm"><Factory className="mx-auto h-12 w-12 text-slate-200"/><h3 className="mt-4 text-sm font-bold text-slate-700">Nenhum projeto de fabricação aberto</h3><p className="mt-2 text-xs text-slate-400">A aprovação de uma proposta comercial cria a primeira ordem automaticamente.</p></section> : <div className="grid gap-4 xl:grid-cols-2">{projects.map(project => { const index = stageIndex(project.status); const progress = project.status === 'entregue' ? 100 : Math.round((index / (productionStages.length - 3)) * 100); const next = productionStages[index + 1]; return <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black tracking-widest text-[#2d6db2]">{project.project_code}</p><h3 className="mt-1 text-sm font-black uppercase text-slate-900">{project.description}</h3><p className="mt-1 text-xs text-slate-400">Prazo: {project.due_date ? new Date(`${project.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'a definir'}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">{stageName(project.status)}</span></div><div className="mt-5"><div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-slate-400"><span>Andamento</span><span>{Math.max(0, Math.min(100, progress))}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#2d6db2] to-[#4db2a2]" style={{width: `${Math.max(0, Math.min(100, progress))}%`}}/></div><div className="mt-4 flex flex-wrap gap-1">{productionStages.slice(0, 9).map(([id, name], i) => <span key={id} title={name} className={`h-2 w-6 rounded-full ${i <= index ? 'bg-[#2d6db2]' : 'bg-slate-100'}`}/>)}</div></div>{canManage && next && !['entregue','cancelado','garantia'].includes(project.status) && <button disabled={changing === project.id} onClick={() => advance(project)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#2d6db2] disabled:opacity-50"><ClipboardCheck className="h-4 w-4"/>Concluir {stageName(project.status)}<ArrowRight className="h-4 w-4"/></button>}</article>})}</div>}
  </div>;
}
