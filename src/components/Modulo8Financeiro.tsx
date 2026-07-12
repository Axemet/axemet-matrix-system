import React from 'react';
import { BillingMilestone, CashTransaction, MatrixProject } from '../types';
import { Plus, Trash2, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Calendar, CheckSquare } from 'lucide-react';

interface Modulo8Props {
  milestones: BillingMilestone[];
  transactions: CashTransaction[];
  projects: MatrixProject[];
  onSaveMilestones: (m: BillingMilestone[]) => void;
  onSaveTransactions: (t: CashTransaction[]) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Modulo8Financeiro({
  milestones,
  transactions,
  projects,
  onSaveMilestones,
  onSaveTransactions,
  showToast,
}: Modulo8Props) {
  const [activeTab, setActiveTab] = React.useState<'milestones' | 'cashflow'>('milestones');

  // Milestone Form States
  const [msProjId, setMsProjId] = React.useState('');
  const [msDesc, setMsDesc] = React.useState('Aprovação Try-Out T1');
  const [msPercent, setMsPercent] = React.useState(40);
  const [msDate, setMsDate] = React.useState(new Date().toISOString().split('T')[0]);

  // Cashflow Transaction Form States
  const [transProjId, setTransProjId] = React.useState('');
  const [transType, setTransType] = React.useState<'receita' | 'despesa'>('despesa');
  const [transCategory, setTransCategory] = React.useState<'material' | 'normalizado' | 'terceiro' | 'mão_de_obra' | 'energia' | 'cliente_faturamento' | 'outros'>('material');
  const [transDesc, setTransDesc] = React.useState('Compra de Aço P20 Cavidade Central');
  const [transValue, setTransValue] = React.useState(4500);

  React.useEffect(() => {
    if (projects.length > 0) {
      if (!msProjId) setMsProjId(projects[0].id);
      if (!transProjId) setTransProjId(projects[0].id);
    }
  }, [projects, msProjId, transProjId]);

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === msProjId);
    if (!proj) return;

    // Calculate value based on percent and project total
    const value = Math.round((msPercent / 100) * proj.costs.orçado);

    const newMs: BillingMilestone = {
      id: `ms_${Date.now()}`,
      projectId: msProjId,
      projectName: proj.reference,
      description: msDesc,
      percent: Number(msPercent),
      value,
      dueDate: msDate,
      status: 'pending'
    };

