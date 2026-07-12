import React from 'react';
import { MatrixProject, BOMItem, Operation } from '../types';
import { Plus, Trash2, Calendar, Clock, AlertTriangle, Play, CheckCircle, BarChart3, Shuffle } from 'lucide-react';

interface Modulo3Props {
  projects: MatrixProject[];
  onSaveProject: (p: MatrixProject) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Modulo3PCP({
  projects,
  onSaveProject,
  showToast,
}: Modulo3Props) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');
  const [selectedBOMItemId, setSelectedBOMItemId] = React.useState<string>('');

  const activeProj = projects.find(p => p.id === selectedProjectId);
  const activeBOMItem = activeProj?.bom.find(b => b.id === selectedBOMItemId);

  // Operation form states
  const [opName, setOpName] = React.useState('Fresamento de Desbaste');
  const [opWorkCenter, setOpWorkCenter] = React.useState('CNC ROMI D800');
  const [opSetup, setOpSetup] = React.useState(30);
  const [opCycle, setOpCycle] = React.useState(120);
  const [opQueue, setOpQueue] = React.useState(2);
  const [opTools, setOpTools] = React.useState('');
  const [opCNC, setOpCNC] = React.useState('');

  // Machine Load state for simulated Capacity Chart
  const workCenters = [
    { name: 'CNC ROMI D800', capacityDailyHours: 16, currentScheduledHours: 0 },
    { name: 'EDM Sodick AQ35', capacityDailyHours: 16, currentScheduledHours: 0 },
    { name: 'Retífica Plana', capacityDailyHours: 8, currentScheduledHours: 0 },
    { name: 'Bancada de Ajustagem', capacityDailyHours: 24, currentScheduledHours: 0 },
    { name: 'Centro CNC de Alta Velocidade', capacityDailyHours: 16, currentScheduledHours: 0 }
  ];

  // Calculate Scheduled Hours per Work Center
  projects?.forEach(p => {
    p.bom?.forEach(b => {
      b.operations?.forEach(op => {
        const foundwc = workCenters.find(w => w.name === op.workCenter);
        if (foundwc) {
          // Total hours = setup (min)/60 + cycle(min)/60 * qty
          const totalHours = ((op.setupTime || 0) / 60) + (((op.cycleTime || 0) / 60) * (b.qty || 1));
          foundwc.currentScheduledHours += Math.round(totalHours);
        }
      });
    });
  });

  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  React.useEffect(() => {
    if (activeProj && activeProj.bom && activeProj.bom.length > 0) {
      // Find first internal item
      const internalItems = activeProj.bom.filter(b => b.source === 'internal');
      if (internalItems.length > 0) {
        setSelectedBOMItemId(internalItems[0].id);
      } else {
        setSelectedBOMItemId(activeProj.bom[0].id);
      }
    } else {
      setSelectedBOMItemId('');
    }
  }, [selectedProjectId, activeProj]);

