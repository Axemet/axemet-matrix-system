import React from 'react';
import { PurchaseRequest, MatrixProject, RawMaterialStock, StandardComponentStock } from '../types';
import { Plus, Trash2, ShoppingBag, Eye, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

interface Modulo9Props {
  requests: PurchaseRequest[];
  projects: MatrixProject[];
  rawStock: RawMaterialStock[];
  stdStock: StandardComponentStock[];
  onSaveRequests: (r: PurchaseRequest[]) => void;
  onSaveRawStock: (s: RawMaterialStock[]) => void;
  onSaveStdStock: (s: StandardComponentStock[]) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Modulo9Compras({
  requests,
  projects,
  rawStock,
  stdStock,
  onSaveRequests,
  onSaveRawStock,
  onSaveStdStock,
  showToast,
}: Modulo9Props) {
  const [selectedReqIdForQuote, setSelectedReqIdForQuote] = React.useState<string>('');

  // Request creation form states
  const [reqProjId, setReqProjId] = React.useState('');
  const [reqType, setReqType] = React.useState<'materia_prima' | 'normalizado' | 'ferramenta' | 'servico_terceiro'>('materia_prima');
  const [reqDesc, setReqDesc] = React.useState('Bloco de Aço P20 Redondo Ø250x300mm');
  const [reqQty, setReqQty] = React.useState(1);

  // Quote form state (the 3 comparative suppliers)
  const [sup1Price, setSup1Price] = React.useState(3200);
  const [sup1Days, setSup1Days] = React.useState(5);
  const [sup2Price, setSup2Price] = React.useState(2950);
  const [sup2Days, setSup2Days] = React.useState(8);
  const [sup3Price, setSup3Price] = React.useState(3100);
  const [sup3Days, setSup3Days] = React.useState(4);

  // Selected supplier index for purchase
  const [chosenSupplier, setChosenSupplier] = React.useState<1 | 2 | 3>(2);

  React.useEffect(() => {
    if (projects.length > 0 && !reqProjId) {
      setReqProjId(projects[0].id);
    }
  }, [projects, reqProjId]);

  React.useEffect(() => {
    if (requests.length > 0 && !selectedReqIdForQuote) {
      // Find first pending quote request
      const pending = requests.find(r => r.status === 'pending_quote');
      if (pending) setSelectedReqIdForQuote(pending.id);
    }
  }, [requests, selectedReqIdForQuote]);

  const activeReqForQuote = requests.find(r => r.id === selectedReqIdForQuote);

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === reqProjId);
    if (!proj) return;

    const newReq: PurchaseRequest = {
      id: `req_${Date.now()}`,
      projectId: reqProjId,
      projectName: proj.reference,
      itemType: reqType,
      description: reqDesc,
      qty: Number(reqQty),
      status: 'pending_quote'
    };

    onSaveRequests([...requests, newReq]);
    showToast(`Solicitação de Compra para "${newReq.description}" registrada!`, 'success');
    setReqDesc('');
    setSelectedReqIdForQuote(newReq.id);
  };

  const handleDeleteRequest = (id: string) => {
    onSaveRequests(requests.filter(r => r.id !== id));
    showToast('Solicitação de compra removida.', 'info');
  };

  const handleSelectQuoteWinner = (supplierNum: 1 | 2 | 3) => {
    if (!activeReqForQuote) return;

    let winnerName = 'Aços Villares S.A.';
    let price = sup1Price;
    if (supplierNum === 2) {
      winnerName = 'Metalúrgica Gerdau';
      price = sup2Price;
    } else if (supplierNum === 3) {
      winnerName = 'Bohler-Uddeholm Brasil';
      price = sup3Price;
    }

    const updated = requests.map(r => {
      if (r.id === activeReqForQuote.id) {
        return {
          ...r,
          status: 'approved' as const,
          supplier: winnerName,
          quotedPrice: price
        };
      }
      return r;
    });

    onSaveRequests(updated);
    showToast(`Orçamento aprovado com "${winnerName}" por R$ ${price.toLocaleString()}!`, 'success');
  };

  const handleEmitOrder = (req: PurchaseRequest) => {
    const updated = requests.map(r => {
      if (r.id === req.id) {
        return { ...r, status: 'ordered' as const };
      }
      return r;
    });
    onSaveRequests(updated);
    showToast(`Pedido de compra emitido formalmente ao fornecedor "${req.supplier}"!`, 'success');
  };

  const handleReceiveGoods = (req: PurchaseRequest) => {
    const updated = requests.map(r => {
      if (r.id === req.id) {
        return {
          ...r,
          status: 'received' as const,
          certificateUrl: `cert_recebimento_${req.id}.pdf`
        };
      }
      return r;
    });
    onSaveRequests(updated);

    // Auto seed materials or std components inventory!
    if (req.itemType === 'materia_prima') {
      const newBlock: RawMaterialStock = {
        id: `raw_stk_auto_${Date.now()}`,
        type: req.description.includes('H13') ? 'Aço H13' : 'Aço P20',
        dimensions: 'Ajustar no almoxarifado',
        weight: req.qty * 50, // estimation
        batch: `CRT-${Math.floor(Math.random() * 90000 + 10000)}`,
        qualityDureza: '30 HRC (Recozido)',
        certificateUrl: `cert_recebimento_${req.id}.pdf`,
        status: 'available'
      };
      onSaveRawStock([...rawStock, newBlock]);
      showToast(`Bloco de aço "${newBlock.type}" incluído no Almoxarifado com certificado automático!`, 'success');
    } else if (req.itemType === 'normalizado') {
      const code = req.description.match(/[\w\d/x-]+/g)?.[0] || 'CAT-AUTO';
      const newPart: StandardComponentStock = {
        id: `std_stk_auto_${Date.now()}`,
        catalog: req.description.toLowerCase().includes('hasco') ? 'Hasco' : 'Polimold',
        code,
        name: req.description,
        stock: req.qty,
        minStock: Math.max(1, Math.round(req.qty * 0.5)),
        price: req.quotedPrice ? req.quotedPrice / req.qty : 150
      };
      onSaveStdStock([...stdStock, newPart]);
      showToast(`Acessório "${newPart.code}" acrescido ao estoque de normalizados!`, 'success');
    }

    showToast('Recebimento concluído no ERP!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Compras, Suprimentos e Recebimento com Laudo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crie cotações comparativas, emita pedidos de compras e homologue certificados metalúrgicos no recebimento de materiais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Request Creation */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            📥 Abrir Solicitação de Compra de Suprimento
          </h3>

          <form onSubmit={handleAddRequest} className="space-y-3.5 text-xs font-bold text-slate-700">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Molde Destino (Projeto)</label>
              <select
                required
                value={reqProjId}
                onChange={(e) => setReqProjId(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>({p.reference}) {p.moldDescription || p.clientName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de Material</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800"
                >
                  <option value="materia_prima">Aço / Cobre</option>
                  <option value="normalizado">Normalizado</option>
                  <option value="ferramenta">Fresa / Pastilha</option>
                  <option value="servico_terceiro">Tratamento Térmico</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reqQty}
                  onChange={(e) => setReqQty(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Especificação Técnica Detalhada</label>
              <input
                type="text"
                required
                placeholder="Ex: Bloco Aço P20 Retificado 60x150x200mm"
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border rounded text-slate-800 font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded text-xs tracking-wider transition cursor-pointer"
            >
              Registrar Requisição de Compra
            </button>
          </form>
        </div>

        {/* Center/Right column: Quote Sheet and Purchase flow */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Comparative sheet */}
          {activeReqForQuote ? (
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase block">Ficha de Cotação de Preços Tripla</span>
                  <h3 className="text-xs font-black uppercase text-slate-100">
                    Item: <span className="text-orange-400 font-extrabold">{activeReqForQuote.description}</span>
                  </h3>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Solicitação Ativa:</span>
                  <select
                    value={selectedReqIdForQuote}
                    onChange={(e) => setSelectedReqIdForQuote(e.target.value)}
                    className="bg-slate-800 border-none text-xs font-black text-white cursor-pointer px-2.5 py-1 rounded"
                  >
                    {requests.filter(r => r.status === 'pending_quote').map(r => (
                      <option key={r.id} value={r.id}>{r.projectName} - {r.description.substring(0, 20)}...</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Three Suppliers grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Supp 1 */}
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-3 relative text-xs">
                  <h4 className="font-extrabold text-slate-100 uppercase border-b border-slate-700 pb-1">1. Aços Villares S.A.</h4>
                  
                  <div className="space-y-1 text-slate-300 font-semibold text-[11px]">
                    <div className="flex justify-between">
                      <span>Preço Total:</span>
                      <strong className="text-white">R$ {sup1Price.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Prazo Entrega:</span>
                      <strong className="text-white">{sup1Days} dias úteis</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagamento:</span>
                      <strong className="text-white">Duplicata 30 DDL</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectQuoteWinner(1)}
                    className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition"
                  >
                    Aprovar Villares
                  </button>
                </div>

                {/* Supp 2 */}
                <div className="p-4 bg-slate-850 rounded-xl border-2 border-orange-500/50 shadow-sm space-y-3 relative text-xs">
                  <div className="absolute top-2 right-2 bg-orange-500 text-[8px] text-white px-1 rounded-full font-black uppercase">
                    Melhor Custo
                  </div>
                  <h4 className="font-extrabold text-slate-100 uppercase border-b border-slate-700 pb-1">2. Metalúrgica Gerdau</h4>
                  
                  <div className="space-y-1 text-slate-300 font-semibold text-[11px]">
                    <div className="flex justify-between">
                      <span>Preço Total:</span>
                      <strong className="text-white">R$ {sup2Price.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Prazo Entrega:</span>
                      <strong className="text-white">{sup2Days} dias úteis</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagamento:</span>
                      <strong className="text-white">Faturado 45 dias</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectQuoteWinner(2)}
                    className="w-full py-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition"
                  >
                    Aprovar Gerdau
                  </button>
                </div>

                {/* Supp 3 */}
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-3 relative text-xs">
                  <div className="absolute top-2 right-2 bg-blue-500 text-[8px] text-white px-1 rounded-full font-black uppercase">
                    Mais Rápido
                  </div>
                  <h4 className="font-extrabold text-slate-100 uppercase border-b border-slate-700 pb-1">3. Uddeholm Brasil</h4>
                  
                  <div className="space-y-1 text-slate-300 font-semibold text-[11px]">
                    <div className="flex justify-between">
                      <span>Preço Total:</span>
                      <strong className="text-white">R$ {sup3Price.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Prazo Entrega:</span>
                      <strong className="text-white">{sup3Days} dias úteis</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagamento:</span>
                      <strong className="text-white">À vista (5% Desc)</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectQuoteWinner(3)}
                    className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition"
                  >
                    Aprovar Bohler
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-900 text-slate-400 text-xs p-8 rounded-2xl text-center font-semibold italic">
              Não há solicitações pendentes de orçamento triplo.
            </div>
          )}

          {/* Active purchasing tracking logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              📋 Fluxo e Rastreamento de Pedidos de Compras
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                    <th className="p-3">Destino Molde</th>
                    <th className="p-3">Especificação Peça</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Parceiro Ganhador</th>
                    <th className="p-3">Valor Cotação</th>
                    <th className="p-3">Situação</th>
                    <th className="p-3 text-right">Ações Compras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-mono text-slate-500">{req.projectName}</td>
                      <td className="p-3">
                        <span className="font-extrabold text-slate-950 block">{req.description}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">QTD: {req.qty} pçs</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                          {req.itemType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 font-bold">{req.supplier || 'Pendente Cotação'}</td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">
                        {req.quotedPrice ? `R$ ${req.quotedPrice.toLocaleString()}` : 'Cotação aberta'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          req.status === 'received'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'ordered'
                              ? 'bg-blue-50 text-blue-700 animate-pulse'
                              : req.status === 'approved'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-amber-50 text-amber-700'
                        }`}>
                          {req.status === 'received' ? 'Recebido' : req.status === 'ordered' ? 'Em trânsito' : req.status === 'approved' ? 'Aprovado' : 'Aguardando Orçamentos'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2.5">
                          {req.status === 'approved' && (
                            <button
                              onClick={() => handleEmitOrder(req)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition"
                            >
                              Emitir Pedido
                            </button>
                          )}
                          {req.status === 'ordered' && (
                            <button
                              onClick={() => handleReceiveGoods(req)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition flex items-center gap-0.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Receber + Certificado
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
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

      </div>

    </div>
  );
}
