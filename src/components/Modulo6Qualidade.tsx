import React from 'react';
import { QualityInspection, NonConformance, MatrixProject, RawMaterialStock } from '../types';
import { Plus, Trash2, ShieldAlert, CheckSquare, GitPullRequest, Search, FileText, AlertTriangle, Lightbulb } from 'lucide-react';

interface Modulo6Props {
  inspections: QualityInspection[];
  nonConformances: NonConformance[];
  projects: MatrixProject[];
  rawStock: RawMaterialStock[];
  onSaveInspections: (i: QualityInspection[]) => void;
  onSaveNonConformances: (n: NonConformance[]) => void;
  onSaveProject: (p: MatrixProject) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Modulo6Qualidade({
  inspections,
  nonConformances,
  projects,
  rawStock,
  onSaveInspections,
  onSaveNonConformances,
  onSaveProject,
  showToast,
}: Modulo6Props) {
  const [activeTab, setActiveTab] = React.useState<'dimensional' | 'nc' | 'traceability'>('dimensional');

  // Dimensional Inspection form states
  const [inspProjId, setInspProjId] = React.useState('');
  const [inspBOMItemId, setInspBOMItemId] = React.useState('');
  const [inspOperator, setInspOperator] = React.useState('Rodrigo Metrologia');
  const [inspQuota, setInspQuota] = React.useState('Encaixe de Gaveta H7');
  const [inspNominal, setInspNominal] = React.useState(12.000);
  const [inspReal, setInspReal] = React.useState(12.004);

  // Non-conformance form states
  const [ncProjId, setNcProjId] = React.useState('');
  const [ncBOMItemId, setNcBOMItemId] = React.useState('');
  const [ncClass, setNcClass] = React.useState<'refugo' | 'retrabalho' | 'desvio_aceito'>('retrabalho');
  const [ncAction, setNcAction] = React.useState('Fresar rebaixo excedente de 0.2mm em retífica plana.');
  const [ncResp, setNcResp] = React.useState('Julio Cesar');
  const [ncCost, setNcCost] = React.useState(150);

  // Ishikawa 6M States
  const [ishMethod, setIshMethod] = React.useState('Variação de velocidade de corte no acabamento');
  const [ishMachine, setIshMachine] = React.useState('Folga axial no fuso de esferas ROMI');
  const [ishMaterial, setIshMaterial] = React.useState('Tarugo com pontos de dureza excessiva (P20)');
  const [ishManpower, setIshManpower] = React.useState('Falta de conferência no relógio comparador');
  const [ishMeasurement, setIshMeasurement] = React.useState('Micrômetro sem calibração atualizada');
  const [ishEnvironment, setIshEnvironment] = React.useState('Variação térmica brusca na sala de retífica');

  // 5 Whys States
  const [why1, setWhy1] = React.useState('Por que a peça saiu com sobremedida? Porque o operador não zerou o eixo Z.');
  const [why2, setWhy2] = React.useState('Por que não zerou? Porque estava com pressa devido ao atraso da máquina anterior.');
  const [why3, setWhy3] = React.useState('Por que atrasou? Porque a fresa quebrou a meio do ciclo.');
  const [why4, setWhy4] = React.useState('Por que quebrou? Porque foi usada velocidade de corte acima do recomendado.');
  const [why5, setWhy5] = React.useState('Por que usou velocidade acima? Porque não havia ficha técnica de corte na máquina.');

  // Traceability lookup state
  const [traceBOMItemId, setTraceBOMItemId] = React.useState('');

  const activeProjForInsp = projects.find(p => p.id === inspProjId);
  const activeProjForNC = projects.find(p => p.id === ncProjId);

  React.useEffect(() => {
    if (projects.length > 0 && projects[0]) {
      if (!inspProjId) setInspProjId(projects[0].id);
      if (!ncProjId) setNcProjId(projects[0].id);
    }
  }, [projects, inspProjId, ncProjId]);

  React.useEffect(() => {
    if (activeProjForInsp && activeProjForInsp.bom && activeProjForInsp.bom.length > 0) {
      setInspBOMItemId(activeProjForInsp.bom[0].id);
    }
  }, [inspProjId, activeProjForInsp]);

  React.useEffect(() => {
    if (activeProjForNC && activeProjForNC.bom && activeProjForNC.bom.length > 0) {
      setNcBOMItemId(activeProjForNC.bom[0].id);
    }
  }, [ncProjId, activeProjForNC]);

  const handleAddDimensionalInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === inspProjId);
    const item = proj?.bom.find(b => b.id === inspBOMItemId);

