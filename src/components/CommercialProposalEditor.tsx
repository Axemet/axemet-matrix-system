import React from 'react';
import { Check, FileText, Landmark, Pencil, Plus, Trash2, Truck, CalendarDays, Calculator, ArrowRight } from 'lucide-react';
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

const createBillingEvent = () => ({ id: `billing_event_${Date.now()}`, description: 'Parcela comercial', percent: 0, dueDays: 0 });

export default function CommercialProposalEditor({ items, terms, onItemsChange, onTermsChange, onAddCurrentTechnicalItem, onPrepareNextTechnicalItem }: Props) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  const updateItem = (id: string, patch: Partial<ProposalItem>) => {
    onItemsChange(items.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const updateEvent = (id: string, patch: Partial<CommercialTerms['billingSchedule'][number]>) => {
    onTermsChange({ ...terms, billingSchedule: terms.billingSchedule.map(event => event.id === id ? { ...event, ...patch } : event) });
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-900"><FileText className="h-4 w-4 text-[#EA580C]" />Proposta comercial consolidada</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Cada linha nasce de um orçamento técnico completo. Os dados de apresentação podem ser revisados sem alterar a memória de cálculo.</p>
        </div>
        <span className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm font-black text-white">{formatCurrency(total)}</span>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div><h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-950"><Calculator className="h-4 w-4 text-indigo-600" />Fluxo técnico obrigatório</h4><p className="mt-1 text-xs text-indigo-800">Finalize o cálculo técnico do item atual e incorpore-o à proposta. Depois, use “Calcular próximo item” para manter a mesma proposta.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={onAddCurrentTechnicalItem} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />Incorporar cálculo atual</button><button type="button" onClick={onPrepareNextTechnicalItem} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-50"><ArrowRight className="h-4 w-4" />Calcular próximo item</button></div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="hidden grid-cols-[minmax(0,1fr)_90px_150px_84px] bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 md:grid"><span>Item técnico consolidado</span><span className="text-center">Qtd.</span><span className="text-right">Valor consolidado</span><span /></div>
        {items.length === 0 && <div className="px-4 py-10 text-center text-sm text-slate-400">Nenhum item técnico foi incorporado. Calcule o primeiro item e clique em “Incorporar cálculo atual”.</div>}
        {items.map((item, index) => {
          const isEditing = editingId === item.id;
          return <div key={item.id} className="border-t border-slate-100 first:border-t-0">
            <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_90px_150px_84px] md:items-center">
              <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Item {String(index + 1).padStart(2, '0')}</p><p className="truncate text-sm font-bold text-slate-900">{item.title || item.description}</p><p className="mt-0.5 text-xs text-slate-500">{item.description} · Ref. {item.sourceTechnicalReference || 'cálculo técnico'}</p></div>
              <div className="text-center"><span className="text-sm font-bold text-slate-800">{item.quantity}</span><span className="ml-1 text-[10px] font-medium uppercase text-slate-400">conj.</span></div>
              <div className="text-right text-sm font-black text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}<span className="mt-0.5 block text-[10px] font-medium text-slate-400">valor técnico</span></div>
              <div className="flex justify-end gap-1"><button type="button" onClick={() => setEditingId(isEditing ? null : item.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50" title="Editar item"><Pencil className="h-3.5 w-3.5" />{isEditing ? 'Fechar' : 'Editar'}</button><button type="button" onClick={() => onItemsChange(items.filter(current => current.id !== item.id))} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" title="Remover da proposta"><Trash2 className="h-4 w-4" /></button></div>
            </div>
            {isEditing && <div className="grid gap-3 border-t border-indigo-100 bg-indigo-50/40 px-4 py-4 md:grid-cols-[1.2fr_1fr_120px_auto] md:items-end"><label className="grid gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">Título do ferramental<input value={item.title || ''} onChange={event => updateItem(item.id, { title: event.target.value })} placeholder="Ex.: Conjunto Delta Frio" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-indigo-400" /></label><label className="grid gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">Tipo de molde<input value={item.description} onChange={event => updateItem(item.id, { description: event.target.value })} placeholder="Ex.: Molde de injeção" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-indigo-400" /></label><label className="grid gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">Quantidade de conjuntos<input type="number" min="1" value={item.quantity} onChange={event => updateItem(item.id, { quantity: Math.max(1, Number(event.target.value) || 1) })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-center text-sm font-bold text-slate-800 outline-none focus:border-indigo-400" /></label><button type="button" onClick={() => setEditingId(null)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700"><Check className="h-3.5 w-3.5" />Concluir</button><p className="md:col-span-4 text-[11px] text-indigo-800">A edição altera somente a apresentação comercial e a quantidade de conjuntos. O valor unitário continua ligado ao cálculo técnico original.</p></div>}
          </div>;
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Escopo da proposta<textarea value={terms.scope} onChange={event => onTermsChange({ ...terms, scope: event.target.value })} rows={7} className="resize-y rounded-xl border border-slate-200 p-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-400" /></label>
        <div className="grid content-start gap-3"><label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><CalendarDays className="h-3.5 w-3.5 text-orange-600" />Validade (dias)<input type="number" min="1" value={terms.validityDays} onChange={event => onTermsChange({ ...terms, validityDays: Number(event.target.value) || 1 })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400" /></label><label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><Landmark className="h-3.5 w-3.5 text-orange-600" />Condição de pagamento<textarea value={terms.paymentTerms} onChange={event => onTermsChange({ ...terms, paymentTerms: event.target.value })} rows={2} className="resize-y rounded-lg border border-slate-200 p-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-400" /></label><label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500"><Truck className="h-3.5 w-3.5 text-orange-600" />Condição de frete<input value={terms.freightTerms} onChange={event => onTermsChange({ ...terms, freightTerms: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400" /></label></div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"><div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">Acordos financeiros após aprovação</h4><p className="mt-1 text-[11px] text-emerald-800">Estas parcelas passam automaticamente para os Marcos de Faturamento quando a OS for liberada.</p></div><button type="button" onClick={() => onTermsChange({ ...terms, billingSchedule: [...terms.billingSchedule, createBillingEvent()] })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white"><Plus className="h-3.5 w-3.5" />Parcela</button></div><div className="space-y-2">{terms.billingSchedule.map(event => <div key={event.id} className="grid grid-cols-[1fr_90px_100px_30px] items-center gap-2"><input value={event.description} onChange={input => updateEvent(event.id, { description: input.target.value })} placeholder="Ex.: Sinal na aprovação" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400" /><input type="number" min="0" max="100" value={event.percent || ''} onChange={input => updateEvent(event.id, { percent: Number(input.target.value) || 0 })} placeholder="%" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400" /><input type="number" min="0" value={event.dueDays || ''} onChange={input => updateEvent(event.id, { dueDays: Number(input.target.value) || 0 })} placeholder="Dias" className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400" /><button type="button" onClick={() => onTermsChange({ ...terms, billingSchedule: terms.billingSchedule.filter(current => current.id !== event.id) })} className="p-1 text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}</div></div>
    </section>
  );
}
