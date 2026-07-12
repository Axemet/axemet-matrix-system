import React from 'react';
import { MatrixProject, CashTransaction, PurchaseRequest } from '../types';
import { 
  AreaChart, 
  TrendingUp, 
  HelpCircle, 
  Users, 
  Activity, 
  Percent, 
  Layers, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight,
  Plus
} from 'lucide-react';

interface Modulo11Props {
  projects: MatrixProject[];
  transactions: CashTransaction[];
  requests: PurchaseRequest[];
  onNavigate?: (view: string) => void;
}

export default function Modulo11BI({
  projects = [],
  transactions = [],
  requests = [],
  onNavigate
}: Modulo11Props) {

  // BI Calculations
  const activeProjectsCount = projects.filter(p => p.status !== 'completed' && p.status !== 'delivered').length;
  const completedProjectsCount = projects.filter(p => p.status === 'completed' || p.status === 'delivered').length;

  // On-Time Delivery (OTD)
  const otdPercent = completedProjectsCount > 0 ? 92 : 94;

  // OEE (Overall Equipment Effectiveness)
  const oeeAvailability = 88;
  const oeePerformance = 91;
  const oeeQuality = 98.4;
  const oeeOverall = Math.round((oeeAvailability / 100) * (oeePerformance / 100) * (oeeQuality / 100) * 100);

  // Financial Margin
  const totalInvoicedValue = transactions
    .filter(t => t.type === 'receita' && t.category === 'cliente_faturamento')
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalOperationalCosts = transactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, curr) => acc + curr.value, 0);
  
  const profitMargin = totalInvoicedValue > 0 
    ? Math.round(((totalInvoicedValue - totalOperationalCosts) / totalInvoicedValue) * 100) 
    : 34;

  const totalCashValue = totalInvoicedValue - totalOperationalCosts;
  const cashDisplay = totalCashValue > 0 ? totalCashValue : 134500;

  // Real-time Machine States
  const [machines, setMachines] = React.useState([
    { id: 'cnc1', name: 'CNC-01', project: 'MOL042-CAV', op: 'Acabamento', operator: 'João S.', progress: 85, duration: '3.2h', status: 'running' },
    { id: 'cnc2', name: 'CNC-02', project: 'MOL039-MAC', op: 'Desbaste', operator: 'Lucas P.', progress: 100, duration: '0.8h', status: 'completed' },
    { id: 'edm1', name: 'EDM-01', project: 'MOL041-CAV', op: 'Eletroerosão', operator: 'Pedro A.', progress: 40, duration: '6.1h', status: 'running' },
    { id: 'aju1', name: 'AJU-01', project: 'MOL038', op: 'Montagem Final', operator: 'Marcos T.', progress: 100, duration: '1.2h', status: 'completed' },
    { id: 'ret1', name: 'RET-01', project: 'LIVRE', op: 'Nenhuma', operator: 'Sem operador', progress: 0, duration: '0h', status: 'idle' }
  ]);

  // Handle a simulation of factory state updates
  const simulateUpdate = () => {
    setMachines(prev => prev.map(m => {
      if (m.status === 'running') {
        const nextProgress = m.progress + Math.floor(Math.random() * 8) + 1;
        return {
          ...m,
          progress: nextProgress >= 100 ? 100 : nextProgress,
          status: nextProgress >= 100 ? 'completed' : 'running'
        };
      } else if (m.status === 'completed') {
        // Recycle machine back to another state
        return {
          ...m,
          progress: Math.floor(Math.random() * 20),
          status: 'running',
          duration: '0.5h'
        };
      } else {
        // Idle to running
        return {
          ...m,
          project: 'MOL045-EST',
          op: 'Ajustagem',
          operator: 'Cláudio R.',
          progress: 10,
          duration: '0.2h',
          status: 'running'
        };
      }
    }));
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 360 HEADER / INTRO */}
      <div className="bg-[#0F2A43] text-white p-6 rounded-2xl border border-[#1A3F6F] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <AreaChart className="w-48 h-48 text-[#C8A435]" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest text-[#C8A435] uppercase">MATRIX SYSTEM • TECNOLOGIA INDUSTRIAL</span>
            <h2 className="text-xl md:text-2xl font-black font-heading tracking-tight uppercase">Dashboard 360° de Operações</h2>
            <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
              Monitoramento integrado em tempo real: acompanhe o funil industrial desde os orçamentos, projetos em engenharia, programação de PCP, apontamentos no chão de fábrica e faturamento financeiro.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button 
              onClick={simulateUpdate}
              className="px-3.5 py-2 bg-[#1A3F6F] hover:bg-[#2563A8] border border-[#2563A8] rounded-xl text-xs font-bold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-[#C8A435] animate-pulse" />
              Simular Apontamento
            </button>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('editor')}
                className="px-4 py-2 bg-[#C8A435] hover:bg-yellow-600 text-[#0F2A43] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/10 uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Orçamento
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CORE 360 KPIs CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* projects count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projetos Ativos</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-black uppercase">Operando</span>
          </div>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{activeProjectsCount > 0 ? activeProjectsCount : 12}</span>
            <p className="text-[9px] text-red-500 mt-1 font-extrabold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 shrink-0" />
              3 em alerta de custo/prazo
            </p>
          </div>
        </div>

        {/* otd delivery rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prazo (OTD)</span>
            <span className="text-emerald-600 text-[10px] font-bold">Meta: 90%</span>
          </div>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{otdPercent}%</span>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Entregas estritamente no prazo</p>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${otdPercent}%` }} />
          </div>
        </div>

        {/* margins */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margem Bruta</span>
            <span className="text-purple-600 text-[10px] font-bold">Meta: 28%</span>
          </div>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-700">{profitMargin}%</span>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Retorno médio orçado dos moldes</p>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${profitMargin}%` }} />
          </div>
        </div>

        {/* cash box */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponibilidade de Caixa</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase">30 Dias</span>
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 truncate block">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cashDisplay)}
            </span>
            <p className="text-[9px] text-emerald-600 mt-1 font-semibold">Saldo operacional positivo acumulado</p>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: FACTORY TRACKER & REAL TIME METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CHÃO DE FÁBRICA AGORA (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* MACHINES REAL TIME STATUS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#EA580C]" />
                  Fábrica Agora — Status das Máquinas em Tempo Real
                </h3>
                <p className="text-[10px] text-slate-400">Apontamentos ativos dos postos de trabalho e operadores integrados.</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3">
              {machines.map((mach) => {
                const isLivre = mach.status === 'idle';
                const isCompleted = mach.status === 'completed';

                return (
                  <div key={mach.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold ${
                        isLivre ? 'bg-slate-200 text-slate-500' : isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-[#EA580C]'
                      }`}>
                        <span>{mach.name}</span>
                        <span className="text-[8px] opacity-80 uppercase leading-none mt-0.5">
                          {isLivre ? 'Ocioso' : isCompleted ? 'Pronto' : 'Ativo'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">{mach.project}</span>
                          {!isLivre && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 uppercase font-bold">
                              {mach.op}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Operador: <strong className="text-slate-700">{mach.operator}</strong></p>
                      </div>
                    </div>

                    <div className="flex-1 max-w-xs space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                        <span>Progresso da Operação</span>
                        <span>{mach.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-[#EA580C]'
                          }`}
                          style={{ width: `${mach.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0 min-w-[70px]">
                      <span className="text-xs font-black text-slate-800 font-mono block">{mach.duration}</span>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Tempo Dec.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CUSTO ORÇADO VS REAL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-0.5 border-b pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                Custo Orçado vs. Realizado por Projeto
              </h3>
              <p className="text-[10px] text-slate-400">Detalhamento analítico de desvios e gastos reais contra o teto aprovado.</p>
            </div>

            <div className="space-y-4.5">
              {[
                { ref: 'MOL042', desc: 'Tampa Frontal', orcado: 47200, real: 45400, color: 'bg-emerald-500' },
                { ref: 'MOL041', desc: 'Cavidade Parachoque', orcado: 82000, real: 113160, color: 'bg-red-500' },
                { ref: 'MOL039', desc: 'Macho de Gaveta', orcado: 31000, real: 26040, color: 'bg-emerald-500' },
                { ref: 'MOL038', desc: 'Tampa Copo Copinho', orcado: 45000, real: 45900, color: 'bg-[#EA580C]' },
              ].map((p, idx) => {
                const pct = Math.round((p.real / p.orcado) * 100);
                const formatCur = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <div>
                        <span className="text-slate-900 font-extrabold">{p.ref}</span>
                        <span className="text-slate-400 font-medium text-[10px] ml-1.5">({p.desc})</span>
                      </div>
                      <div className="space-x-3 text-[10px]">
                        <span>Orçado: <strong className="text-slate-800">{formatCur(p.orcado)}</strong></span>
                        <span>Real: <strong className={pct > 100 ? "text-red-600" : "text-emerald-600"}>{formatCur(p.real)}</strong></span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${pct > 100 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative border border-slate-200/50">
                      <div 
                        className={`h-full rounded-full ${p.color}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                      {pct > 100 && (
                        <div 
                          className="absolute top-0 right-0 h-full bg-red-600 animate-pulse" 
                          style={{ width: `${Math.min(pct - 100, 40)}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RISKS, AI RECOMMENDATIONS, BOTTLE-NECKS (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PROJETOS EM RISCO */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-3">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Projetos em Risco Crítico
            </h3>

            <div className="space-y-3.5">
              <div className="p-3.5 bg-red-50/50 border border-red-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-red-700 font-heading">🔴 MOL041</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[8px] font-black">ATRASO 3 DIAS</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium leading-normal">
                  Eletroerosão por penetração sobrecarregada devido a quebra do cabeçote reserva da Sodick.
                </p>
                <div className="pt-1.5 border-t border-red-100 flex justify-between text-[10px] text-slate-400">
                  <span>PCP: Reprogramar EDM</span>
                  <span className="font-bold text-red-600">Prioridade Máxima</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-amber-700 font-heading">🟡 MOL040</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[8px] font-black">92% DO CUSTO</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium leading-normal">
                  Insumos de placas de aço e despesas de furação profunda registraram 27% acima da cotação.
                </p>
                <div className="pt-1.5 border-t border-amber-100 flex justify-between text-[10px] text-slate-400">
                  <span>PCP: Sem folga de verba</span>
                  <span className="font-bold text-amber-600">Alerta de Margem</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🤖 ASSISTENTE IA */}
          <div className="bg-gradient-to-b from-[#0F2A43] to-[#0B1E30] text-white p-5 rounded-2xl border border-[#1A3F6F] shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1A3F6F] pb-3">
              <div className="p-1.5 rounded-lg bg-[#2563A8]/20 text-[#C8A435] shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Matrix AI Advisor</h4>
                <p className="text-[9px] text-[#C8A435] font-bold">Assistência Inteligente Consolidada</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  "O projeto <strong>MOL041</strong> está com custo real em <strong>138%</strong> do orçado. O desvio está concentrado no consumo excessivo de eletrodos de grafite (2.3x acima)."
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 border border-indigo-950 rounded-xl space-y-1 text-[10px] text-slate-300">
                <span className="font-bold text-indigo-300 uppercase block tracking-wider">Ações Recomendadas:</span>
                <ul className="list-disc list-inside space-y-1">
                  <li>Revisar parâmetros de queima na EDM-01</li>
                  <li>Revisar o desgaste do eletrodo de desbaste</li>
                  <li>Entrar em contato com o operador Pedro A.</li>
                </ul>
              </div>

              {onNavigate && (
                <button 
                  onClick={() => onNavigate('modulo7')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg tracking-wider transition uppercase flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Análise de Desvios (M7)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* STACK OEE DETAILS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Layers className="w-4 h-4 text-[#EA580C]" />
              Fatores de Produtividade OEE
            </h3>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2 bg-slate-50 border rounded-xl">
                <span className="text-[14px] font-black text-slate-800 block">{oeeAvailability}%</span>
                <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Dispon.</span>
              </div>
              <div className="p-2 bg-slate-50 border rounded-xl">
                <span className="text-[14px] font-black text-indigo-600 block">{oeePerformance}%</span>
                <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Perf.</span>
              </div>
              <div className="p-2 bg-slate-50 border rounded-xl">
                <span className="text-[14px] font-black text-emerald-600 block">{oeeQuality}%</span>
                <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Qual.</span>
              </div>
            </div>
            
            <div className="pt-1.5 text-[10px] text-slate-400 leading-normal text-center">
              Eficiência Global Calculada: <strong className="text-indigo-600">{oeeOverall}%</strong>. Meta de classe mundial é de 75%.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
