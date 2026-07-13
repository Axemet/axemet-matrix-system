/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BudgetDraft } from '../types';
import { formatCurrency, formatNumber } from '../utils/pdfGenerator';
import { getMarginPercent } from '../utils/calculations';
import { Percent, TrendingUp, Calculator, HelpCircle, Save, FileDown } from 'lucide-react';

interface QuoteSummaryProps {
  totals: BudgetDraft['totals'];
  config: BudgetDraft['config'];
  onSaveDraft: () => void;
  onExportPDF: () => void;
  discountPercent?: number;
  onDiscountPercentChange?: (val: number) => void;
  discountValue?: number;
  onDiscountValueChange?: (val: number) => void;
  proposalTotal?: number;
  hasCompleteTechnicalMemory?: boolean;
}

export default function QuoteSummary({ 
  totals, 
  config, 
  onSaveDraft,
  onExportPDF,
  discountPercent = 0,
  onDiscountPercentChange,
  discountValue = 0,
  onDiscountValueChange,
  proposalTotal,
  hasCompleteTechnicalMemory = true,
}: QuoteSummaryProps) {
  const displayTotal = proposalTotal && proposalTotal > 0 ? proposalTotal : totals.finalPrice;
  const hasConsolidatedProposal = !!proposalTotal && proposalTotal > 0;
  const commissionAmount = displayTotal * (config.commission / 100);
  const taxAmount = displayTotal * (config.tax / 100);
  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
      
      {/* Top Accent Strip */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            Resumo e Fechamento Comercial
          </h2>
        </div>

        {/* Totals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Cost Accumulations */}
          <div className="lg:col-span-7 space-y-3.5 text-xs">
            
            {/* Materiais e Insumos */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50 text-gray-600">
              <span className="font-medium">Total de Materiais/Chapas:</span>
              <span className="font-mono font-bold text-gray-900 text-sm">
                {formatCurrency(totals.materialsTotal)}
              </span>
            </div>

            {/* Terceiros */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50 text-gray-600">
              <span className="font-medium">Total de Terceiros/Comprados:</span>
              <span className="font-mono font-bold text-gray-900 text-sm">
                {formatCurrency(totals.thirdPartyTotal)}
              </span>
            </div>

            {/* Serviços internos */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50 text-gray-600">
              <span className="font-medium">Serviços Internos da Oficina:</span>
              <span className="font-mono font-bold text-gray-900 text-sm">
                {formatCurrency(totals.internalTotal)}
              </span>
            </div>

            {/* Custo Base */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50 bg-gray-50/50 px-2 rounded-md font-semibold text-gray-700">
              <span>Custo Base Direto (Materiais + Componentes + Serviços):</span>
              <span className="font-mono text-gray-950 text-sm">
                {formatCurrency(totals.baseCost)}
              </span>
            </div>

            {/* Fator 1: Multiplicador Técnico */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50 text-gray-600 px-2">
              <span className="font-medium flex flex-col gap-0.5">
                <span className="flex items-center gap-1">
                  Fator 1: Multiplicador Técnico (Molde):
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full font-mono">
                    x{formatNumber(config.multiplier, 2)}
                  </span>
                </span>
                <span className="text-[10.5px] text-gray-400">
                  (Aplicado sobre Materiais e Terceiros + Serviços Internos sem multiplicador)
                </span>
              </span>
              <span className="font-mono font-bold text-indigo-700 text-sm">
                {formatCurrency(totals.costWithMultiplier)}
              </span>
            </div>

            {/* Fator 2: Markup Comercial */}
            {(() => {
              const margem = getMarginPercent(config);
              const comPercent = config.commission;
              const taxPercent = config.tax;
              const totalPercent = margem + comPercent + taxPercent;

              let markupFactor = 1;
              if (totalPercent < 100) {
                markupFactor = 1 / (1 - (totalPercent / 100));
              } else {
                markupFactor = 1 + (totalPercent / 100);
              }

              return (
                <div className="flex items-center justify-between py-2 border-b border-gray-50 text-gray-600 px-2 bg-amber-50/10 rounded-md">
                  <span className="font-medium flex flex-col gap-0.5">
                    <span className="flex items-center gap-1">
                      Fator 2: Markup Divisor Final (B16):
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full font-mono">
                        x{formatNumber(markupFactor, 2)}
                      </span>
                    </span>
                    <span className="text-[10.5px] text-gray-400">
                      (Base: 100% - Margem {formatNumber(margem, 1)}% - Comis. {formatNumber(comPercent, 1)}% - Imp. {formatNumber(taxPercent, 1)}%)
                    </span>
                  </span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    x{formatNumber(markupFactor, 2)}
                  </span>
                </div>
              );
            })()}

            {/* Custo total do orçamento */}
            <div className="flex items-center justify-between py-2.5 px-2 bg-indigo-600 text-white rounded-lg font-bold shadow-xs">
              <span>{hasConsolidatedProposal ? 'Valor consolidado da proposta:' : 'Preço de Venda Final de Tabela:'}</span>
              <span className="font-mono text-white text-base">
                {formatCurrency(displayTotal)}
              </span>
            </div>

          </div>

          {/* Pricing Division and Final Selling Price */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Taxes and commission */}
            <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
              <span className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
                Comissões e Impostos (Incidência no Divisor)
              </span>

              <div className="flex justify-between text-gray-600">
                <span>Comissão ({formatNumber(config.commission, 1)}%):</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatCurrency(commissionAmount)}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Impostos ({formatNumber(config.tax, 1)}%):</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatCurrency(taxAmount)}
                </span>
              </div>

              <div className="flex justify-between border-t border-gray-200/60 pt-2 text-gray-600 flex-wrap gap-2">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  Markup Efetivo:
                </span>
                <span className="font-mono font-black text-indigo-700">
                  {hasCompleteTechnicalMemory ? `${formatNumber(totals.effectiveMarkup, 4)}x` : 'Recalcule os itens'}
                </span>
              </div>
            </div>

            {/* Negotiation Field Block */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60 space-y-3 text-xs">
              <span className="block font-bold text-indigo-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                Negociação & Desconto
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-sans">
                    Desconto (%)
                  </label>
                  <div className="relative rounded-md shadow-2xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={discountPercent ? parseFloat(discountPercent.toFixed(2)) : ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (onDiscountPercentChange) onDiscountPercentChange(val);
                      }}
                      className="w-full pl-2 pr-6 py-1.5 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-950 focus:ring-1 focus:ring-indigo-500 bg-white"
                      placeholder="0.0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-400 font-mono text-[10px]">
                      %
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 font-sans">
                    Desconto (R$)
                  </label>
                  <div className="relative rounded-md shadow-2xs">
                    <input
                      type="number"
                      min="0"
                      max={displayTotal}
                      step="1"
                      value={discountValue ? parseFloat(discountValue.toFixed(2)) : ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (onDiscountValueChange) onDiscountValueChange(val);
                      }}
                      className="w-full pl-2 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-950 focus:ring-1 focus:ring-indigo-500 bg-white"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Display Final Selling Price Box */}
            <div className={`text-white p-5 rounded-2xl flex flex-col justify-center items-center text-center shadow-lg border transition-all duration-300 ${
              discountValue > 0 
                ? 'bg-gradient-to-br from-indigo-950 to-gray-900 border-indigo-500/30' 
                : 'bg-gray-900 border-gray-850'
            }`}>
              {discountValue > 0 ? (
                <>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 font-mono">
                    Tabela: {formatCurrency(displayTotal)}
                  </span>
                  <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-wide mb-2.5">
                    Desconto: -{formatCurrency(discountValue)} ({formatNumber(discountPercent, 1)}%)
                  </span>
                  
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
                    {hasConsolidatedProposal ? 'Total negociado da proposta' : 'Preço Final Negociado'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400 mb-2">
                    {formatCurrency(displayTotal - discountValue)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    {hasConsolidatedProposal ? 'Total da proposta' : 'Preço de Venda Sugerido'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mb-2">
                    {formatCurrency(displayTotal)}
                  </span>
                </>
              )}
              <span className="text-[10px] text-gray-400 leading-normal max-w-[240px]">
                Preço final calculado pelo método de divisor por dentro ({formatNumber((1 - (config.commission + config.tax)/100) * 100, 0)}% custo base).
              </span>
            </div>

            {/* Save budget big button relocated here */}
            <button
              type="button"
              onClick={onSaveDraft}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              Salvar Orçamento no Histórico
            </button>

            {/* PDF export button positioned right below */}
            <button
              type="button"
              onClick={onExportPDF}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              <FileDown className="w-4 h-4" />
              Gerar proposta para o cliente (PDF)
            </button>

          </div>

        </div>

         {/* Formula Details */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
          <HelpCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div className="text-[10px] text-gray-500 space-y-1">
            <p className="font-bold text-gray-700">Memória de Cálculo de Fechamento:</p>
            <p>
              1. <strong>Custo Técnico</strong> = <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">[ (Materiais + Terceiros) × Multiplicador ] + Serviços Internos</code>.
            </p>
            <p>
              2. <strong>Preço Final de Venda</strong> = <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">Custo Total Multiplicado ÷ (1 - {config.commission/100} - {config.tax/100})</code>.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
