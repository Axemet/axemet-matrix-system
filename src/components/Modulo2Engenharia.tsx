import React from 'react';
import { MatrixProject, BOMItem, Subproject, Revision, BudgetDraft, ProjectDoc } from '../types';
import { getCommercialBudgetValue } from '../utils/calculations';
import { Plus, Trash2, FileText, Settings, Layers, Code, CheckCircle, AlertTriangle, GitCommit } from 'lucide-react';

interface Modulo2Props {
  projects: MatrixProject[];
  approvedBudgets: BudgetDraft[];
  onSaveProject: (p: MatrixProject) => void;
  onDeleteProject: (id: string) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Modulo2Engenharia({
  projects,
  approvedBudgets,
  onSaveProject,
  onDeleteProject,
  showToast,
}: Modulo2Props) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');
  
  // Form States for creating/editing Projects from approved budgets
  const [selectedBudgetIdForNewProj, setSelectedBudgetIdForNewProj] = React.useState<string>('');

  // Active Project
  const activeProj = projects.find(p => p.id === selectedProjectId);

  // Form States for BOM
  const [bomName, setBomName] = React.useState('');
  const [bomMaterial, setBomMaterial] = React.useState('Aço P20');
  const [bomSource, setBomSource] = React.useState<'internal' | 'standard'>('internal');
  const [bomDimensions, setBomDimensions] = React.useState('');
  const [bomQty, setBomQty] = React.useState(1);
  const [bomCatalog, setBomCatalog] = React.useState<'Hasco' | 'DME' | 'Meusburger' | 'Polimold' | 'Outro'>('Hasco');
  const [bomCode, setBomCode] = React.useState('');

  // Form States for Revisions
  const [revVersion, setRevVersion] = React.useState('');
  const [revDescription, setRevDescription] = React.useState('');
  const [revReason, setRevReason] = React.useState('');
  const [revAuthor, setRevAuthor] = React.useState('');

  // Form States for Documents
  const [docName, setDocName] = React.useState('');
  const [docType, setDocType] = React.useState<'2D' | '3D' | 'cert' | 'meas'>('3D');
  const [docUrl, setDocUrl] = React.useState('');

