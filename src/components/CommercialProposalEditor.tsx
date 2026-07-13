import React from 'react';
import { Plus, Trash2, FileText, Landmark, Truck, CalendarDays, Calculator, ArrowRight } from 'lucide-react';
import { CommercialTerms, ProposalItem } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';

interface Props {
  items: ProposalItem[];
  terms: CommercialTerms;
  onItemsChange: (items: ProposalItem[]) => void;
  onTermsChange: (terms: CommercialTerms) => void;
  onAddCurrentTechnicalItem: () => void;
  onPrepareNextTechnicalItem: () => void;
}

const newEvent = () => ({ id: `billing_event_${Date.now()}`, description: 'Parcela comercial', percent: 0, dueDays: 0 });

export default function CommercialProposalEditor({ items, terms, onItemsChange, onTermsChange, onAddCurrentTechnicalItem, onPrepareNextTechnicalItem }: Props) {
  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const updateEvent = (id: string, patch: Partial<CommercialTerms['billingSchedule'][number]>) => onTermsChange({ ...terms, billingSchedule: terms.billingSchedule.map(event => event.id === id ? { ...event, ...patch } : event) });

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-slate-900"><FileText className="h-4 w-4 text-[#EA580C]" />Proposta comercial consolidada</h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">Cada linha abaixo nasce de um orçamento técnico completo. Não há lançamento manual de preço nesta proposta.</p>
        </div>
        <span className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">{formatCurrency(total)}</span>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div><h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-950"><Calculator className="h-4 w-4 text-indigo-600" />Fluxo técnico obrigatório</h4><p className="mt-1 text-[11px] text-indigo-800">Conclua materiais, tempos, terceiros e serviços do item atual. Depois, incorpore o cálculo à proposta única.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={onAddCurrentTechnicalItem} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />Incorporar cálculo atual</button><button type="button" onClick={onPrepareNextTechnicalItem} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-50"><ArrowRight className="h-4 w-4" />Calcular próximo item</button></div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-2">Item calculado no orçamento técnico</th><th className="w-28 px-3 py-2 text-center">Qtd.</th><th className="w-40 px-3 py-2 text-right">Valor consolidado</th><th className="w-12 px-2 py-2" /></tr></thead>
          <tbody>{items.length ? items.map((item, index) => <tr key={item.id} className="border-t border-slate-100"><td className="px-3 py-3"><p className="font-bold text-slate-900">{String(index + 1).padStart(2, '0')} · {item.description}</p><p className="mt-0.5 text-[10px] text-slate-400">Origem: {item.sourceTechnicalReference || 'cálculo técnico do orçamento'}</p></td><td className="px-3 py-3 text-center font-semibold text-slate-700">{item.quantity}</td><td className="px-3 py-3 text-right font-black text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</td><td className="px-2 py-3"><button type="button" onClick={() => onItemsChange(items.filter(current => current.id !== item.id))} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50" title="Remover da proposta"><Trash2 className="h-4 w-4" /></button></td></tr>) : <tr><td colSpan={4} className="px-3 py-8 text-center text-xs text-slate-400">Nenhum item técnico foi incorporado. Calcule o primeiro item e clique em “Incorporar cálculo atual”.</td></tr>}</tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Escopo da proposta<textarea value={terms.scope} onChange={e => onTermsChange({ ...terms, scope: e.target.value })} rows={7} className="resize-y rounded-xl border border-slate-200 p-3 text-xs font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-400" /></label>
        <div className="grid content-start gap-3"><label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><CalendarDays className="h-3.5 w-3.5 text-orange-600" />Validade (dias)<input type="number" min="1" value={terms.validityDays} onChange={e => onTermsChange({ ...terms, validityDays: Number(e.target.value) || 1 })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-orange-400" /></label><label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><Landmark className="h-3.5 w-3.5 text-orange-600" />Condição de pagamento<textarea value={terms.paymentTerms} onChange={e => onTermsChange({ ...terms, paymentTerms: e.target.value })} rows={2} className="resize-y rounded-lg border border-slate-200 p-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-400" /></label><label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><Truck className="h-3.5 w-3.5 text-orange-600" />Condição de frete<input value={terms.freightTerms} onChange={e => onTermsChange({ ...terms, freightTerms: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-400" /></label></div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"><div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">Acordos financeiros após aprovação</h4><p className="mt-1 text-[11px] text-emerald-800">Estas parcelas passam automaticamente para os Marcos de Faturamento quando a OS for liberada.</p></div><button type="button" onClick={() => onTermsChange({ ...terms, billingSchedule: [...terms.billingSchedule, newEvent()] })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white"><Plus className="h-3.5 w-3.5" />Parcela</button></div><div className="space-y-2">{terms.billingSchedule.map(event => <div key={event.id} className="grid grid-cols-[1fr_90px_100px_30px] items-center gap-2"><input value={event.description} onChange={e => updateEvent(event.id, { description: e.target.value })} placeholder="Ex.: Sinal na aprovação" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-400" /><input type="number" min="0" max="100" value={event.percent || ''} onChange={e => updateEvent(event.id, { percent: Number(e.target.value) || 0 })} placeholder="%" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-400" /><input type="number" min="0" value={event.dueDays || ''} onChange={e => updateEvent(event.id, { dueDays: Number(e.target.value) || 0 })} placeholder="Dias" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-400" /><button type="button" onClick={() => onTermsChange({ ...terms, billingSchedule: terms.billingSchedule.filter(current => current.id !== event.id) })} className="p-1 text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}</div></div>
    </section>
  );
}
