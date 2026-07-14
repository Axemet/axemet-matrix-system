import React from 'react';
import { Activity, ArrowRight, ClipboardList, Factory, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { listManufacturingProjects, productionStages, type ManufacturingProject } from '../lib/industrial';
import { loadHrData, type HrMachine } from '../lib/hr';

interface Modulo11Props {
  onNavigate?: (view: string) => void;
  projects?: unknown;
  transactions?: unknown;
  requests?: unknown;
}

const stageName = (stage: string) => productionStages.find(([id]) => id === stage)?.[1] || stage;
const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);

export default function Modulo11BI({ onNavigate }: Modulo11Props) {
  const [projects, setProjects] = React.useState<ManufacturingProject[]>([]);
  const [machines, setMachines] = React.useState<HrMachine[]>([]);
  const [employeeCount, setEmployeeCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const reload = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [projectData, hr] = await Promise.all([listManufacturingProjects(), loadHrData()]);
      setProjects(projectData);
      setMachines(hr.machines);
      setEmployeeCount(hr.employees.filter((e) => e.status === 'Ativo').length);
    } catch (e: any) {
      setError(e.message || 'Não foi possível atualizar o painel.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const active = projects.filter((p) => !['entregue', 'garantia', 'cancelado'].includes(p.status));
  const delivered = projects.filter((p) => p.status === 'entregue');
  const overdue = active.filter((p) => p.due_date && new Date(`${p.due_date}T23:59:59`) < new Date());
  const dueSoon = active.filter(
    (p) =>
      p.due_date &&
      new Date(`${p.due_date}T23:59:59`).getTime() < Date.now() + 7 * 86400000 &&
      new Date(`${p.due_date}T23:59:59`) >= new Date()
  );
  const valueInProgress = active.reduce((sum, p) => sum + Number(p.approved_budget_value || 0), 0);
  const operationalMachines = machines.filter((m) => m.status === 'Em operação').length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-slate-200">
      
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1423] via-[#0b0e14] to-[#0d1423] p-6 shadow-xl">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[var(--ax-accent)]/10 blur-3xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-[var(--ax-accent)] font-mono">
              Painel Corporativo Sincronizado
            </p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-white uppercase">
              Visão 360° da Operação
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-400 leading-relaxed">
              Indicadores de produção em tempo real gerados automaticamente a partir de orçamentos aprovados, máquinas ativas e dados de recursos humanos.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={reload}
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sincronizar
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('editor')}
                className="rounded-xl bg-[var(--ax-accent)]/10 border border-[var(--ax-accent)]/30 hover:bg-[var(--ax-accent)]/20 px-4 py-2.5 text-xs font-bold text-[var(--ax-accent)] transition cursor-pointer"
              >
                Novo Orçamento
              </button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-xs text-red-400 backdrop-blur-md">
          <span className="font-bold">Erro:</span> {error}
        </div>
      )}

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Projetos Ativos"
          value={String(active.length)}
          detail={`${overdue.length} atrasado(s)`}
          alert={overdue.length > 0}
        />
        <Metric
          label="Em Fabricação"
          value={String(projects.filter((p) => ['fabricacao', 'montagem', 'tryout', 'ajustes'].includes(p.status)).length)}
          detail={`${operationalMachines} máquina(s) em operação`}
        />
        <Metric
          label="Carteira em Produção"
          value={currency(valueInProgress)}
          detail="Valor aprovado dos projetos abertos"
        />
        <Metric
          label="Pessoas Ativas"
          value={String(employeeCount)}
          detail={`${machines.length} máquina(s) cadastrada(s)`}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0d1423]/50 py-24 text-center text-xs text-slate-500 font-mono tracking-wider">
          Sincronizando registros da organização...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main List */}
          <section className="lg:col-span-3 rounded-2xl border border-slate-800 bg-[#080d16]/70 p-6 shadow-xl backdrop-blur-md">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                  <ClipboardList className="h-4 w-4 text-[var(--ax-accent)]" />
                  Carteira de Projetos
                </h3>
                <p className="mt-1 text-[10px] text-slate-500">Fluxo ativo de fabricação</p>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('projetos')}
                  className="text-xs font-bold text-[var(--ax-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </header>

            {active.length === 0 ? (
              <Empty icon={Factory} text="Nenhuma ordem de fabricação ativa." />
            ) : (
              <div className="space-y-4">
                {active.slice(0, 6).map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-slate-800 bg-[#0c1220]/50 p-4 hover:border-slate-700/80 transition"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <span className="font-mono text-[10px] text-[var(--ax-accent)] bg-[var(--ax-accent)]/5 px-2 py-0.5 rounded border border-[var(--ax-accent)]/10">
                          {project.project_code}
                        </span>
                        <h4 className="mt-2 text-xs font-bold text-white leading-snug">{project.description}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {Math.round(Number(project.progress_pct || 0))}%
                      </span>
                    </div>

                    <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-slate-900 border border-slate-800/50">
                      <div
                        className="h-full bg-[var(--ax-accent)] shadow-[0_0_8px_rgba(234,88,12,0.4)] transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, Number(project.progress_pct || 0)))}%` }}
                      />
                    </div>

                    <div className="mt-3 flex justify-between text-[10px] text-slate-500 font-mono">
                      <span className="text-[var(--ax-accent)]/80 font-bold uppercase tracking-wider">
                        {stageName(project.status)}
                      </span>
                      <span>
                        Entrega:{' '}
                        <strong className="text-slate-300">
                          {project.due_date
                            ? new Date(`${project.due_date}T12:00:00`).toLocaleDateString('pt-BR')
                            : 'a definir'}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sidebar Panels */}
          <section className="lg:col-span-2 space-y-6">
            
            {/* Exceptions */}
            <div className="rounded-2xl border border-slate-800 bg-[#080d16]/70 p-6 shadow-xl backdrop-blur-md">
              <h3 className="flex items-center gap-2 border-b border-slate-800/80 pb-4 text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Alertas Críticos
              </h3>
              <div className="mt-4 space-y-3">
                {overdue.length === 0 && dueSoon.length === 0 ? (
                  <Empty icon={Activity} text="Nenhum alerta de prazo detectado." />
                ) : (
                  <>
                    {overdue.map((p) => (
                      <Alert key={p.id} project={p} text="Atrasado" tone="red" />
                    ))}
                    {dueSoon.map((p) => (
                      <Alert key={p.id} project={p} text="Entrega próxima" tone="amber" />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Machines list */}
            <div className="rounded-2xl border border-slate-800 bg-[#080d16]/70 p-6 shadow-xl backdrop-blur-md">
              <h3 className="flex items-center gap-2 border-b border-slate-800/80 pb-4 text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                <Factory className="h-4 w-4 text-[var(--ax-accent)]" />
                Estado do Parque Fabril
              </h3>
              <div className="mt-4 space-y-2">
                {machines.length === 0 ? (
                  <Empty icon={Factory} text="Cadastre as máquinas para monitorar." />
                ) : (
                  machines.slice(0, 5).map((machine) => (
                    <div
                      className="flex items-center justify-between rounded-xl bg-[#0c1220]/50 border border-slate-850 px-3 py-2.5"
                      key={machine.id}
                    >
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        {machine.code} · <span className="text-slate-400 font-sans">{machine.name}</span>
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border ${
                          machine.status === 'Em operação'
                            ? 'bg-emerald-950/40 text-emerald-450 border-emerald-900/30'
                            : machine.status === 'Manutenção'
                            ? 'bg-red-950/40 text-red-450 border-red-900/30'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {machine.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-500 font-mono">
        Indicadores consolidados a partir do Supabase Database • RLS Ativa
      </p>
    </div>
  );
}

function Metric({ label, value, detail, alert }: { label: string; value: string; detail: string; alert?: boolean }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#080d16]/70 p-5 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">{label}</p>
      <p className={`mt-2.5 truncate text-2xl font-black tracking-tight ${alert ? 'text-red-500' : 'text-white'}`}>
        {value}
      </p>
      <p className={`mt-2 text-[10px] font-medium ${alert ? 'font-bold text-red-400 animate-pulse' : 'text-slate-400'}`}>
        {detail}
      </p>
    </section>
  );
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="py-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-700 stroke-[1.5]" />
      <p className="mt-2 text-xs text-slate-500">{text}</p>
    </div>
  );
}

function Alert({ project, text, tone }: { project: ManufacturingProject; text: string; tone: 'red' | 'amber'; key?: string }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === 'red'
          ? 'border-red-900/30 bg-red-950/15 text-red-200'
          : 'border-amber-900/30 bg-amber-950/15 text-amber-250'
      }`}
    >
      <span className="font-mono text-[9px] font-black uppercase tracking-wider">
        {project.project_code} · {text}
      </span>
      <p className="mt-1.5 text-xs font-bold text-white leading-snug">{project.description}</p>
      {project.due_date && (
        <span className="block mt-2 text-[9px] font-mono text-slate-500">
          Prazo final: {new Date(`${project.due_date}T12:00:00`).toLocaleDateString('pt-BR')}
        </span>
      )}
    </div>
  );
}