  // Form States for Subprojects
  const [subName, setSubName] = React.useState('');
  const [subDesc, setSubDesc] = React.useState('');

  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleCreateProjectFromBudget = () => {
    const budget = approvedBudgets.find(b => b.id === selectedBudgetIdForNewProj);
    if (!budget) {
      showToast('Por favor, selecione um orçamento aprovado válido.', 'error');
      return;
    }

    // Check if project already exists
    if (projects.some(p => p.id === budget.id)) {
      showToast('Já existe um projeto para este orçamento!', 'error');
      return;
    }

    // Map budget plates to BOM items
    const bomItems: BOMItem[] = budget.materials.map((m, idx) => ({
      id: `bom_m_${idx}_${Date.now()}`,
      name: m.name,
      material: m.material,
      source: 'internal',
      dimensions: `${m.esp}x${m.larg}x${m.comp} mm`,
      qty: m.qtd,
      weightBruto: m.total / (m.valKg || 1), // estimation
      weightLiquido: (m.total / (m.valKg || 1)) * 0.9,
      status: 'pending',
      operations: [
        {
          id: `op_desbaste_${idx}_${Date.now()}`,
          bomItemId: `bom_m_${idx}_${Date.now()}`,
          name: 'Fresamento de Desbaste',
          workCenter: 'CNC ROMI D800',
          setupTime: 45,
          cycleTime: m.machiningTimes?.['mt_fresa'] ? m.machiningTimes['mt_fresa'] * 30 : 120, // base cycle calc
          queueTime: 2,
          tools: ['Fresa de desbaste Ø20', 'Pastilhas APMT'],
          status: 'pending',
          cncProgram: `\\CNC\\${budget.reference?.replace('/', '') || 'MOLDE'}\\DESBASTE_${m.name.substring(0,6).toUpperCase()}.NC`
        },
        {
          id: `op_acabamento_${idx}_${Date.now()}`,
          bomItemId: `bom_m_${idx}_${Date.now()}`,
          name: 'Fresamento de Acabamento',
          workCenter: 'CNC ROMI D800',
          setupTime: 30,
          cycleTime: m.machiningTimes?.['mt_fresa'] ? m.machiningTimes['mt_fresa'] * 30 : 90,
          queueTime: 1,
          tools: ['Fresa esférica Ø6', 'Fresa esférica Ø3'],
          status: 'pending',
          cncProgram: `\\CNC\\${budget.reference?.replace('/', '') || 'MOLDE'}\\ACABAMENTO_${m.name.substring(0,6).toUpperCase()}.NC`
        }
      ]
    }));

    // Standard items too
    budget.thirdPartyItems?.forEach((tp, idx) => {
      if (tp.qtd > 0) {
        bomItems.push({
          id: `bom_tp_${idx}_${Date.now()}`,
          name: tp.description,
          material: 'Normalizado',
          source: 'standard',
          qty: tp.qtd,
          catalog: tp.description.toLowerCase().includes('hasco') ? 'Hasco' : tp.description.toLowerCase().includes('dme') ? 'DME' : 'Polimold',
          catalogCode: `CAT-${idx}-CODE`,
          status: 'pending',
          operations: []
        });
      }
    });

    const newProject: MatrixProject = {
      id: budget.id,
      reference: budget.reference || `PRJ-${Date.now().toString().slice(-4)}`,
      clientName: budget.clientName,
      moldDescription: budget.moldDescription,
      moldType: budget.moldType || 'Plástico Injeção',
      moldingMaterial: budget.moldingMaterial || 'Polipropileno (PP)',
      productQuantity: budget.productQuantity || 1000,
      deliveryTime: budget.deliveryTime || '45 dias',
      status: 'planning',
      date: budget.date,
      moldWidth: budget.moldWidth,
      moldLength: budget.moldLength,
      subprojects: [
        { id: 'sub_inj', name: 'Lado de Injeção', description: 'Placa cavidade, colunas e buchas de guia' },
        { id: 'sub_ext', name: 'Lado de Extração', description: 'Placa macho, extratores e molas' }
      ],
      bom: bomItems,
      revisions: [
        {
          id: `rev_0_${Date.now()}`,
          version: 'R00',
          author: 'Engenharia Central',
          date: new Date().toISOString().split('T')[0],
          description: 'Projeto preliminar importado da aprovação comercial.',
          reason: 'Abertura de projeto'
        }
      ],
      costs: {
        orçado: getCommercialBudgetValue(budget),
        real: 0,
        detalhado: {
          materials: budget.totals.materialsTotal,
          normalizados: budget.totals.thirdPartyTotal,
          horasMaquina: budget.totals.internalTotal * 0.6,
          maoDeObra: budget.totals.internalTotal * 0.4,
          terceiros: 0,
          refugo: 0
        }
      },
      documents: [
        {
          id: `doc_1_${Date.now()}`,
          name: 'Modelo 3D - Molde Completo',
          type: '3D',
          url: 'servidor/projetos/molde_completo_v0.stp',
          date: new Date().toISOString().split('T')[0]
        }
      ]
    };

    onSaveProject(newProject);
    setSelectedProjectId(newProject.id);
    setSelectedBudgetIdForNewProj('');
    showToast(`Projeto "${newProject.reference}" criado a partir do orçamento aprovado!`, 'success');
  };

  const handleAddBOMItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;