    if (!proj || !item) {
      showToast('Selecione projeto e componente válidos.', 'error');
      return;
    }

    const deviation = parseFloat((inspReal - inspNominal).toFixed(4));
    // Pass standard if deviation is within +/- 0.015 mm tolerance for mold making
    const status = Math.abs(deviation) <= 0.015 ? 'ok' : 'fail';

    const newInsp: QualityInspection = {
      id: `insp_${Date.now()}`,
      projectId: inspProjId,
      projectName: proj.reference,
      bomItemId: inspBOMItemId,
      bomItemName: item.name,
      operatorName: inspOperator,
      date: new Date().toISOString().split('T')[0],
      dimensionsMeasured: [
        {
          quotaName: inspQuota,
          nominal: inspNominal,
          real: inspReal,
          deviation,
          status
        }
      ],
      overallStatus: status === 'ok' ? 'approved' : 'rework'
    };

    onSaveInspections([...inspections, newInsp]);
    showToast(`Inspeção cadastrada. Resultado: ${status === 'ok' ? 'APROVADO' : 'REPROVADO'}!`, status === 'ok' ? 'success' : 'error');

    // Auto trigger non-conformance if failed
    if (status === 'fail') {
      const autoNC: NonConformance = {
        id: `nc_${Date.now()}`,
        projectId: inspProjId,
        projectName: proj.reference,
        bomItemId: inspBOMItemId,
        bomItemName: item.name,
        classification: 'retrabalho',
        rootCause5Whys: [
          `Cota reprovada: ${inspQuota}`,
          `Desvio micrométrico: ${deviation} mm fora da tolerância`,
          'Aguardando investigação detalhada'
        ],
        ishikawa: {
          method: 'N/D',
          machine: 'N/D',
          material: 'N/D',
          manpower: 'N/D',
          measurement: 'N/D',
          environment: 'N/D'
        },
        actionPlan: 'Re-ajustar dimensional na bancada ou retífica plana.',
        responsible: 'Julio Cesar',
        deadline: new Date(Date.now() + 48*60*60*1000).toISOString().split('T')[0],
        cost: 150,
        status: 'open'
      };
      onSaveNonConformances([...nonConformances, autoNC]);
      showToast('Relatório de Não-Conformidade gerado automaticamente!', 'info');
    }
  };

  const handleAddNC = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === ncProjId);
    const item = proj?.bom.find(b => b.id === ncBOMItemId);

    if (!proj || !item) return;

    const newNC: NonConformance = {
      id: `nc_manual_${Date.now()}`,
      projectId: ncProjId,
      projectName: proj.reference,
      bomItemId: ncBOMItemId,
      bomItemName: item.name,
      classification: ncClass,
      rootCause5Whys: [why1, why2, why3, why4, why5].filter(w => w !== ''),
      ishikawa: {
        method: ishMethod,
        machine: ishMachine,
        material: ishMaterial,
        manpower: ishManpower,
        measurement: ishMeasurement,
        environment: ishEnvironment
      },
      actionPlan: ncAction,
      responsible: ncResp,
      deadline: new Date(Date.now() + 72*60*60*1000).toISOString().split('T')[0],
      cost: Number(ncCost),
      status: 'open'
    };

    onSaveNonConformances([...nonConformances, newNC]);
    showToast(`Não-Conformidade para "${item.name}" registrada! Análise Ishikawa & 5Whys salva.`, 'success');
  };

  const handleDeleteInspection = (id: string) => {
    onSaveInspections(inspections.filter(i => i.id !== id));
    showToast('Inspeção dimensional removida.', 'info');
  };

  const handleDeleteNC = (id: string) => {
    onSaveNonConformances(nonConformances.filter(n => n.id !== id));
    showToast('Relatório de Não-Conformidade removido.', 'info');
  };

  const handleResolveNC = (id: string) => {
    const updated = nonConformances.map(n => {
      if (n.id === id) {
        return { ...n, status: 'closed' as const };
      }
      return n;
    });
    onSaveNonConformances(updated);
    showToast('Não-conformidade encerrada com sucesso após ação corretiva!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Controle de Qualidade, Não-Conformidade e Rastreabilidade
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare medições nominais versus reais, investigue desvios com diagramas Ishikawa/5Whys e audite a rastreabilidade total.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border">
          <button
            onClick={() => setActiveTab('dimensional')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'dimensional' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dimensional CMM
          </button>
          <button
            onClick={() => setActiveTab('nc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'nc' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Análise RNC (Ishikawa)
          </button>
          <button
            onClick={() => setActiveTab('traceability')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'traceability' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Árvore de Rastreabilidade
          </button>
        </div>
      </div>

      {activeTab === 'dimensional' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inspection Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <CheckSquare className="w-4 h-4 text-red-500" />
              Lançar Medições Dimensionais (Micrômetro/Tridimensional)
            </h3>

            <form onSubmit={handleAddDimensionalInspection} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Molde</label>
                  <select
                    value={inspProjId}
                    onChange={(e) => setInspProjId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>({p.reference})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Componente</label>
                  <select
                    value={inspBOMItemId}
                    onChange={(e) => setInspBOMItemId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800"
                  >
                    {activeProjForInsp?.bom.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cota a ser Inspecionada (Desenho Técnico)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Altura de cavidade 40 H7"
                  value={inspQuota}
                  onChange={(e) => setInspQuota(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Medida Nominal (mm)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={inspNominal}
                    onChange={(e) => setInspNominal(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Medida Real Tridimensional (mm)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={inspReal}
                    onChange={(e) => setInspReal(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Metrologista / Inspetor</label>
                <input
                  type="text"
                  required
                  value={inspOperator}
                  onChange={(e) => setInspOperator(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
              >
                Auditar Cota & Homologar
              </button>
            </form>
          </div>

          {/* Active inspections */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              📐 Relatórios e Laudos Dimensionais Homologados
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                    <th className="p-3">Molde / Componente</th>
                    <th className="p-3">Cota Inspecionada</th>
                    <th className="p-3">Nominal (mm)</th>
                    <th className="p-3">Medido (mm)</th>
                    <th className="p-3">Desvio (mm)</th>
                    <th className="p-3">Data/Auditor</th>
                    <th className="p-3">Resultado</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {inspections.map(i => {
                    const measure = i.dimensionsMeasured && i.dimensionsMeasured[0];
                    if (!measure) return null;
                    const isFail = measure.status === 'fail';

                    return (
                      <tr key={i.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3">
                          <span className="font-extrabold text-slate-900 block">{i.bomItemName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">MOLDE: {i.projectName}</span>
                        </td>
                        <td className="p-3">{measure.quotaName}</td>
                        <td className="p-3 font-mono">{measure.nominal.toFixed(3)}</td>
                        <td className="p-3 font-mono font-extrabold text-slate-900">{measure.real.toFixed(3)}</td>
                        <td className={`p-3 font-mono font-bold ${isFail ? 'text-red-600' : 'text-emerald-700'}`}>
                          {measure.deviation > 0 ? `+${measure.deviation.toFixed(3)}` : measure.deviation.toFixed(3)}
                        </td>
                        <td className="p-3">
                          <span className="block">{i.date}</span>
                          <span className="text-[10px] text-slate-400 block">{i.operatorName}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            isFail ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isFail ? 'REJEITADO' : 'APROVADO'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteInspection(i.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'nc' && (
        <div className="space-y-6">
          
          {/* Main investigative layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Create RNC and Ishikawa Details */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Registrar Não-Conformidade (RNC)
              </h3>

              <form onSubmit={handleAddNC} className="space-y-3.5 text-xs font-bold text-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Molde</label>
                    <select
                      value={ncProjId}
                      onChange={(e) => setNcProjId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>({p.reference})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Componente</label>
                    <select
                      value={ncBOMItemId}
                      onChange={(e) => setNcBOMItemId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800"
                    >
                      {activeProjForNC?.bom.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Classificação</label>
                    <select
                      value={ncClass}
                      onChange={(e) => setNcClass(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800"
                    >
                      <option value="retrabalho">Retrabalho (Usinar de Novo)</option>
                      <option value="refugo">Refugo (Descarte Completo)</option>
                      <option value="desvio_aceito">Desvio Aceito (Concessão)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Custo Estimado (R$)</label>
                    <input
                      type="number"
                      value={ncCost}
                      onChange={(e) => setNcCost(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ação de Bloqueio / Corretiva</label>
                  <input
                    type="text"
                    required
                    value={ncAction}
                    onChange={(e) => setNcAction(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Responsável pela Correção</label>
                  <input
                    type="text"
                    required
                    value={ncResp}
                    onChange={(e) => setNcResp(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
                >
                  Gravar RNC com 6M & 5Whys
                </button>
              </form>
            </div>

            {/* Right Columns: Analysis boards & Current RNCs */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Ishikawa Diagram Visualizer Panel */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-base">🐟</span>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Diagrama de Ishikawa (6M - Causa & Efeito)
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 relative">
                    <span className="text-[9px] text-red-400 uppercase font-black block">Método</span>
                    <input
                      type="text"
                      value={ishMethod}
                      onChange={(e) => setIshMethod(e.target.value)}
                      className="bg-transparent border-none p-0 mt-1 text-xs text-slate-200 focus:ring-0 w-full"
                    />
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 relative">
                    <span className="text-[9px] text-red-400 uppercase font-black block">Máquina</span>
                    <input
                      type="text"
                      value={ishMachine}
                      onChange={(e) => setIshMachine(e.target.value)}
                      className="bg-transparent border-none p-0 mt-1 text-xs text-slate-200 focus:ring-0 w-full"
                    />
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 relative">
                    <span className="text-[9px] text-red-400 uppercase font-black block">Material</span>
                    <input
                      type="text"
                      value={ishMaterial}
                      onChange={(e) => setIshMaterial(e.target.value)}
                      className="bg-transparent border-none p-0 mt-1 text-xs text-slate-200 focus:ring-0 w-full"
                    />
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 relative">
                    <span className="text-[9px] text-red-400 uppercase font-black block">Mão de Obra</span>
                    <input
                      type="text"
                      value={ishManpower}
                      onChange={(e) => setIshManpower(e.target.value)}
                      className="bg-transparent border-none p-0 mt-1 text-xs text-slate-200 focus:ring-0 w-full"
                    />
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 relative">
                    <span className="text-[9px] text-red-400 uppercase font-black block">Medição</span>
                    <input
                      type="text"
                      value={ishMeasurement}
                      onChange={(e) => setIshMeasurement(e.target.value)}
                      className="bg-transparent border-none p-0 mt-1 text-xs text-slate-200 focus:ring-0 w-full"
                    />
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 relative">
                    <span className="text-[9px] text-red-400 uppercase font-black block">Meio Ambiente</span>
                    <input
                      type="text"
                      value={ishEnvironment}
                      onChange={(e) => setIshEnvironment(e.target.value)}
                      className="bg-transparent border-none p-0 mt-1 text-xs text-slate-200 focus:ring-0 w-full"
                    />
                  </div>
                </div>

                {/* 5 Whys block */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" /> Análise de Causa Raiz: Metodologia dos 5 Porquês
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <input type="text" value={why1} onChange={(e) => setWhy1(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 font-semibold text-slate-300" />
                    <input type="text" value={why2} onChange={(e) => setWhy2(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 font-semibold text-slate-300" />
                    <input type="text" value={why3} onChange={(e) => setWhy3(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 font-semibold text-slate-300" />
                    <input type="text" value={why4} onChange={(e) => setWhy4(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 font-semibold text-slate-300" />
                    <input type="text" value={why5} onChange={(e) => setWhy5(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 font-semibold text-slate-300" />
                  </div>
                </div>
              </div>

              {/* RNC List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">
                  📋 Relatórios de Não-Conformidade Abertos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nonConformances.map(nc => (
                    <div key={nc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs font-semibold">
                      <div className="flex justify-between items-start border-b pb-2">
                        <div>
                          <span className="font-extrabold text-slate-900 block uppercase leading-tight">{nc.bomItemName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">MOLDE: {nc.projectName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          nc.classification === 'refugo' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {nc.classification}
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-600 text-[11px]">
                        <p>Ação: <strong className="text-slate-800">{nc.actionPlan}</strong></p>
                        <p>Encargo: <strong className="text-slate-800">{nc.responsible}</strong></p>
                        <p>Custo Prejuízo: <strong className="text-red-600">R$ {nc.cost}</strong></p>
                      </div>

                      <div className="flex items-center justify-between border-t pt-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          nc.status === 'open' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {nc.status === 'open' ? 'PENDENTE' : 'RESOLVIDO'}
                        </span>

                        <div className="flex gap-2">
                          {nc.status === 'open' && (
                            <button
                              onClick={() => handleResolveNC(nc.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition"
                            >
                              Resolver
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNC(nc.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {activeTab === 'traceability' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-red-500" />
                Auditoria de Rastreabilidade Total de Componentes
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Rastreie o histórico completo do aço, usinagem e destino de qualquer peça do molde.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Peça Interna:</span>
              <select
                value={traceBOMItemId}
                onChange={(e) => setTraceBOMItemId(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 rounded-lg cursor-pointer"
              >
                <option value="">-- Selecionar Peça --</option>
                {projects.flatMap(p => p.bom.filter(b => b.source === 'internal').map(b => (
                  <option key={b.id} value={b.id}>{p.reference} - {b.name}</option>
                )))}
              </select>
            </div>
          </div>

          {traceBOMItemId ? (
            <div className="space-y-6">
              
              {/* Traceability tree visuals */}
              <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-8 text-xs font-semibold">
                
                {/* Stage 1: Steel provider */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase block">Etapa 1: Origem da Matéria Prima</span>
                  <div className="bg-slate-50 p-3 rounded-xl border max-w-md mt-1.5 space-y-1">
                    <p className="font-extrabold text-slate-900">Aço Especial P20 Modificado</p>
                    <p className="text-slate-500 text-[11px]">Fornecedor: Villares Metals S.A.</p>
                    <div className="flex gap-2 text-[10px] font-mono mt-1 text-slate-400">
                      <span>Lote: LOT-99831</span>
                      <span>Dureza: 32-35 HRC</span>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Eng approval */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-black text-blue-600 uppercase block">Etapa 2: Aprovação de Engenharia</span>
                  <div className="bg-slate-50 p-3 rounded-xl border max-w-md mt-1.5 space-y-1">
                    <p className="font-extrabold text-slate-900">Dimensionamento em Projeto CAD 3D</p>
                    <p className="text-slate-500 text-[11px]">Homologado em: Versão R00 preliminar</p>
                    <span className="text-[10px] text-blue-600 font-mono block mt-0.5">Arquivo: modelo_cavidade_central.dwg</span>
                  </div>
                </div>

                {/* Stage 3: Shop floor machining */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-black text-orange-600 uppercase block">Etapa 3: Usinagem e Desbaste CNC</span>
                  <div className="bg-slate-50 p-3 rounded-xl border max-w-md mt-1.5 space-y-1.5">
                    <p className="font-extrabold text-slate-900">Operador: Julio Cesar (Fresamento CNC)</p>
                    <p className="text-slate-500 text-[11px]">Máquina: ROMI D800 - Programa: CAV_DESB.NC</p>
                    <div className="flex gap-2 text-[10px] text-slate-400">
                      <span>Setup: 45 min</span>
                      <span>Ciclo de Corte: 120 min</span>
                    </div>
                  </div>
                </div>

                {/* Stage 4: Metrology */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-black text-purple-600 uppercase block">Etapa 4: Auditoria Dimensional</span>
                  <div className="bg-slate-50 p-3 rounded-xl border max-w-md mt-1.5 space-y-1">
                    <p className="font-extrabold text-slate-900">Metrologia Tridimensional CMM</p>
                    <p className="text-slate-500 text-[11px]">Status: Aprovado sob desvio micrométrico de +0.004 mm</p>
                    <span className="text-[10px] text-purple-600 font-bold block mt-0.5">Responsável: Rodrigo Metrologia</span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-semibold italic">
              Selecione um componente ativo no menu superior para rastrear a cadeia completa de produção.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
