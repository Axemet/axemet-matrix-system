import React from 'react';
import { MatrixProject } from '../types';
import { Landmark, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Layers } from 'lucide-react';

interface Modulo7Props {
  projects: MatrixProject[];
  onSaveProject: (p: MatrixProject) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Modulo7Custos({
  projects,
  onSaveProject,
  showToast,
}: Modulo7Props) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');

  const activeProj = projects.find(p => p.id === selectedProjectId);

  // Cost inputs for simulating / adjusting actual project costs
  const [actualSteel, setActualSteel] = React.useState(0);
  const [actualNorm, setActualNorm] = React.useState(0);
  const [actualMachine, setActualMachine] = React.useState(0);
  const [actualLabor, setActualLabor] = React.useState(0);
  const [actualThirdParty, setActualThirdParty] = React.useState(0);
  const [actualScrap, setActualScrap] = React.useState(0);

  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  React.useEffect(() => {
    if (activeProj) {
      setActualSteel(activeProj.costs.detalhado.materials);
      setActualNorm(activeProj.costs.detalhado.normalizados);
      setActualMachine(activeProj.costs.detalhado.horasMaquina);
      setActualLabor(activeProj.costs.detalhado.maoDeObra);
      setActualThirdParty(activeProj.costs.detalhado.terceiros);
      setActualScrap(activeProj.costs.detalhado.refugo);
    }
  }, [selectedProjectId, activeProj]);

  const handleUpdateCosts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;

    const totalReal = actualSteel + actualNorm + actualMachine + actualLabor + actualThirdParty + actualScrap;

    const updatedProj: MatrixProject = {
      ...activeProj,
      costs: {
        orçado: activeProj.costs.orçado,
        real: totalReal,
        detalhado: {
          materials: Number(actualSteel),
          normalizados: Number(actualNorm),
          horasMaquina: Number(actualMachine),
          maoDeObra: Number(actualLabor),
          terceiros: Number(actualThirdParty),
          refugo: Number(actualScrap)
        }
      }
    };

    onSaveProject(updatedProj);
    showToast(`Custos reais do projeto "${activeProj.reference}" consolidados no ERP!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-purple-600" />
            Custos e Controladoria Industrial (Orçado vs Real)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analise desvios financeiros por categoria de custo e garanta que os moldes permaneçam dentro da margem de lucro estimada.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Selecione o Projeto:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 rounded-lg cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>({p.reference}) {p.clientName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeProj ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Detailed Budgeted vs Real metrics column */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Upper totals banner */}
            <div className="grid grid-cols-3 gap-4 border-b pb-5">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">Preço Contratado Orçado</span>
                <span className="text-xl font-extrabold text-slate-900">R$ {activeProj.costs.orçado.toLocaleString()}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">Custo Real Acumulado</span>
                <span className="text-xl font-extrabold text-purple-700">R$ {activeProj.costs.real.toLocaleString()}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">Margem Operacional</span>
                {(() => {
                  const profit = activeProj.costs.orçado - activeProj.costs.real;
                  const marginPct = activeProj.costs.orçado > 0 ? Math.round((profit / activeProj.costs.orçado) * 100) : 0;
                  const isLow = marginPct < 25;

                  return (
                    <span className={`text-xl font-extrabold block ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                      {marginPct}% (R$ {profit.toLocaleString()})
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Cost bar category details */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-600" /> Comparativo de Custo por Categoria de Custo
              </h3>

              {(() => {
                const categories = [
                  { label: 'Matérias primas (Aços)', real: activeProj.costs.detalhado.materials, maxEst: activeProj.costs.orçado * 0.25 },
                  { label: 'Normalizados e Catálogo', real: activeProj.costs.detalhado.normalizados, maxEst: activeProj.costs.orçado * 0.15 },
                  { label: 'Horas-Máquina (Fresa/EDM)', real: activeProj.costs.detalhado.horasMaquina, maxEst: activeProj.costs.orçado * 0.30 },
                  { label: 'Mão de Obra e Ajustagem', real: activeProj.costs.detalhado.maoDeObra, maxEst: activeProj.costs.orçado * 0.15 },
                  { label: 'Terceirização e Hardening', real: activeProj.costs.detalhado.terceiros, maxEst: activeProj.costs.orçado * 0.10 },
                  { label: 'Refugo & Não-Conformidade', real: activeProj.costs.detalhado.refugo, maxEst: activeProj.costs.orçado * 0.05 }
                ];

                return (
                  <div className="space-y-4">
                    {categories.map((cat, idx) => {
                      const ratio = cat.maxEst > 0 ? Math.round((cat.real / cat.maxEst) * 100) : 0;
                      const isOverBudget = cat.real > cat.maxEst;

                      return (
                        <div key={idx} className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center font-bold text-slate-800">
                            <span>{cat.label}</span>
                            <span className={isOverBudget ? 'text-red-600 font-extrabold animate-pulse' : 'text-slate-500'}>
                              Real: R$ {cat.real.toLocaleString()} / Orçado: R$ {Math.round(cat.maxEst).toLocaleString()} ({ratio}%)
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOverBudget ? 'bg-red-500' : ratio > 80 ? 'bg-amber-500' : 'bg-purple-600'
                              }`}
                              style={{ width: `${Math.min(ratio, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

          </div>

          {/* RIGHT: Financial simulator form */}
          <div className="space-y-6">
            
            {/* Live Controller / Update Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                💰 Simular / Ajustar Custos Reais (Controladoria)
              </h3>

              <form onSubmit={handleUpdateCosts} className="space-y-3.5 text-xs font-bold text-slate-700">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Aço e Matéria Prima (R$)</label>
                  <input
                    type="number"
                    value={actualSteel}
                    onChange={(e) => setActualSteel(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Acessórios Normalizados (R$)</label>
                  <input
                    type="number"
                    value={actualNorm}
                    onChange={(e) => setActualNorm(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Horas-Máquina CNC / EDM (R$)</label>
                  <input
                    type="number"
                    value={actualMachine}
                    onChange={(e) => setActualMachine(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mão de Obra Ajustagem (R$)</label>
                  <input
                    type="number"
                    value={actualLabor}
                    onChange={(e) => setActualLabor(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Tratamento Térmico (R$)</label>
                    <input
                      type="number"
                      value={actualThirdParty}
                      onChange={(e) => setActualThirdParty(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Refugos / Perdas (R$)</label>
                    <input
                      type="number"
                      value={actualScrap}
                      onChange={(e) => setActualScrap(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
                >
                  Atualizar Demonstrativo de Custos
                </button>
              </form>
            </div>

            {/* Threshold check notices */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs font-semibold space-y-1.5">
              <span className="text-[10px] text-amber-600 font-black uppercase block flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerta de Estouro de Margem
              </span>
              <p className="leading-relaxed">
                Quando o custo de fabricação ultrapassa o marco estimado, o faturamento comercial e os gestores recebem alertas de mitigação automática de desperdício no painel.
              </p>
            </div>

          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-white border rounded-2xl p-8 space-y-3">
          <Landmark className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
          <h3 className="font-extrabold text-slate-900 uppercase">Nenhum Molde em Produção para Cálculo</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Abra um projeto a partir do menu <strong>Engenharia</strong> para dar início ao acompanhamento financeiro de controladoria industrial.
          </p>
        </div>
      )}

    </div>
  );
}
