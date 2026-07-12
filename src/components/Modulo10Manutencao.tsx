import React from 'react';
import { MaintenanceLog, MatrixProject } from '../types';
import { Plus, Trash2, ShieldCheck, HeartPulse, RefreshCw, AlertTriangle, CalendarRange } from 'lucide-react';

interface Modulo10Props {
  logs: MaintenanceLog[];
  projects: MatrixProject[];
  onSaveLogs: (l: MaintenanceLog[]) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Modulo10Manutencao({
  logs,
  projects,
  onSaveLogs,
  showToast,
}: Modulo10Props) {
  const [activeTab, setActiveTab] = React.useState<'preventative' | 'corrective'>('preventative');

  // Maintenance form state
  const [maintProjId, setMaintProjId] = React.useState('');
  const [maintCycles, setMaintCycles] = React.useState(150000);
  const [maintType, setMaintType] = React.useState<'preventative' | 'corrective'>('preventative');
  const [maintDesc, setMaintDesc] = React.useState('Lubrificação de colunas de guia e substituição de anéis de vedação de refrigeração.');
  const [maintParts, setMaintParts] = React.useState('Anéis Viton Ø12, Graxa Krytox');
  const [maintCost, setMaintCost] = React.useState(450);
  const [maintResp, setMaintResp] = React.useState('Felipe Prado');
  const [maintWarranty, setMaintWarranty] = React.useState(true);

  React.useEffect(() => {
    if (projects.length > 0 && !maintProjId) {
      setMaintProjId(projects[0].id);
    }
  }, [projects, maintProjId]);

  const handleAddMaintLog = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === maintProjId);
    if (!proj) return;

    const partsList = maintParts ? maintParts.split(',').map(p => p.trim()) : [];

    const newLog: MaintenanceLog = {
      id: `maint_${Date.now()}`,
      projectId: maintProjId,
      projectName: proj.reference,
      cycles: Number(maintCycles),
      type: maintType,
      description: maintDesc,
      partsReplaced: partsList,
      cost: Number(maintCost),
      date: new Date().toISOString().split('T')[0],
      responsible: maintResp,
      isWarranty: maintWarranty,
      status: 'completed'
    };

    onSaveLogs([newLog, ...logs]);
    showToast(`Histórico de manutenção para o molde "${proj.reference}" cadastrado com sucesso!`, 'success');
  };

  const handleDeleteMaintLog = (id: string) => {
    onSaveLogs(logs.filter(l => l.id !== id));
    showToast('Histórico de manutenção removido.', 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-500" />
            Manutenção de Moldes, Pós-Venda e Vida Útil
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mantenha moldes com máxima eficiência: monitore o contador de ciclos (disparos) para evitar fadiga e falhas em lotes de clientes.
          </p>
        </div>
      </div>

      {/* DYNAMIC RADIAL TIMELINE / LIFE THRESHOLDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((proj, idx) => {
          // Mock accumulated cycles for illustration
          const cycles = idx === 0 ? 120000 : idx === 1 ? 480000 : 35000;
          const limit = 500000; // max shots before complete re-conditioning (Tryout/Ajuste)
          const pct = Math.round((cycles / limit) * 100);
          const isWarning = pct >= 80;

          return (
            <div key={proj.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-black block uppercase">Molde em Campo</span>
                  <span className="font-extrabold text-slate-900 uppercase block">{proj.moldDescription || 'Molde Cliente'}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded">
                  {proj.reference}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="text-slate-500">Ciclos Consumidos:</span>
                  <span className={isWarning ? 'text-red-600 font-extrabold' : 'text-slate-800'}>
                    {cycles.toLocaleString()} / {limit.toLocaleString()} ({pct}%)
                  </span>
                </div>
                
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isWarning ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              {isWarning ? (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-800 text-[10px] flex items-start gap-1.5 leading-normal">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  Alerta: Molde atingiu limite de desgaste! Agende manutenção preventiva imediatamente.
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-800 text-[10px] flex items-start gap-1.5 leading-normal">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Operação estável. Próxima calibração de canais prevista em {500000 - cycles} ciclos.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Maintenance recording form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <CalendarRange className="w-4 h-4 text-red-500" />
            Lançar Intervenção Técnica / Manutenção
          </h3>

          <form onSubmit={handleAddMaintLog} className="space-y-4 text-xs font-bold text-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Molde Alvo</label>
                <select
                  required
                  value={maintProjId}
                  onChange={(e) => setMaintProjId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800 font-semibold"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.reference}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ciclos Atuais</label>
                <input
                  type="number"
                  required
                  value={maintCycles}
                  onChange={(e) => setMaintCycles(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de Serviço</label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800 font-semibold"
                >
                  <option value="preventative">Preventiva (Agenda / Ciclo)</option>
                  <option value="corrective">Corretiva (Quebra de canal)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Enquadramento</label>
                <select
                  value={maintWarranty ? 'w' : 'b'}
                  onChange={(e) => setMaintWarranty(e.target.value === 'w')}
                  className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800 font-semibold"
                >
                  <option value="w">Garantia (Sem Ônus Cliente)</option>
                  <option value="b">Faturável / Pago</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Peças Trocadas (Separadas por vírgula)</label>
              <input
                type="text"
                placeholder="Ex: Anéis viton, Mola azul Hasco"
                value={maintParts}
                onChange={(e) => setMaintParts(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Custo Insumos (R$)</label>
                <input
                  type="number"
                  value={maintCost}
                  onChange={(e) => setMaintCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ajustador Mecânico</label>
                <input
                  type="text"
                  required
                  value={maintResp}
                  onChange={(e) => setMaintResp(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Laudo / Descrição Técnica das Ações</label>
              <textarea
                rows={2}
                required
                value={maintDesc}
                onChange={(e) => setMaintDesc(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
            >
              Registrar Laudo de Manutenção
            </button>
          </form>
        </div>

        {/* Maintenance Logs Journal list */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            📋 Histórico e Diário de Manutenções Executadas
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                  <th className="p-3">Data</th>
                  <th className="p-3">Molde</th>
                  <th className="p-3">Ciclos</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Ações Executadas</th>
                  <th className="p-3 font-mono">Insumo Custos</th>
                  <th className="p-3">Faturamento</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-mono text-slate-500">{log.date}</td>
                    <td className="p-3 font-mono font-bold">{log.projectName}</td>
                    <td className="p-3 font-mono font-extrabold text-slate-900">{log.cycles.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        log.type === 'preventative' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {log.type === 'preventative' ? 'Preventiva' : 'Corretiva'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 leading-normal">
                      <p className="font-bold text-slate-800">{log.description}</p>
                      {log.partsReplaced.length > 0 && (
                        <span className="text-[10px] text-slate-400 block mt-1">Troca: {log.partsReplaced.join(', ')}</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold">R$ {log.cost}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        log.isWarranty ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {log.isWarranty ? 'Cortesia/Garantia' : 'Faturável'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteMaintLog(log.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
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

    </div>
  );
}