    const newItem: BOMItem = {
      id: `bom_item_${Date.now()}`,
      name: bomName,
      material: bomMaterial,
      source: bomSource,
      dimensions: bomDimensions || undefined,
      qty: bomQty,
      catalog: bomSource === 'standard' ? bomCatalog : undefined,
      catalogCode: bomSource === 'standard' ? bomCode : undefined,
      status: 'pending',
      operations: bomSource === 'internal' ? [
        {
          id: `op_int_${Date.now()}`,
          bomItemId: `bom_item_${Date.now()}`,
          name: 'Ajustagem Mecânica',
          workCenter: 'Bancada de Ajustagem',
          setupTime: 15,
          cycleTime: 60,
          queueTime: 1,
          tools: ['Limas', 'Lixas'],
          status: 'pending'
        }
      ] : []
    };

    const updatedProject = {
      ...activeProj,
      bom: [...activeProj.bom, newItem]
    };

    onSaveProject(updatedProject);
    setBomName('');
    setBomDimensions('');
    setBomQty(1);
    setBomCode('');
    showToast(`Componente "${newItem.name}" adicionado à BOM!`, 'success');
  };

  const handleDeleteBOMItem = (itemId: string) => {
    if (!activeProj) return;

    const updatedProject = {
      ...activeProj,
      bom: activeProj.bom.filter(item => item.id !== itemId)
    };

    onSaveProject(updatedProject);
    showToast('Componente removido da BOM.', 'info');
  };

  const handleAddRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;

    const newRev: Revision = {
      id: `rev_${Date.now()}`,
      version: revVersion,
      author: revAuthor || 'Engenharia',
      date: new Date().toISOString().split('T')[0],
      description: revDescription,
      reason: revReason
    };

    const updatedProject = {
      ...activeProj,
      revisions: [newRev, ...activeProj.revisions]
    };

    onSaveProject(updatedProject);
    setRevVersion('');
    setRevDescription('');
    setRevReason('');
    setRevAuthor('');
    showToast(`Revisão "${newRev.version}" homologada!`, 'success');
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;

    const newDoc: ProjectDoc = {
      id: `doc_${Date.now()}`,
      name: docName,
      type: docType,
      url: docUrl || `servidor/projetos/desenho_${docName.toLowerCase().replace(/\s/g, '_')}.dwg`,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedProject = {
      ...activeProj,
      documents: [...activeProj.documents, newDoc]
    };

    onSaveProject(updatedProject);
    setDocName('');
    setDocUrl('');
    showToast(`Documento técnico "${newDoc.name}" arquivado!`, 'success');
  };

  const handleAddSubproject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;

    const newSub: Subproject = {
      id: `sub_${Date.now()}`,
      name: subName,
      description: subDesc
    };

    const updatedProject = {
      ...activeProj,
      subprojects: [...activeProj.subprojects, newSub]
    };

    onSaveProject(updatedProject);
    setSubName('');
    setSubDesc('');
    showToast(`Conjunto funcional "${newSub.name}" estruturado!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            Engenharia e Estrutura do Projeto (Moldes)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie conjuntos, revise desenhos homologados, e controle a BOM multinível do molde.
          </p>
        </div>
        
        {/* Project Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Molde Ativo:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 rounded-lg cursor-pointer focus:ring-1 focus:ring-orange-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>({p.reference}) {p.clientName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Create Project from Approved Quote trigger */}
          {approvedBudgets.filter(b => !projects.some(p => p.id === b.id)).length > 0 ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <select
                value={selectedBudgetIdForNewProj}
                onChange={(e) => setSelectedBudgetIdForNewProj(e.target.value)}
                className="px-2.5 py-1.5 bg-orange-50 border border-orange-200 text-xs font-bold text-orange-800 rounded-lg cursor-pointer"
              >
                <option value="">-- Selecionar Aprovado --</option>
                {approvedBudgets.filter(b => !projects.some(p => p.id === b.id)).map(b => (
                  <option key={b.id} value={b.id}>({b.reference}) {b.clientName}</option>
                ))}
              </select>
              <button
                onClick={handleCreateProjectFromBudget}
                disabled={!selectedBudgetIdForNewProj}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Criar Projeto
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-semibold bg-slate-50 p-2 rounded-lg border">
              Aprove orçamentos no Comercial para liberar novos projetos
            </div>
          )}
        </div>
      </div>

      {activeProj ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Project Structure & BOM */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Structural tree / Subprojects */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                <Layers className="w-4 h-4 text-orange-500" />
                Estrutura de Subprojetos (Conjuntos Funcionais)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeProj.subprojects?.map(sub => (
                  <div key={sub.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">{sub.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">{sub.description}</p>
                    </div>
                  </div>
                ))}

                {/* Quick Add Subproject */}
                <form onSubmit={handleAddSubproject} className="p-3 border border-dashed border-slate-300 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Criar Novo Conjunto</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sistema de Refrigeração"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full p-1 text-xs border bg-slate-50/50 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Breve descrição"
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                    className="w-full p-1 text-xs border bg-slate-50/50 rounded"
                  />
                  <button
                    type="submit"
                    className="w-full py-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold uppercase rounded transition"
                  >
                    Adicionar Conjunto
                  </button>
                </form>
              </div>
            </div>

            {/* Complete BOM */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Code className="w-4 h-4 text-orange-500" />
                  BOM Multinível (Lista de Componentes)
                </h3>
                <span className="px-2.5 py-0.5 bg-slate-100 text-[10px] font-mono font-black text-slate-600 rounded-full">
                  {activeProj.bom.length} Itens cadastrados
                </span>
              </div>

              {/* Add BOM Item Form */}
              <form onSubmit={handleAddBOMItem} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nome da Peça</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bucha de Guia Central"
                    value={bomName}
                    onChange={(e) => setBomName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border rounded text-xs text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Origem</label>
                  <select
                    value={bomSource}
                    onChange={(e) => setBomSource(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border rounded text-xs text-slate-800"
                  >
                    <option value="internal">Usinagem Interna</option>
                    <option value="standard">Normalizado (Catálogo)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Material / Catálogo</label>
                  {bomSource === 'internal' ? (
                    <select
                      value={bomMaterial}
                      onChange={(e) => setBomMaterial(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border rounded text-xs text-slate-800"
                    >
                      <option value="Aço P20">Aço P20</option>
                      <option value="Aço H13">Aço H13</option>
                      <option value="Aço 1045">Aço 1045</option>
                      <option value="Cobre eletrolítico">Cobre</option>
                      <option value="Grafite EDM">Grafite</option>
                    </select>
                  ) : (
                    <select
                      value={bomCatalog}
                      onChange={(e) => setBomCatalog(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-white border rounded text-xs text-slate-800"
                    >
                      <option value="Hasco">Hasco</option>
                      <option value="DME">DME</option>
                      <option value="Meusburger">Meusburger</option>
                      <option value="Polimold">Polimold</option>
                      <option value="Outro">Outros</option>
                    </select>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {bomSource === 'internal' ? 'Dimensões (Ex: 25x100 mm)' : 'Código Catálogo'}
                  </label>
                  <input
                    type="text"
                    placeholder={bomSource === 'internal' ? 'Dimensões brutas' : 'Ex: Z12/12x100'}
                    value={bomSource === 'internal' ? bomDimensions : bomCode}
                    onChange={(e) => bomSource === 'internal' ? setBomDimensions(e.target.value) : setBomCode(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border rounded text-xs text-slate-800"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bomQty}
                    onChange={(e) => setBomQty(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border rounded text-xs text-slate-800"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded text-xs cursor-pointer text-center"
                    title="Adicionar Peça"
                  >
                    +
                  </button>
                </div>
              </form>

              {/* BOM Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                      <th className="p-3">Componente</th>
                      <th className="p-3">Origem</th>
                      <th className="p-3">Material/Fornecedor</th>
                      <th className="p-3">Medidas/Código</th>
                      <th className="p-3">Qtd</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {activeProj.bom.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3">
                          <span className="font-extrabold text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{item.id}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            item.source === 'internal' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {item.source === 'internal' ? 'INTERNO' : 'NORMALIZADO'}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.source === 'internal' ? item.material : `Catálogo: ${item.catalog}`}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {item.source === 'internal' ? item.dimensions || 'N/D' : item.catalogCode || 'N/D'}
                        </td>
                        <td className="p-3 font-mono font-extrabold text-slate-900">{item.qty}</td>
                        <td className="p-3">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {item.status === 'pending' ? 'Pendente' : item.status === 'ordered' ? 'Comprado' : 'Pronto'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteBOMItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition hover:bg-red-50 rounded"
                            title="Remover Item"
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

          {/* RIGHT: Document Archiving & Revisions */}
          <div className="space-y-6">
            
            {/* Revision Control block */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                <GitCommit className="w-4 h-4 text-orange-500" />
                Controle de Revisões Homologadas
              </h3>

              {/* Add Revision form */}
              <form onSubmit={handleAddRevision} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Homologar Nova Versão</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Revisão (Ex: R01)</label>
                    <input
                      type="text"
                      required
                      placeholder="R01"
                      value={revVersion}
                      onChange={(e) => setRevVersion(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border rounded text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Autor</label>
                    <input
                      type="text"
                      placeholder="Nome do Engenheiro"
                      value={revAuthor}
                      onChange={(e) => setRevAuthor(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border rounded text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Modificações Realizadas</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alterado diâmetro do canal de injeção"
                    value={revDescription}
                    onChange={(e) => setRevDescription(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border rounded text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Motivo / Causa da Alteração</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Solicitação do cliente / Ajuste de fluxo"
                    value={revReason}
                    onChange={(e) => setRevReason(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border rounded text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-850 hover:bg-slate-900 text-white font-bold uppercase rounded text-[10px] transition cursor-pointer"
                >
                  Registrar Alteração Homologada
                </button>
              </form>

              {/* Revisions timeline list */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {activeProj.revisions.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 border-l-2 border-orange-500 rounded-r-lg text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-orange-600 font-mono text-xs">{rev.version}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{rev.date}</span>
                    </div>
                    <p className="font-bold text-slate-800">{rev.description}</p>
                    <p className="text-[10px] text-slate-500 font-medium italic">Motivo: {rev.reason}</p>
                    <p className="text-[9px] text-slate-400 text-right">Por: {rev.author}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document / Drawing storage */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Arquivos e Desenhos do Chão de Fábrica
              </h3>

              {/* Add Doc Form */}
              <form onSubmit={handleAddDocument} className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Anexar Novo Arquivo</span>
                
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Detalhamento Lado Extração - R01"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-2 py-1 bg-white border rounded text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-2 py-1 bg-white border rounded text-xs text-slate-800"
                  >
                    <option value="3D">Modelo 3D (STP/IGS)</option>
                    <option value="2D">Desenho 2D (PDF/DWG)</option>
                    <option value="cert">Certificado de Aço</option>
                    <option value="meas">Relatório de Medição</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Caminho do arquivo"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    className="w-full px-2 py-1 bg-white border rounded text-xs text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase rounded text-[9px] transition cursor-pointer"
                >
                  Homologar Arquivo Técnico
                </button>
              </form>

              {/* Documents List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {activeProj.documents.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">
                        {doc.type === '3D' ? '📦' : doc.type === '2D' ? '📐' : '📄'}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 block leading-tight">{doc.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{doc.url}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{doc.date}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-white border rounded-2xl p-8 space-y-3">
          <Settings className="w-12 h-12 text-slate-300 mx-auto animate-spin-slow" />
          <h3 className="font-extrabold text-slate-900 uppercase">Nenhum Projeto Ativo Cadastrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Vincule um orçamento aprovado acima ou aprove novas propostas comerciais na aba <strong>Comercial / Orçamentos</strong>.
          </p>
        </div>
      )}

    </div>
  );
}
