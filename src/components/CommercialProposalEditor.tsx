import React from 'react';
import { Plus, Trash2, FileText, Landmark, Truck, CalendarDays } from 'lucide-react';
import { CommercialTerms, ProposalItem } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';

interface Props {
  items: ProposalItem[];
  terms: CommercialTerms;
  onItemsChange: (items: ProposalItem[]) => void;
  onTermsChange: (terms: CommercialTerms) => void;
}

const newItem = (): ProposalItem => ({ id: `proposal_item_${Date.now()}`, description: '', quantity: 1, unitPrice: 0 });
const newEvent = () => ({ id: `billing_event_${Date.now()}`, description: 'Parcela comercial', percent: 0, dueDays: 0 });

export default function CommercialProposalEditor({ items, terms, onItemsChange, onTermsChange }: Props) {
  const normalizedItems = items.length ? items : [newItem()];
  const total = normalizedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const updateItem = (id: string, patch: Partial<ProposalItem>) => onItemsChange(normalizedItems.map(item => item.id === id ? { ...item, ...patch } : item));
  const updateEvent = (id: string, patch: Partial<CommercialTerms['billingSchedule'][number]>) => onTermsChange({ ...terms, billingSchedule: terms.billingSchedule.map(event => event.id === id ? { ...event, ...patch } : event) });

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-slate-900"><FileText className="h-4 w-4 text-[#EA580C]" />Proposta comercial ao cliente</h3>
          <p className="mt-1 text-xs text-slate-500">Edite o escopo, os itens e as condições que irão para o PDF e para o Financeiro quando houver aprovação.</p>
        </div>
        <span className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">{formatCurrency(total)}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-2">Descrição do item</th><th className="w-24 px-3 py-2">Qtd.</th><th className="w-36 px-3 py-2">Valor unit.</th><th className="w-36 px-3 py-2 text-right">Subtotal</th><th className="w-12 px-2 py-2" /></tr></thead>
          <tbody>{normalizedItems.map(item => <tr key={item.id} className="border-t border-slate-100">
            <td className="p-2"><input value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })} placeholder="Ex.: Molde de injeção – 2 cavidades" className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-slate-900 outline-none focus:border-orange-400" /></td>
            <td className="p-2"><input type="number" min="1" value={item.quantity || ''} onChange={e => updateItem(item.id, { quantity: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-slate-900 outline-none focus:border-orange-400" /></td>
            <td className="p-2"><input type="number" min="0" step="0.01" value={item.unitPrice || ''} onChange={e => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-slate-900 outline-none focus:border-orange-400" /></td>
            <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(item.quantity * item.unitPrice)}</td>
            <td className="p-2"><button type="button" onClick={() => onItemsChange(normalizedItems.filter(current => current.id !== item.id))} disabled={normalizedItems.length === 1} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></td>
          </tr>)}</tbody>
        </table>
        <button type="button" onClick={() => onItemsChange([...normalizedItems, newItem()])} className="m-2 inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100"><Plus className="h-4 w-4" />Adicionar item à proposta</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Escopo da proposta<textarea value={terms.scope} onChange={e => onTermsChange({ ...terms, scope: e.target.value })} rows={7} className="resize-y rounded-xl border border-slate-200 p-3 text-xs font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-400" /></label>
        <div className="grid content-start gap-3">
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><CalendarDays className="h-3.5 w-3.5 text-orange-600" />Validade (dias)<input type="number" min="1" value={terms.validityDays} onChange={e => onTermsChange({ ...terms, validityDays: Number(e.target.value) || 1 })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-orange-400" /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><Landmark className="h-3.5 w-3.5 text-orange-600" />Condição de pagamento<textarea value={terms.paymentTerms} onChange={e => onTermsChange({ ...terms, paymentTerms: e.target.value })} rows={2} className="resize-y rounded-lg border border-slate-200 p-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-400" /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><Truck className="h-3.5 w-3.5 text-orange-600" />Condição de frete<input value={terms.freightTerms} onChange={e => onTermsChange({ ...terms, freightTerms: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-400" /></label>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">Acordos financeiros após aprovação</h4><p className="mt-1 text-[11px] text-emerald-800">Estas parcelas passam automaticamente para os Marcos de Faturamento quando a OS for liberada.</p></div><button type="button" onClick={() => onTermsChange({ ...terms, billingSchedule: [...terms.billingSchedule, newEvent()] })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white"><Plus className="h-3.5 w-3.5" />Parcela</button></div>
        <div className="space-y-2">{terms.billingSchedule.map(event => <div key={event.id} className="grid grid-cols-[1fr_90px_100px_30px] items-center gap-2"><input value={event.description} onChange={e => updateEvent(event.id, { description: e.target.value })} placeholder="Ex.: Sinal na aprovação" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-400" /><input type="number" min="0" max="100" value={event.percent || ''} onChange={e => updateEvent(event.id, { percent: Number(e.target.value) || 0 })} placeholder="%" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-400" /><input type="number" min="0" value={event.dueDays || ''} onChange={e => updateEvent(event.id, { dueDays: Number(e.target.value) || 0 })} placeholder="Dias" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-400" /><button type="button" onClick={() => onTermsChange({ ...terms, billingSchedule: terms.billingSchedule.filter(current => current.id !== event.id) })} className="p-1 text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}</div>
      </div>
    </section>
  );
}
