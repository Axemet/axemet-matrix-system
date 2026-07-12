import React from 'react';
import { RawMaterialStock, StandardComponentStock, CuttingTool, MatrixProject } from '../types';
import { Plus, Trash2, Package, Award, AlertCircle, RefreshCw, Layers, ShieldCheck } from 'lucide-react';

interface Modulo4Props {
  rawStock: RawMaterialStock[];
  stdStock: StandardComponentStock[];
  tools: CuttingTool[];
  projects: MatrixProject[];
  onSaveRawStock: (s: RawMaterialStock[]) => void;
  onSaveStdStock: (s: StandardComponentStock[]) => void;
  onSaveTools: (t: CuttingTool[]) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  triggerPurchaseRequest: (projId: string, itemType: string, desc: string, qty: number) => void;
}

export default function Modulo4Estoque({
  rawStock,
  stdStock,
  tools,
  projects,
  onSaveRawStock,
  onSaveStdStock,
  onSaveTools,
  showToast,
  triggerPurchaseRequest,
}: Modulo4Props) {
  const [activeTab, setActiveTab] = React.useState<'raw' | 'std' | 'tools'>('raw');

  // Raw steel form states
  const [rawType, setRawType] = React.useState('Aço P20');
  const [rawDim, setRawDim] = React.useState('50x300x400 mm');
  const [rawWeight, setRawWeight] = React.useState(47);
  const [rawBatch, setRawBatch] = React.useState('LOT-99831');
  const [rawDureza, setRawDureza] = React.useState('30-34 HRC');
  const [rawCert, setRawCert] = React.useState('cert_usiminas_p20_a.pdf');

  // Standard part form states
  const [stdCatalog, setStdCatalog] = React.useState<'Hasco' | 'DME' | 'Meusburger' | 'Polimold' | 'Outro'>('Hasco');
  const [stdCode, setStdCode] = React.useState('Z12/12x120');
  const [stdName, setStdName] = React.useState('Coluna de Guia Principal');
  const [stdQty, setStdQty] = React.useState(16);
  const [stdMin, setStdMin] = React.useState(8);
  const [stdPrice, setStdPrice] = React.useState(120);

  // Tool form states
  const [toolName, setToolName] = React.useState('Fresa Toroidal de Carboneto Ø10 R1');
  const [toolLife, setToolLife] = React.useState(150);
  const [toolUsed, setToolUsed] = React.useState(15);

  const handleAddRawStock = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: RawMaterialStock = {
      id: `raw_stk_${Date.now()}`,
      type: rawType,
      dimensions: rawDim,
      weight: Number(rawWeight),
      batch: rawBatch,
      qualityDureza: rawDureza,
      certificateUrl: rawCert,
      status: 'available'
    };

    onSaveRawStock([...rawStock, newItem]);
    setRawBatch(`LOT-${Math.floor(Math.random() * 90000 + 10000)}`);
    showToast(`Lote de aço "${newItem.type} - ${newItem.batch}" adicionado ao inventário!`, 'success');
  };

  const handleDeleteRawStock = (id: string) => {
    onSaveRawStock(rawStock.filter(r => r.id !== id));
    showToast('Lote de aço removido do inventário.', 'info');
  };

  const handleAddStdStock = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StandardComponentStock = {
      id: `std_stk_${Date.now()}`,
      catalog: stdCatalog,
      code: stdCode,
      name: stdName,
      stock: Number(stdQty),
      minStock: Number(stdMin),
      price: Number(stdPrice)
    };

    onSaveStdStock([...stdStock, newItem]);
    setStdCode('');
    setStdName('');
    showToast(`Normalizado "${newItem.name} - ${newItem.code}" adicionado!`, 'success');
  };

  const handleDeleteStdStock = (id: string) => {
    onSaveStdStock(stdStock.filter(s => s.id !== id));
    showToast('Normalizado removido do inventário.', 'info');
  };

  const handleAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    const pct = (toolUsed / toolLife) * 100;
    const status = pct >= 100 ? 'expired' : pct > 85 ? 'warning' : 'active';

    const newItem: CuttingTool = {
      id: `tool_${Date.now()}`,
      name: toolName,
      lifeHours: Number(toolLife),
      usedHours: Number(toolUsed),
      status
    };

    onSaveTools([...tools, newItem]);
    setToolName('');
    showToast(`Ferramenta "${newItem.name}" registrada!`, 'success');
  };

  const handleDeleteTool = (id: string) => {
    onSaveTools(tools.filter(t => t.id !== id));
    showToast('Ferramenta removida.', 'info');
  };

  const handleTriggerBuyNormalizado = (item: StandardComponentStock) => {
    // Attempt to trigger purchase request
    const diff = item.minStock * 2 - item.stock;
    const buyQty = diff > 0 ? diff : item.minStock;
    triggerPurchaseRequest(
      projects[0]?.id || 'ESTOQUE_MINIMO',
      'normalizado',
      `Reposição de Estoque Mínimo: ${item.name} (${item.catalog} - ${item.code})`,
      buyQty
    );
    showToast(`Solicitação de Compra gerada para reposição de "${item.code}"!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            Gestão de Materiais, Ferramentas e Estoque
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreabilidade total de tarugos de aço com certificado, controle de peças normatizadas de catálogo e vida útil do ferramental CNC.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border">
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'raw' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aço Bruto (Tarugos)
          </button>
          <button
            onClick={() => setActiveTab('std')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'std' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normalizados (Catálogo)
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'tools' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ferramental (Fresa/Inserto)
          </button>
        </div>
      </div>

      {activeTab === 'raw' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add raw steel tarugo */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              Receber Tarugo de Aço Laminado/Forjado
            </h3>

            <form onSubmit={handleAddRawStock} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Qualidade do Aço</label>
                <select
                  value={rawType}
                  onChange={(e) => setRawType(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
                >
                  <option value="Aço P20 (1.2738)">Aço P20 (1.2738) - Cavidades/Machos</option>
                  <option value="Aço H13 (1.2344)">Aço H13 (1.2344) - Moldes de alta temp</option>
                  <option value="Aço 1045 Pro">Aço 1045 - Estruturas / Placas de fixação</option>
                  <option value="Aço M300 (1.2083)">Aço M300 Inox - Peças corrosivas</option>
                  <option value="Aço DF2 (Vasco)">Aço DF2 (Trabalho a frio)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Medidas Nominais (Esp x Larg x Comp)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 60 x 300 x 350 mm"
                  value={rawDim}
                  onChange={(e) => setRawDim(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Peso Balança (Kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rawWeight}
                    onChange={(e) => setRawWeight(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dureza Brinell/Rockwell</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 30-34 HRC"
                    value={rawDureza}
                    onChange={(e) => setRawDureza(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Corrida / Lote Fornecedor</label>
                  <input
                    type="text"
                    required
                    placeholder="Lote certificado"
                    value={rawBatch}
                    onChange={(e) => setRawBatch(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Anexar Certificado de Usina</label>
                  <input
                    type="text"
                    placeholder="Nome do arquivo PDF"
                    value={rawCert}
                    onChange={(e) => setRawCert(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 text-[11px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
              >
                Cadastrar Bloco no Estoque
              </button>
            </form>
          </div>

          {/* Raw steel list */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Blocos de Aço e Tarugos Disponíveis
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                    <th className="p-3">Qualidade de Liga</th>
                    <th className="p-3">Dimensões Brutas</th>
                    <th className="p-3">Peso Real</th>
                    <th className="p-3">Código Rastreável</th>
                    <th className="p-3">Dureza Homologada</th>
                    <th className="p-3">Certificado</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {rawStock.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 block">{r.type}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">ID: {r.id}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{r.dimensions}</td>
                      <td className="p-3 font-mono font-extrabold text-slate-900">{r.weight} Kg</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded">
                          {r.batch}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-emerald-700">{r.qualityDureza || '30 HRC'}</td>
                      <td className="p-3">
                        {r.certificateUrl ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5" title={r.certificateUrl}>
                            <Award className="w-3.5 h-3.5" /> PDF
                          </span>
                        ) : (
                          <span className="text-slate-400">Nenhum</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {r.status === 'available' ? 'Disponível' : 'Reservado'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteRawStock(r.id)}
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

      {activeTab === 'std' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add standard component form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              📥 Cadastrar Normalizado de Catálogo
            </h3>

            <form onSubmit={handleAddStdStock} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Catálogo</label>
                  <select
                    value={stdCatalog}
                    onChange={(e) => setStdCatalog(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
                  >
                    <option value="Hasco">Hasco</option>
                    <option value="DME">DME</option>
                    <option value="Meusburger">Meusburger</option>
                    <option value="Polimold">Polimold</option>
                    <option value="Outro">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Código Peça</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: E2000 / 12 x 100"
                    value={stdCode}
                    onChange={(e) => setStdCode(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Descritivo do Componente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Extrator de Cavidade Cônico"
                  value={stdName}
                  onChange={(e) => setStdName(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Qtd Atual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stdQty}
                    onChange={(e) => setStdQty(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ponto Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stdMin}
                    onChange={(e) => setStdMin(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Valor Unitário</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stdPrice}
                    onChange={(e) => setStdPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
              >
                Salvar Normalizado
              </button>
            </form>
          </div>

          {/* Normalizado list */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              📦 Estoque de Normalizados e Acessórios de Molde
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                    <th className="p-3">Catálogo / Marca</th>
                    <th className="p-3">Código do Fornecedor</th>
                    <th className="p-3">Componente Técnico</th>
                    <th className="p-3 font-mono">Qtd Atual</th>
                    <th className="p-3 font-mono">Qtd Mínima</th>
                    <th className="p-3">Preço Un.</th>
                    <th className="p-3">Suficiência</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {stdStock.map(s => {
                    const isLow = s.stock <= s.minStock;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded uppercase">
                            {s.catalog}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-900 font-bold">{s.code}</td>
                        <td className="p-3 font-bold text-slate-800">{s.name}</td>
                        <td className="p-3 font-mono font-extrabold text-slate-900">{s.stock}</td>
                        <td className="p-3 font-mono text-slate-500">{s.minStock}</td>
                        <td className="p-3 font-mono">R$ {s.price}</td>
                        <td className="p-3">
                          {isLow ? (
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-extrabold rounded flex items-center gap-0.5 w-fit">
                              <AlertCircle className="w-3 h-3" /> COMPRAR
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded w-fit">
                              OK
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            {isLow && (
                              <button
                                onClick={() => handleTriggerBuyNormalizado(s)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Solicitar Compra Imediata"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStdStock(s.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add cutting tool */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              ⚙️ Cadastrar Fresa / Ferramenta CNC
            </h3>

            <form onSubmit={handleAddTool} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome / Diâmetro / Especificação</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fresa de Topo Esférica Ø6 Metal Duro"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vida Útil Estimada (Horas)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={toolLife}
                    onChange={(e) => setToolLife(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Horas Usadas Iniciais</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={toolUsed}
                    onChange={(e) => setToolUsed(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
              >
                Adicionar Ferramental
              </button>
            </form>
          </div>

          {/* Cutting tools list */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              🛠️ Ferramentas Ativas na Usinagem (Controle de Desgaste)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                    <th className="p-3">Ferramenta Cadastrada</th>
                    <th className="p-3 font-mono">Horas Consumidas</th>
                    <th className="p-3 font-mono">Vida Útil Máxima</th>
                    <th className="p-3">Indicador de Desgaste</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {tools.map(t => {
                    const pct = Math.round((t.usedHours / t.lifeHours) * 100);
                    const isCritical = pct >= 90;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-extrabold text-slate-900">{t.name}</td>
                        <td className="p-3 font-mono font-bold">{t.usedHours} horas</td>
                        <td className="p-3 font-mono text-slate-400">{t.lifeHours} horas</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isCritical ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">{pct}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {isCritical ? (
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-black rounded uppercase">
                              REVESTIR / DESCARTAR
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded uppercase">
                              APTA PARA USO
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteTool(t.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
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

    </div>
  );
}
