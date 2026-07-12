import React from 'react';
import { MatrixProject, BOMItem, Operation } from '../types';
import { Play, Pause, CheckCircle, User, Monitor, Eye, Plus, Trash2, Sliders, ClipboardList } from 'lucide-react';

interface Modulo5Props {
  projects: MatrixProject[];
  onSaveProject: (p: MatrixProject) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Modulo5ChaoDeFabrica({
  projects,
  onSaveProject,
  showToast,
}: Modulo5Props) {
  const [operatorName, setOperatorName] = React.useState('Ricardo Santos');
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'tryout' | 'electrodes'>('tasks');

  // Find all internal BOM operations that are not completed
  const openTasks: { project: MatrixProject; item: BOMItem; op: Operation }[] = [];
  projects?.forEach(p => {
    p.bom?.forEach(item => {
      if (item.source === 'internal') {
        item.operations?.forEach(op => {
          openTasks.push({ project: p, item, op });
        });
      }
    });
  });

  // Filter tasks based on status
  const pendingTasks = openTasks.filter(t => t.op.status !== 'completed');
  const completedTasks = openTasks.filter(t => t.op.status === 'completed');

  // Try-out sheet form state
  const [tryProjId, setTryProjId] = React.useState('');
  const [tryTemp, setTryTemp] = React.useState(220); // Temp in °C
  const [trySpeed, setTrySpeed] = React.useState(65); // speed in mm/s
  const [tryPressure, setTryPressure] = React.useState(1200); // bar
  const [tryClamp, setTryClamp] = React.useState(150); // tons
  const [tryCooling, setTryCooling] = React.useState(15); // seconds
  const [trySheet, setTrySheet] = React.useState<{ [id: string]: any }>({
    'def_try': { projName: 'MOLDE CAV_CENTRAL (Toyota)', temp: 230, speed: 70, pressure: 1100, clamp: 120, cooling: 18 }
  });

  // Electrode state
  const [elecCode, setElecCode] = React.useState('EL-CAV01-A');
  const [elecWeight, setElecWeight] = React.useState(1.4); // Kg copper
  const [elecMachingTime, setElecMachingTime] = React.useState(45); // min
  const [elecStatus, setElecStatus] = React.useState<'available' | 'consumed'>('available');
  const [electrodes, setElectrodes] = React.useState<any[]>([
    { id: 'el1', code: 'EL-CAV01-A', weight: 1.2, machiningTime: 35, status: 'available' },
    { id: 'el2', code: 'EL-CANAL-B', weight: 0.8, machiningTime: 20, status: 'consumed' }
  ]);

  const handleUpdateOpStatus = (projId: string, itemId: string, opId: string, nextStatus: 'pending' | 'in_progress' | 'completed') => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;

    const updatedBOM = proj.bom.map(b => {
      if (b.id === itemId) {
        return {
          ...b,
          operations: b.operations.map(op => {
            if (op.id === opId) {
              const baseChange: Partial<Operation> = { status: nextStatus };
              if (nextStatus === 'in_progress') {
                baseChange.operator = operatorName;
                baseChange.startDate = new Date().toISOString().split('T')[0];
                showToast(`Operador ${operatorName} iniciou a O.S. "${op.name}"!`, 'info');
              } else if (nextStatus === 'completed') {
                baseChange.endDate = new Date().toISOString().split('T')[0];
                baseChange.realSetupTime = op.setupTime; // direct simulate
                baseChange.realCycleTime = op.cycleTime;
                showToast(`O.S. "${op.name}" concluída e gravada com sucesso!`, 'success');
              }
              return { ...op, ...baseChange };
            }
            return op;
          })
        };
      }
      return b;
    });

    const updatedProj: MatrixProject = { ...proj, bom: updatedBOM };
    onSaveProject(updatedProj);
  };

  const handleAddElectrode = (e: React.FormEvent) => {
    e.preventDefault();
    const newElec = {
      id: `elec_${Date.now()}`,
      code: elecCode,
      weight: elecWeight,
      machiningTime: elecMachingTime,
      status: elecStatus
    };
    setElectrodes([...electrodes, newElec]);
    setElecCode(`EL-CAV0${electrodes.length + 2}-A`);
    showToast(`Eletrodo de penetração "${newElec.code}" registrado no Almoxarifado!`, 'success');
  };

  const handleDeleteElectrode = (id: string) => {
    setElectrodes(electrodes.filter(e => e.id !== id));
    showToast('Eletrodo descartado.', 'info');
  };

