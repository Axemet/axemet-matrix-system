/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThirdPartyItem, StandardComponentStock } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';
import { Wrench, Plus, Trash2, HelpCircle, PackageOpen } from 'lucide-react';

interface ThirdPartyTableProps {
  items: ThirdPartyItem[];
  onUpdateItem: (id: string, updated: Partial<ThirdPartyItem>) => void;
  onAddItem: (item: { description: string; qtd: number; valUnit: number }) => void;
  onDeleteItem: (id: string) => void;
  thirdPartyTotal: number;
  standardComponents?: StandardComponentStock[];
}

export default function ThirdPartyTable({
  items,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  thirdPartyTotal,
  standardComponents = [],
}: ThirdPartyTableProps) {
  const [newDesc, setNewDesc] = React.useState('');
  const [newQtd, setNewQtd] = React.useState(1);
  const [newPrice, setNewPrice] = React.useState(0);

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    onAddItem({
      description: newDesc.trim(),
      qtd: newQtd,
      valUnit: newPrice,
    });
    setNewDesc('');
    setNewQtd(1);
    setNewPrice(0);
  };

  const handleSelectCatalogComponent = (componentId: string) => {
    const component = standardComponents.find(current => current.id === componentId);
    if (!component) return;
    setNewDesc(`${component.name}${component.code ? ` (${component.code})` : ''}`);
    setNewPrice(component.price || 0);
    setNewQtd(1);
  };

  return (
    <div className="space-y-4">
      
      {/* Header and Running Total */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            Componentes e Serviços Terceirizados
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Total Terceiros:
          </span>
          <span className="text-sm font-black font-mono text-indigo-800">
            {formatCurrency(thirdPartyTotal)}
          </span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Compact Table of Items (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100">
            <PackageOpen className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Lista de Componentes / Acessórios Adicionados
            </h3>
          </div>

          {/* Mobile view of components */}
          <div className="block md:hidden space-y-3">
            {items.length === 0 ? (
              <div className="py-8 text-center text-gray-400 italic bg-slate-50 rounded-lg border border-dashed border-gray-200">
                Nenhum componente adicionado. Utilize o painel ao lado para cadastrar.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-slate-50/50 rounded-xl p-3.5 border border-gray-150 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                    <span className="font-bold text-gray-900 text-xs truncate max-w-[200px]">
                      {item.description}
                    </span>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Remover item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Quantity field */}
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Qtd</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.qtd}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          onUpdateItem(item.id, { qtd: val, total: val * item.valUnit });
                        }}
                        className="w-full py-1 px-2 border border-gray-200 rounded-lg font-mono font-bold text-center text-xs bg-white text-indigo-700"
                      />
                    </div>

                    {/* Preço Unitário field */}
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Preço Unitário</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 text-[9px]">R$</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.valUnit || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            onUpdateItem(item.id, { valUnit: val, total: item.qtd * val });
                          }}
                          placeholder="0,00"
                          className="w-full pl-7 pr-2 py-1 border border-gray-200 rounded-lg font-mono text-right text-gray-950 font-bold text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-150 bg-slate-100/30 -mx-3.5 -mb-3.5 px-3.5 py-1.5 rounded-b-xl">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase">Subtotal:</span>
                    <span className="font-mono font-black text-xs text-gray-950">{formatCurrency(item.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop/Tablet view of components */}
          <div className="hidden md:block overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-150 rounded-lg">
                <table className="min-w-full divide-y divide-gray-150 text-left">
                  <thead className="bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Descrição</th>
                      <th className="py-2.5 px-2 w-16 text-center">Qtd</th>
                      <th className="py-2.5 px-3 w-32 text-right">Preço Unitário</th>
                      <th className="py-2.5 px-3 w-32 text-right">Total</th>
                      <th className="py-2.5 px-2 w-10 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-900 bg-white">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                          Nenhum componente adicionado. Utilize o painel ao lado para cadastrar.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-gray-50/50 transition ${item.qtd === 0 ? 'opacity-50 hover:opacity-100' : ''}`}
                        >
                          {/* Description */}
                          <td className="py-2.5 px-3 font-semibold text-gray-800">
                            {item.description}
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.qtd}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                onUpdateItem(item.id, { qtd: val, total: val * item.valUnit });
                              }}
                              className={`w-12 py-0.5 px-1 border text-center rounded-md font-mono font-bold text-xs ${
                                item.qtd > 0 ? 'bg-indigo-50/30 text-indigo-700 border-indigo-200' : 'bg-white border-gray-200 text-gray-500'
                              }`}
                            />
                          </td>

                          {/* Unit Value */}
                          <td className="py-2 px-3">
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 text-[9px]">R$</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={item.valUnit || ''}
                                onChange={(e) => {
                                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                                  onUpdateItem(item.id, { valUnit: val, total: item.qtd * val });
                                }}
                                placeholder="0,00"
                                className="w-full pl-6 pr-1 py-0.5 border border-gray-200 rounded-md font-mono text-right text-gray-950 font-semibold text-xs"
                              />
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-gray-950 text-xs whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </td>

                          {/* Delete action */}
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Add Item Form & Guidance (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Add custom item form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-2xs p-5">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-100 mb-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              Novo Componente / Serviço
            </h3>

            <form onSubmit={handleAddNew} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Puxar do catálogo de componentes
                </label>
                <select
                  value=""
                  onChange={(e) => handleSelectCatalogComponent(e.target.value)}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs text-gray-800 bg-indigo-50/40"
                >
                  <option value="">Selecione para preencher descrição e preço</option>
                  {standardComponents.map(component => (
                    <option key={component.id} value={component.id} disabled={component.stock <= 0}>
                      {component.catalog} · {component.code} — {component.name}{component.stock <= 0 ? ' (sem estoque)' : ''}
                    </option>
                  ))}
                </select>
                {standardComponents.length === 0 && <p className="mt-1 text-[10px] text-amber-700">Cadastre componentes em Parâmetros para utilizar o preenchimento automático.</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Descrição do Componente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Buchas de Bronze Auto-lub"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 text-center">
                    Qtd
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newQtd}
                    onChange={(e) => setNewQtd(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-center text-gray-950 bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Preço Unit (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-[10px]">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={newPrice || ''}
                      onChange={(e) => setNewPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 bg-white font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar ao Orçamento
              </button>
            </form>
          </div>

          {/* Info Tips */}
          <div className="bg-slate-50 border border-gray-150 p-4 rounded-xl flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div className="text-[10px] text-gray-500 space-y-1.5">
              <p className="font-bold text-gray-700">Multiplicador Comercial:</p>
              <p>
                Os itens desta tabela representam o custo bruto de componentes comprados ou terceirizados. 
              </p>
              <p>
                Esses valores serão somados aos materiais e submetidos ao <strong>multiplicador comercial (1,5)</strong> para formar o custo de venda inicial, antes da incidência final de impostos e comissões.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