    onSaveMilestones([...milestones, newMs]);
    showToast(`Marco faturamento "${newMs.description}" criado para "${newMs.projectName}"!`, 'success');
  };

  const handleDeleteMilestone = (id: string) => {
    onSaveMilestones(milestones.filter(m => m.id !== id));
    showToast('Marco de faturamento removido.', 'info');
  };

  const handleBillMilestone = (ms: BillingMilestone) => {
    const updated = milestones.map(m => {
      if (m.id === ms.id) {
        return { ...m, status: 'billed' as const };
      }
      return m;
    });

    onSaveMilestones(updated);

    // Auto generate transaction receivable
    const newTrans: CashTransaction = {
      id: `trans_${Date.now()}`,
      projectId: ms.projectId,
      projectName: ms.projectName,
      type: 'receita',
      category: 'cliente_faturamento',
      description: `Faturamento emitido: ${ms.description}`,
      value: ms.value,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    onSaveTransactions([...transactions, newTrans]);
    showToast(`Faturamento faturado! Duplicata gerada no Contas a Receber.`, 'success');
  };

  const handlePayMilestone = (ms: BillingMilestone) => {
    const updated = milestones.map(m => {
      if (m.id === ms.id) {
        return { ...m, status: 'paid' as const };
      }
      return m;
    });
    onSaveMilestones(updated);

    // Update transactions linked to this milestone to paid
    const updatedTrans = transactions.map(t => {
      if (t.description === `Faturamento emitido: ${ms.description}` && t.projectId === ms.projectId) {
        return { ...t, status: 'paid' as const };
      }
      return t;
    });
    onSaveTransactions(updatedTrans);

    // Also enrich real costs
    const proj = projects.find(p => p.id === ms.projectId);
    if (proj) {
      const updatedProj = {
        ...proj,
        costs: {
          ...proj.costs,
          real: proj.costs.real + ms.value * 0.1 // simulated direct operational margin increase
        }
      };
      // Auto propagation of actual revenues
    }

    showToast(`Pagamento do faturamento homologado! Caixa alimentado.`, 'success');
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === transProjId);
    if (!proj) return;

    const newTrans: CashTransaction = {
      id: `trans_${Date.now()}`,
      projectId: transProjId,
      projectName: proj.reference,
      type: transType,
      category: transCategory,
      description: transDesc,
      value: Number(transValue),
      date: new Date().toISOString().split('T')[0],
      status: 'paid'
    };

    onSaveTransactions([...transactions, newTrans]);
    showToast(`Lançamento financeiro "${newTrans.description}" compensado no caixa!`, 'success');
    setTransDesc('');
  };

  const handleDeleteTransaction = (id: string) => {
    onSaveTransactions(transactions.filter(t => t.id !== id));
    showToast('Lançamento financeiro estornado.', 'info');
  };

  // Calculations for KPI banners
  const totalReceivables = transactions.filter(t => t.type === 'receita').reduce((acc, curr) => acc + curr.value, 0);
  const totalPayables = transactions.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + curr.value, 0);
  const currentCashBalance = totalReceivables - totalPayables;

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Gestão Financeira, Contas e Faturamento por Eventos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Agende parcelas faturáveis vinculadas a marcos do projeto, lance despesas industriais e acompanhe o fluxo de caixa consolidado.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'milestones' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Marcos de Faturamento
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'cashflow' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fluxo de Caixa & Lançamentos
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase">Receita Realizada (Entradas)</span>
            <span className="text-lg font-extrabold text-emerald-600 block">R$ {totalReceivables.toLocaleString()}</span>
          </div>
          <ArrowUpRight className="w-8 h-8 text-emerald-500/25 shrink-0" />
        </div>
        
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase">Despesas Compensadas (Saídas)</span>
            <span className="text-lg font-extrabold text-red-600 block">R$ {totalPayables.toLocaleString()}</span>
          </div>
          <ArrowDownRight className="w-8 h-8 text-red-500/25 shrink-0" />
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase">Saldo Líquido Operacional</span>
            <span className={`text-lg font-extrabold block ${currentCashBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {currentCashBalance.toLocaleString()}
            </span>
          </div>
          <Wallet className="w-8 h-8 text-slate-400/20 shrink-0" />
        </div>
      </div>

      {activeTab === 'milestones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Milestone scheduling form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              📅 Cadastrar Marco de Faturamento (Contrato)
            </h3>

            <form onSubmit={handleAddMilestone} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Selecione o Projeto</label>
                <select
                  required
                  value={msProjId}
                  onChange={(e) => setMsProjId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
                >
                  <option value="">-- Escolher Molde --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>({p.reference}) R$ {p.costs.orçado.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Evento faturável</label>
                <select
                  value={msDesc}
                  onChange={(e) => setMsDesc(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
                >
                  <option value="Sinal / Assinatura do Contrato">Sinal / Assinatura do Contrato</option>
                  <option value="Aprovação do Projeto 3D final">Aprovação do Projeto 3D final</option>
                  <option value="Aprovação Try-Out T1">Aprovação Try-Out T1</option>
                  <option value="Entrega Técnica na Planta Cliente">Entrega Técnica na Planta Cliente</option>
                  <option value="Saldo de Retenção Técnico (Garantia)">Saldo de Retenção Técnico (Garantia)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">% do Valor Contrato</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={msPercent}
                    onChange={(e) => setMsPercent(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Previsão Faturamento</label>
                  <input
                    type="date"
                    required
                    value={msDate}
                    onChange={(e) => setMsDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
              >
                Sequenciar Parcela Contratual
              </button>
            </form>
          </div>

          {/* Milestone List */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              📊 Parcelas e Marcos Faturáveis do Portfólio
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                    <th className="p-3">Molde Vinculado</th>
                    <th className="p-3">Marco Contratual</th>
                    <th className="p-3 font-mono">Porcentagem</th>
                    <th className="p-3 font-mono">Valor Fatura</th>
                    <th className="p-3">Data Venc.</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Ação Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {milestones.map(ms => (
                    <tr key={ms.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-mono text-slate-900 font-bold">{ms.projectName}</td>
                      <td className="p-3 font-bold text-slate-800">{ms.description}</td>
                      <td className="p-3 font-mono font-extrabold text-slate-900">{ms.percent}%</td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">R$ {ms.value.toLocaleString()}</td>
                      <td className="p-3 font-mono text-slate-500">{ms.dueDate}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          ms.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : ms.status === 'billed'
                              ? 'bg-blue-50 text-blue-700 animate-pulse'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {ms.status === 'paid' ? 'Compensado' : ms.status === 'billed' ? 'Faturado' : 'Aguardando Evento'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2.5">
                          {ms.status === 'pending' && (
                            <button
                              onClick={() => handleBillMilestone(ms)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition"
                            >
                              Faturar
                            </button>
                          )}
                          {ms.status === 'billed' && (
                            <button
                              onClick={() => handlePayMilestone(ms)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition"
                            >
                              Receber
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMilestone(ms.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Manual accounting entry form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              📝 Lançar Entrada / Saída Manual (Caixa)
            </h3>

            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Molde Vinculado</label>
                  <select
                    value={transProjId}
                    onChange={(e) => setTransProjId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.reference}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Operação</label>
                  <select
                    value={transType}
                    onChange={(e) => setTransType(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800 font-bold"
                  >
                    <option value="receita">Entrada (Receita)</option>
                    <option value="despesa">Saída (Despesa)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                  <select
                    value={transCategory}
                    onChange={(e) => setTransCategory(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-50 border rounded text-slate-800"
                  >
                    <option value="material">Matéria prima</option>
                    <option value="normalizado">Normalizados</option>
                    <option value="terceiro">Terceirização</option>
                    <option value="mão_de_obra">Mão de obra</option>
                    <option value="energia">Utilidades (Energia)</option>
                    <option value="cliente_faturamento">Faturamento Cliente</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Valor do Lançamento (R$)</label>
                  <input
                    type="number"
                    required
                    value={transValue}
                    onChange={(e) => setTransValue(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Histórico / Descrição</label>
                <input
                  type="text"
                  required
                  value={transDesc}
                  onChange={(e) => setTransDesc(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
              >
                Compensar no Livro Caixa
              </button>
            </form>
          </div>

          {/* Transaction journal */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              📖 Diário de Caixa e Conciliações Compensadas
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                    <th className="p-3">Data</th>
                    <th className="p-3">Molde</th>
                    <th className="p-3">Histórico Lançamento</th>
                    <th className="p-3">Classificação</th>
                    <th className="p-3 font-mono">Valor</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-mono text-slate-500">{t.date}</td>
                      <td className="p-3 font-mono font-bold">{t.projectName}</td>
                      <td className="p-3 font-bold text-slate-800">{t.description}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold">
                          {t.category}
                        </span>
                      </td>
                      <td className={`p-3 font-mono font-extrabold ${t.type === 'receita' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {t.type === 'receita' ? `+ R$ ${t.value.toLocaleString()}` : `- R$ ${t.value.toLocaleString()}`}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
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
      )}

    </div>
  );
}