  const handleSaveTryoutSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === tryProjId);
    if (!proj) {
      showToast('Por favor, selecione um projeto válido para o Try-Out.', 'error');
      return;
    }

    setTrySheet({
      ...trySheet,
      [tryProjId]: {
        projName: proj.moldDescription || proj.reference,
        temp: tryTemp,
        speed: trySpeed,
        pressure: tryPressure,
        clamp: tryClamp,
        cooling: tryCooling
      }
    });

    showToast(`Ficha de Try-Out homologada para o projeto "${proj.reference}"!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
            <Monitor className="w-5 h-5 text-orange-400" />
            Console Operacional - Chão de Fábrica
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interface para apontamento direto de O.S., consultas técnicas de desenhos CAD, controle de eletrodos de penetração e faturamento de tryout.
          </p>
        </div>

        {/* Operator selection & tab switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <User className="w-4 h-4 text-orange-400" />
            <select
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="bg-transparent border-none text-xs font-black text-white cursor-pointer focus:ring-0 focus:outline-hidden"
            >
              <option value="Ricardo Santos" className="bg-slate-800 text-white">Ricardo Santos (Torno/Retífica)</option>
              <option value="Márcio Albuquerque" className="bg-slate-800 text-white">Márcio Albuquerque (EDM Specialist)</option>
              <option value="Felipe Prado" className="bg-slate-800 text-white">Felipe Prado (Ajustador Pleno)</option>
              <option value="Julio Cesar" className="bg-slate-800 text-white">Julio Cesar (Fresador CNC)</option>
            </select>
          </div>

          <div className="flex bg-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'tasks' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fila de Trabalho
            </button>
            <button
              onClick={() => setActiveTab('tryout')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'tryout' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ficha de Try-Out
            </button>
            <button
              onClick={() => setActiveTab('electrodes')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'electrodes' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Eletrodos EDM
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Queue Table */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-1">
              📥 Fila de Operações Agendadas pelo PCP
            </h3>

            {pendingTasks.length === 0 ? (
              <div className="bg-white p-12 text-center border rounded-2xl font-semibold text-slate-400 italic">
                Nenhuma O.S. agendada ou pendente. Excelente trabalho!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingTasks.map(({ project, item, op }) => {
                  const isCurrentRunning = op.status === 'in_progress' && op.operator === operatorName;
                  const isOtherRunning = op.status === 'in_progress' && op.operator !== operatorName;

                  return (
                    <div
                      key={op.id}
                      className={`p-5 bg-white border rounded-2xl shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCurrentRunning ? 'ring-2 ring-orange-500 bg-orange-50/10' : 'hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 border text-slate-800 font-bold text-[10px] rounded uppercase">
                            ({project.reference}) {project.clientName}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="font-extrabold text-xs text-orange-600 uppercase">
                            {item.name} ({item.material})
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900 uppercase leading-none">{op.name}</h4>
                          <span className="text-slate-400 font-mono text-[10px]">Caminho CNC: {op.cncProgram || 'N/A'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-x-6 text-[10px] font-black text-slate-500 uppercase">
                          <span>Setup orçado: <strong>{op.setupTime} min</strong></span>
                          <span>Ciclo orçado: <strong>{op.cycleTime} min</strong></span>
                          <span>Cent. Trabalho: <strong className="text-indigo-600">{op.workCenter}</strong></span>
                        </div>

                        {op.tools.length > 0 && (
                          <div className="text-[10px] text-slate-400 font-bold">
                            Ferramental necessário: <span className="text-slate-600">{op.tools.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Touch execution buttons (min height 44px for easy press) */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto min-h-[44px]">
                        {op.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateOpStatus(project.id, item.id, op.id, 'in_progress')}
                            disabled={isOtherRunning}
                            className="h-11 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Play className="w-4 h-4 text-orange-400" />
                            Iniciar Trabalho
                          </button>
                        )}

                        {op.status === 'in_progress' && isCurrentRunning && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateOpStatus(project.id, item.id, op.id, 'pending')}
                              className="h-11 px-4 bg-slate-100 hover:bg-slate-250 text-slate-700 font-extrabold text-xs uppercase rounded-xl border transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Pause className="w-4 h-4 text-slate-500" />
                              Pausar Setup
                            </button>
                            <button
                              onClick={() => handleUpdateOpStatus(project.id, item.id, op.id, 'completed')}
                              className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Finalizar Operação
                            </button>
                          </div>
                        )}

                        {op.status === 'in_progress' && !isCurrentRunning && (
                          <span className="text-[11px] font-black text-amber-700 bg-amber-50 px-2.5 py-1.5 border border-amber-100 rounded-lg">
                            Ocupado por: {op.operator}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Technical View & CNC Checklist */}
          <div className="space-y-6">
            
            {/* Visualizer widget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-1">
                <Eye className="w-4 h-4 text-orange-500" />
                Visualizador de Tolerâncias Técnicas
              </h3>
              
              <div className="bg-slate-100 border rounded-xl p-4 text-center text-slate-500 aspect-video relative flex flex-col justify-center items-center overflow-hidden">
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400">DESENHO_CAD_CAVIDADES.stp</div>
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs border border-dashed border-slate-300">
                  CAD 2D
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-2">Clique para abrir em alta resolução</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border space-y-1.5 text-[11px] text-slate-600 font-semibold">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Checklist de Liberação de Máquina</span>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-orange-500 focus:ring-orange-500" />
                  <span>Verificar pressão pneumática (6 bar)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-orange-500 focus:ring-orange-500" />
                  <span>Calibração do referenciador 3D (Z-zero)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" />
                  <span>Nivelamento do tarugo no mordente magnético</span>
                </div>
              </div>
            </div>

            {/* Completed operations list */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-1">
                ✓ Apontamentos Concluídos Recentemente
              </h3>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {completedTasks.slice(0, 5).map(({ item, op }) => (
                  <div key={op.id} className="p-2.5 bg-emerald-50/30 border border-emerald-100 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800">
                    <div>
                      <span className="block uppercase text-slate-900 font-black">{op.name}</span>
                      <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                      Real: {op.cycleTime} min
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'tryout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tryout form sheet */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Sliders className="w-4 h-4 text-orange-500" />
              Preencher Parâmetros Operacionais de Try-Out
            </h3>

            <form onSubmit={handleSaveTryoutSheet} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Selecione o Projeto do Molde</label>
                <select
                  required
                  value={tryProjId}
                  onChange={(e) => setTryProjId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
                >
                  <option value="">-- Escolher Molde --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>({p.reference}) {p.moldDescription || p.clientName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Temperatura de Injeção (°C)</label>
                  <input
                    type="number"
                    value={tryTemp}
                    onChange={(e) => setTryTemp(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Velocidade de Avanço (mm/s)</label>
                  <input
                    type="number"
                    value={trySpeed}
                    onChange={(e) => setTrySpeed(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pressão de Recalque (bar)</label>
                  <input
                    type="number"
                    value={tryPressure}
                    onChange={(e) => setTryPressure(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Força de Fechamento (ton)</label>
                  <input
                    type="number"
                    value={tryClamp}
                    onChange={(e) => setTryClamp(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tempo de Resfriamento (segundos)</label>
                <input
                  type="number"
                  value={tryCooling}
                  onChange={(e) => setTryCooling(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
              >
                Salvar Ficha Técnica de Try-Out
              </button>
            </form>
          </div>

          {/* Active tryouts database */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <ClipboardList className="w-4 h-4 text-orange-500" />
              Banco de Parâmetros de Try-Outs Executados
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(trySheet).map(key => {
                const sheet = trySheet[key];
                return (
                  <div key={key} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="font-extrabold text-slate-900 uppercase block max-w-[180px] truncate">{sheet.projName}</span>
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-700 font-mono text-[10px] rounded">T1 HOMOLOGADO</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                      <span>Temp. Injeção: <strong className="text-slate-900">{sheet.temp} °C</strong></span>
                      <span>Vel. Injeção: <strong className="text-slate-900">{sheet.speed} mm/s</strong></span>
                      <span>Recalque: <strong className="text-slate-900">{sheet.pressure} bar</strong></span>
                      <span>Fechamento: <strong className="text-slate-900">{sheet.clamp} tons</strong></span>
                      <span>Resfriamento: <strong className="text-slate-900">{sheet.cooling} s</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'electrodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add copper electrode */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              ⚙️ Usinar / Registrar Eletrodo de Cobre
            </h3>

            <form onSubmit={handleAddElectrode} className="space-y-4.5 text-xs font-bold text-slate-700">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Código Rastreável do Eletrodo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: EL-CAV01-A"
                  value={elecCode}
                  onChange={(e) => setElecCode(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Peso Cobre (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={elecWeight}
                    onChange={(e) => setElecWeight(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tempo Usinagem Fresa (min)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={elecMachingTime}
                    onChange={(e) => setElecMachingTime(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Situação de Uso</label>
                <select
                  value={elecStatus}
                  onChange={(e) => setElecStatus(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
                >
                  <option value="available">Pronto para Erosão Penetração</option>
                  <option value="consumed">Gasto (Descarte)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
              >
                Registrar Eletrodo
              </button>
            </form>
          </div>

          {/* Electrodes table inventory */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              🔌 Banco de Eletrodos Cadastrados (Erosão por Penetração)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                    <th className="p-3">Código do Eletrodo</th>
                    <th className="p-3">Peso Bruto Cobre</th>
                    <th className="p-3">Usinagem Fresa CNC</th>
                    <th className="p-3">Estado Atual</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {electrodes.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-mono font-extrabold text-slate-900">{e.code}</td>
                      <td className="p-3 font-mono">{e.weight} Kg</td>
                      <td className="p-3">{e.machiningTime} minutos</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          e.status === 'available' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {e.status === 'available' ? 'DISPONÍVEL' : 'CONSUMIDO'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteElectrode(e.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