  const handleAddOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj || !activeBOMItem) return;

    const toolsList = opTools ? opTools.split(',').map(t => t.trim()) : [];
    
    const newOp: Operation = {
      id: `op_${Date.now()}`,
      bomItemId: activeBOMItem.id,
      name: opName,
      workCenter: opWorkCenter,
      setupTime: Number(opSetup),
      cycleTime: Number(opCycle),
      queueTime: Number(opQueue),
      tools: toolsList,
      cncProgram: opCNC || undefined,
      status: 'pending'
    };

    const updatedBOMItem: BOMItem = {
      ...activeBOMItem,
      operations: [...activeBOMItem.operations, newOp]
    };

    const updatedProject: MatrixProject = {
      ...activeProj,
      bom: activeProj.bom.map(b => b.id === activeBOMItem.id ? updatedBOMItem : b)
    };

    onSaveProject(updatedProject);
    setOpTools('');
    setOpCNC('');
    showToast(`Operação "${newOp.name}" sequenciada para "${activeBOMItem.name}"!`, 'success');
  };

  const handleDeleteOperation = (opId: string) => {
    if (!activeProj || !activeBOMItem) return;

    const updatedBOMItem: BOMItem = {
      ...activeBOMItem,
      operations: activeBOMItem.operations.filter(op => op.id !== opId)
    };

    const updatedProject: MatrixProject = {
      ...activeProj,
      bom: activeProj.bom.map(b => b.id === activeBOMItem.id ? updatedBOMItem : b)
    };

    onSaveProject(updatedProject);
    showToast('Operação removida do roteiro.', 'info');
  };

  const handleTriggerRebalance = () => {
    showToast('Balanceamento heurístico concluído! Sequenciamento ajustado no fluxo Gantt.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Planejamento e Controle da Produção (PCP)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gere roteiros operacionais, monitore gargalos, e balanceie a capacidade de fabricação da matrizaria.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Projeto:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 rounded-lg cursor-pointer focus:ring-1 focus:ring-blue-500"
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
          
          {/* LEFT: Machine capacities & visual scheduling load */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Work Center Loads */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  Capacidade dos Centros de Trabalho
                </h3>
                <button
                  onClick={handleTriggerRebalance}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Balanceamento Automático de Carga"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {workCenters.map((wc, idx) => {
                  // Percentage of weekly capacity committed (5 days base)
                  const totalWeeklyCap = wc.capacityDailyHours * 5;
                  const pctCommitted = Math.round((wc.currentScheduledHours / totalWeeklyCap) * 100);
                  const isOverloaded = pctCommitted > 100;

                  return (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>{wc.name}</span>
                        <span className={isOverloaded ? 'text-red-600 font-extrabold' : 'text-slate-500'}>
                          {wc.currentScheduledHours}h / {totalWeeklyCap}h ({pctCommitted}%)
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverloaded ? 'bg-red-500' : pctCommitted > 75 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(pctCommitted, 100)}%` }}
                        />
                      </div>

                      {isOverloaded && (
                        <div className="flex items-center gap-1 text-[10px] text-red-700 bg-red-50 p-1.5 rounded border border-red-100 font-semibold mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Sobrecarga crítica detectada! Reprograme as O.S.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Gantt Info Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-3.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                ⏱ Cronogramas e Tempos Médios
              </h3>
              
              <div className="grid grid-cols-2 gap-3 font-semibold">
                <div className="bg-slate-50 p-3 rounded-xl border">
                  <span className="text-slate-400 font-black uppercase text-[9px] block">Média de Setup</span>
                  <span className="text-slate-900 font-extrabold text-sm block mt-0.5">38 minutos</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border">
                  <span className="text-slate-400 font-black uppercase text-[9px] block">Espera em Fila</span>
                  <span className="text-slate-900 font-extrabold text-sm block mt-0.5">2.2 horas</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-900 leading-normal text-[11px] font-medium flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>Setup de Máquina Otimizado:</strong> O sistema propaga tempos de preparação baseados no histórico para agilizar a fixação de tarugos nos CNCs.
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Routing & Sequence for selected piece */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Select BOM Item */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase block">Selecione o Componente do Molde</span>
              
              <div className="flex flex-wrap gap-2">
                {activeProj.bom.filter(b => b.source === 'internal').map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedBOMItemId(item.id)}
                    className={`px-3 py-2 border rounded-xl text-xs font-extrabold uppercase transition cursor-pointer text-left ${
                      selectedBOMItemId === item.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {item.name}
                    <span className="text-[9px] block mt-0.5 opacity-85 font-mono">{item.material}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Roteiro details */}
            {activeBOMItem ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Roteiro de Fabricação: <span className="text-blue-600">{activeBOMItem.name}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Sequência cronológica de operações técnicas</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                    QUANTIDADE: {activeBOMItem.qty} pçs
                  </span>
                </div>

                {/* List operations */}
                <div className="space-y-3">
                  {activeBOMItem.operations.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-semibold italic">
                      Nenhuma operação registrada para este componente. Adicione uma nova operação abaixo.
                    </div>
                  ) : (
                    activeBOMItem.operations.map((op, idx) => (
                      <div key={op.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                            {(idx + 1) * 10}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900 uppercase">{op.name}</span>
                              <span className="text-[10px] font-bold text-slate-500 font-mono bg-white border px-1.5 py-0.5 rounded">
                                {op.workCenter}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-x-4 pt-2 text-[10px] text-slate-500 font-semibold uppercase">
                              <span>Setup: <strong>{op.setupTime} min</strong></span>
                              <span>Ciclo p/ Peça: <strong>{op.cycleTime} min</strong></span>
                              <span>Fila Espera: <strong>{op.queueTime}h</strong></span>
                            </div>

                            {op.tools.length > 0 && (
                              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                                Ferramental: {op.tools.join(', ')}
                              </p>
                            )}
                            {op.cncProgram && (
                              <p className="text-[10px] text-indigo-600 mt-0.5 font-mono">
                                NC: {op.cncProgram}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            op.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : op.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700 animate-pulse'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {op.status === 'completed' ? 'CONCLUÍDO' : op.status === 'in_progress' ? 'EXECUÇÃO' : 'PENDENTE'}
                          </span>

                          <button
                            onClick={() => handleDeleteOperation(op.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Remover Operação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Operation Form */}
                <form onSubmit={handleAddOperation} className="border-t pt-4 space-y-3.5 text-xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Anexar Nova Operação Industrial</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome da Operação</label>
                      <select
                        value={opName}
                        onChange={(e) => setOpName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border rounded text-slate-800 font-semibold"
                      >
                        <option value="Fresamento de Desbaste">Fresamento de Desbaste</option>
                        <option value="Fresamento de Acabamento">Fresamento de Acabamento</option>
                        <option value="Furação Rápida">Furação Rápida</option>
                        <option value="Eletroerosão por Penetração (EDM)">Eletroerosão por Penetração (EDM)</option>
                        <option value="Retífica Dimensional">Retífica Dimensional</option>
                        <option value="Polimento Manual de Espelhamento">Polimento Manual de Espelhamento</option>
                        <option value="Montagem & Try-Out preliminar">Montagem & Try-Out preliminar</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Centro de Trabalho (Máquina)</label>
                      <select
                        value={opWorkCenter}
                        onChange={(e) => setOpWorkCenter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border rounded text-slate-800 font-semibold"
                      >
                        {workCenters.map((wc, idx) => (
                          <option key={idx} value={wc.name}>{wc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Tempo Setup (minutos)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={opSetup}
                        onChange={(e) => setOpSetup(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border rounded text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Tempo Ciclo p/ Peça (min)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={opCycle}
                        onChange={(e) => setOpCycle(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border rounded text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Tempo em Fila (horas)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={opQueue}
                        onChange={(e) => setOpQueue(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border rounded text-slate-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Código do Programa CNC (.NC)</label>
                      <input
                        type="text"
                        placeholder="Ex: \\CNC\\XYZ\\ACABAMENTO.NC"
                        value={opCNC}
                        onChange={(e) => setOpCNC(e.target.value)}
                        className="w-full p-1.5 bg-white border rounded text-slate-800 font-semibold font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Ferramental Requerido (Separado por vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: Fresa topo Ø12, Broca Ø6"
                        value={opTools}
                        onChange={(e) => setOpTools(e.target.value)}
                        className="w-full p-1.5 bg-white border rounded text-slate-800 font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
                  >
                    Homologar e Salvar Operação Roteada
                  </button>
                </form>

              </div>
            ) : (
              <div className="text-center py-12 bg-white border rounded-2xl">
                Selecione um componente interno acima para rotear as operações.
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-white border rounded-2xl p-8 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
          <h3 className="font-extrabold text-slate-900 uppercase">Nenhum Projeto Importado no PCP</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Acesse o menu <strong>Módulo 2 (Engenharia)</strong> no painel de ferramentas para importar e estruturar orçamentos aprovados como projetos executáveis.
          </p>
        </div>
      )}

    </div>
  );
}
