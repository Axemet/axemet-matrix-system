/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MaterialItem, RawMaterial } from '../types';
import { formatCurrency, formatNumber } from '../utils/pdfGenerator';
import { Layers, ShieldCheck, HelpCircle, Plus, Trash2, X } from 'lucide-react';

interface MaterialsTableProps {
  materials: MaterialItem[];
  onUpdateMaterial: (id: string, updated: Partial<MaterialItem>) => void;
  onAddMaterial: (item: MaterialItem) => void;
  onDeleteMaterial: (id: string) => void;
  materialsTotal: number;
  moldWidth: number;
  onMoldWidthChange: (val: number) => void;
  moldLength: number;
  onMoldLengthChange: (val: number) => void;
  rawMaterials: RawMaterial[];
}

export default function MaterialsTable({
  materials,
  onUpdateMaterial,
  onAddMaterial,
  onDeleteMaterial,
  materialsTotal,
  moldWidth,
  onMoldWidthChange,
  moldLength,
  onMoldLengthChange,
  rawMaterials,
}: MaterialsTableProps) {
  // Form State for Adding Custom Items
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newPlateName, setNewPlateName] = React.useState('');
  const [newPlateQtd, setNewPlateQtd] = React.useState(1);
  const [newPlateComp, setNewPlateComp] = React.useState(0);
  const [newPlateLarg, setNewPlateLarg] = React.useState(0);
  const [newPlateEsp, setNewPlateEsp] = React.useState(0);
  const [newPlateMaterial, setNewPlateMaterial] = React.useState('');

  // Auto select first material when list loads
  React.useEffect(() => {
    if (rawMaterials.length > 0 && !newPlateMaterial) {
      setNewPlateMaterial(rawMaterials[0].name);
    }
  }, [rawMaterials, newPlateMaterial]);

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlateName.trim()) return;

    const foundMat = rawMaterials.find(rm => rm.name === newPlateMaterial);
    const valKg = foundMat ? foundMat.pricePerKg : 0;
    const dens = foundMat ? foundMat.density : 7.85;

    // Estimate initial cost
    const total = (newPlateComp * newPlateLarg * newPlateEsp * newPlateQtd * dens * valKg) / 1000000;

    onAddMaterial({
      id: `custom_${Date.now()}`,
      name: newPlateName,
      isAuto: false,
      qtd: newPlateQtd,
      comp: newPlateComp,
      larg: newPlateLarg,
      esp: newPlateEsp,
      material: newPlateMaterial,
      valKg,
      dens,
      total,
      formulaDescription: 'Item Manual Personalizado'
    });

    // Reset Form
    setNewPlateName('');
    setNewPlateQtd(1);
    setNewPlateComp(0);
    setNewPlateLarg(0);
    setNewPlateEsp(0);
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-5 overflow-hidden">
      
      {/* Title & Total Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            Chapas e Materiais do Molde
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Total Materiais:
          </span>
          <span className="text-sm font-black font-mono text-indigo-800">
            {formatCurrency(materialsTotal)}
          </span>
        </div>
      </div>

      {/* Mold Dimensions input relocated here */}
      <div className="bg-slate-50/75 rounded-xl border border-gray-150 p-4">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
          Dimensionamento Geral do Molde (W x L)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mold Width */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Largura do Molde (W) <span className="text-indigo-600 font-mono font-bold">mm</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={moldWidth || ''}
                onChange={(e) => onMoldWidthChange(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ex: 250"
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-950 font-mono font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 text-[10px] font-mono">
                Largura
              </span>
            </div>
            <span className="text-[9px] text-gray-400 mt-0.5 block">
              Deriva automaticamente a largura de PBI/PBS, PS e CH EXT (+5mm ou folga).
            </span>
          </div>

          {/* Mold Length */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Comprimento do Molde (L) <span className="text-indigo-600 font-mono font-bold">mm</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={moldLength || ''}
                onChange={(e) => onMoldLengthChange(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ex: 250"
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-950 font-mono font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 text-[10px] font-mono">
                Comprimento
              </span>
            </div>
            <span className="text-[9px] text-gray-400 mt-0.5 block">
              Deriva o comprimento de todas as chapas automáticas (+5mm ou orelha).
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Card-based View of Materials */}
      <div className="block md:hidden space-y-4">
        {materials.map((m) => {
          const weight = (m.comp * m.larg * m.esp * m.qtd * m.dens) / 1000000;
          return (
            <div key={m.id} className="bg-slate-50/50 rounded-xl p-4 border border-gray-150 space-y-3 shadow-2xs">
              {/* Title block with delete */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div>
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5 uppercase font-heading tracking-tight">
                    {m.name}
                    {m.isAuto && (
                      <span title={`Cálculo Automático: ${m.formulaDescription}`}>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </span>
                    )}
                  </span>
                  {m.formulaDescription && (
                    <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">
                      {m.formulaDescription}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteMaterial(m.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  title={`Excluir ${m.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quantity and Material dropdown */}
              <div className="grid grid-cols-2 gap-3">
                {/* Qtd */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={m.qtd}
                    onChange={(e) => onUpdateMaterial(m.id, { qtd: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full py-1.5 px-2.5 border border-gray-200 rounded-lg text-center font-mono font-bold text-xs bg-white text-indigo-700"
                  />
                </div>

                {/* Material */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Material do Aço</label>
                  <select
                    value={m.material}
                    onChange={(e) => {
                      const matName = e.target.value;
                      const foundMat = rawMaterials.find(rm => rm.name === matName);
                      if (foundMat) {
                        onUpdateMaterial(m.id, { 
                          material: matName,
                          valKg: foundMat.pricePerKg,
                          dens: foundMat.density
                        });
                      } else {
                        onUpdateMaterial(m.id, { material: matName });
                      }
                    }}
                    className="w-full py-1.5 px-2 border border-gray-200 rounded-lg font-bold text-gray-800 bg-white text-xs cursor-pointer focus:ring-1 focus:ring-indigo-500"
                  >
                    {rawMaterials.map((rm) => (
                      <option key={rm.id} value={rm.name}>
                        {rm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* L, W, T dimensions */}
              <div className="grid grid-cols-3 gap-2 bg-white/70 p-2.5 rounded-lg border border-gray-150">
                {/* Comp (L) */}
                <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Comp. (L) mm</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={m.isAuto && m.id !== 'p1' && m.id !== 'p2'}
                    value={m.comp || ''}
                    onChange={(e) => onUpdateMaterial(m.id, { comp: Math.max(0, parseInt(e.target.value) || 0) })}
                    className={`w-full py-1 px-1 border text-center rounded-lg font-mono text-xs ${
                      m.isAuto && m.id !== 'p1' && m.id !== 'p2'
                        ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed font-medium'
                        : 'bg-white border-gray-200 text-gray-950 font-semibold'
                    }`}
                  />
                </div>

                {/* Larg (W) */}
                <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Larg. (W) mm</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={m.isAuto && m.id !== 'p1' && m.id !== 'p2'}
                    value={m.larg || ''}
                    onChange={(e) => onUpdateMaterial(m.id, { larg: Math.max(0, parseInt(e.target.value) || 0) })}
                    className={`w-full py-1 px-1 border text-center rounded-lg font-mono text-xs ${
                      m.isAuto && m.id !== 'p1' && m.id !== 'p2'
                        ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed font-medium'
                        : 'bg-white border-gray-200 text-gray-950 font-semibold'
                    }`}
                  />
                </div>

                {/* Esp (T) */}
                <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Esp. (T) mm</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={m.esp || ''}
                    onChange={(e) => onUpdateMaterial(m.id, { esp: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full py-1 px-1 border border-gray-200 text-center rounded-lg font-mono font-semibold text-gray-950 bg-white text-xs"
                  />
                </div>
              </div>

              {/* Calculated metrics in footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-150 text-xs font-sans">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Peso:</span>
                  <span className="font-mono font-bold text-gray-600">{formatNumber(weight, 2)} kg</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Total:</span>
                  <span className="font-mono font-black text-[#EA580C]">{formatCurrency(m.total)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Table Container */}
      <div className="hidden md:block overflow-x-auto -mx-6">
        <div className="inline-block min-w-full align-middle px-6">
          <div className="overflow-hidden border border-gray-100 rounded-lg">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-2 w-14 text-center">Qtd</th>
                  <th className="py-3 px-2 text-center">Comp (L)</th>
                  <th className="py-3 px-2 text-center">Larg (W)</th>
                  <th className="py-3 px-2 text-center">Esp (T)</th>
                  <th className="py-3 px-2">Material</th>
                  <th className="py-3 px-2 text-right">Peso (kg)</th>
                  <th className="py-3 px-3 text-right">Total (R$)</th>
                  <th className="py-3 px-2 w-12 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-900 bg-white">
                {materials.map((m) => {
                  const weight = (m.comp * m.larg * m.esp * m.qtd * m.dens) / 1000000;
                  
                  return (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-gray-50/50 transition ${m.qtd === 0 ? 'opacity-50 hover:opacity-100' : ''}`}
                    >
                      {/* Name & Formula Description */}
                      <td className="py-3.5 px-3 min-w-[130px]">
                        <div className="font-bold text-gray-900 flex items-center gap-1">
                          {m.name}
                          {m.isAuto && (
                            <span 
                              className="inline-flex" 
                              title={`Cálculo Automático: ${m.formulaDescription}`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          )}
                        </div>
                        {m.formulaDescription && (
                          <span className="text-[9px] text-gray-400 block mt-0.5 font-mono line-clamp-1" title={m.formulaDescription}>
                            {m.formulaDescription}
                          </span>
                        )}
                      </td>

                      {/* Qtd */}
                      <td className="py-3 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={m.qtd}
                          onChange={(e) => onUpdateMaterial(m.id, { qtd: Math.max(0, parseInt(e.target.value) || 0) })}
                          className={`w-12 py-1 px-1.5 border text-center rounded-md font-mono font-bold ${
                            m.qtd > 0 ? 'bg-indigo-50/30 text-indigo-700 border-indigo-200' : 'bg-white border-gray-200 text-gray-500'
                          }`}
                        />
                      </td>

                      {/* Comp (L) */}
                      <td className="py-3 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          disabled={m.isAuto && m.id !== 'p1' && m.id !== 'p2'}
                          value={m.comp || ''}
                          onChange={(e) => onUpdateMaterial(m.id, { comp: Math.max(0, parseInt(e.target.value) || 0) })}
                          className={`w-14 py-1 px-1 border text-center rounded-md font-mono ${
                            m.isAuto && m.id !== 'p1' && m.id !== 'p2'
                              ? 'bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed font-medium'
                              : 'bg-white border-gray-200 text-gray-950 font-semibold'
                          }`}
                        />
                      </td>

                      {/* Larg (W) */}
                      <td className="py-3 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          disabled={m.isAuto && m.id !== 'p1' && m.id !== 'p2'}
                          value={m.larg || ''}
                          onChange={(e) => onUpdateMaterial(m.id, { larg: Math.max(0, parseInt(e.target.value) || 0) })}
                          className={`w-14 py-1 px-1 border text-center rounded-md font-mono ${
                            m.isAuto && m.id !== 'p1' && m.id !== 'p2'
                              ? 'bg-gray-100 border-gray-100 text-gray-500 cursor-not-allowed font-medium'
                              : 'bg-white border-gray-200 text-gray-950 font-semibold'
                          }`}
                        />
                      </td>

                      {/* Esp (T) */}
                      <td className="py-3 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={m.esp || ''}
                          onChange={(e) => onUpdateMaterial(m.id, { esp: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-14 py-1 px-1 border border-gray-200 text-center rounded-md font-mono font-semibold text-gray-950 bg-white"
                        />
                      </td>

                      {/* Material Type (Dynamic Select) */}
                      <td className="py-3 px-1">
                        <select
                          value={m.material}
                          onChange={(e) => {
                            const matName = e.target.value;
                            const foundMat = rawMaterials.find(rm => rm.name === matName);
                            if (foundMat) {
                              onUpdateMaterial(m.id, { 
                                material: matName,
                                valKg: foundMat.pricePerKg,
                                dens: foundMat.density
                              });
                            } else {
                              onUpdateMaterial(m.id, { material: matName });
                            }
                          }}
                          className="py-1 px-1.5 border border-gray-200 rounded-md font-medium text-gray-850 bg-white text-xs cursor-pointer focus:ring-1 focus:ring-indigo-500"
                        >
                          {rawMaterials.map((rm) => (
                            <option key={rm.id} value={rm.name}>
                              {rm.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Weight (kg) */}
                      <td className="py-3 px-2 text-right font-mono font-semibold text-gray-500 whitespace-nowrap">
                        {formatNumber(weight, 2)} kg
                      </td>

                      {/* Total Cost (R$) */}
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-gray-950 whitespace-nowrap">
                        {formatCurrency(m.total)}
                      </td>

                      {/* Excluir/Delete action */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteMaterial(m.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer inline-flex items-center justify-center"
                          title={`Excluir ${m.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Option to create a new material item */}
      {showAddForm ? (
        <form onSubmit={handleAddCustomItem} className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-4 animate-slideDown">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-100/50">
            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Adicionar Nova Chapa ou Material Personalizado
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Nome da Chapa / Item
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Placa de Desgaste"
                value={newPlateName}
                onChange={(e) => setNewPlateName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-955 focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={newPlateQtd}
                onChange={(e) => setNewPlateQtd(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-955 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Comp (L) mm
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={newPlateComp || ''}
                placeholder="0"
                onChange={(e) => setNewPlateComp(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-955 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Larg (W) mm
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={newPlateLarg || ''}
                placeholder="0"
                onChange={(e) => setNewPlateLarg(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-955 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Esp (T) mm
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={newPlateEsp || ''}
                placeholder="0"
                onChange={(e) => setNewPlateEsp(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-955 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
            <div className="w-full sm:max-w-xs">
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Material / Tipo de Aço
              </label>
              <select
                value={newPlateMaterial}
                onChange={(e) => setNewPlateMaterial(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-955 focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                {rawMaterials.map((rm) => (
                  <option key={rm.id} value={rm.name}>
                    {rm.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-end gap-2 self-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Item
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              if (rawMaterials.length > 0) {
                setNewPlateMaterial(rawMaterials[0].name);
              }
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Nova Chapa / Material
          </button>
        </div>
      )}

      {/* Manual toggle override and instructions */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
        <HelpCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-gray-500 space-y-1">
          <p className="font-bold text-gray-700">Dica de Oficina:</p>
          <p>
            As chapas <span className="font-semibold text-indigo-700">PBI/PBS</span>, <span className="font-semibold text-indigo-700">ESP</span>, <span className="font-semibold text-indigo-700">PS (Placa Base)</span> e <span className="font-semibold text-indigo-700">CH EXT</span> têm comprimentos e larguras derivados automaticamente das dimensões do molde.
          </p>
          <p>
            Altere as espessuras e quantidades livremente. Para adicionar <span className="font-semibold text-gray-700">Postiços, Gavetas ou Eletrodos</span>, basta alterar suas quantidades de <span className="font-bold">0</span> para o valor desejado e lançar as medidas.
          </p>
        </div>
      </div>

    </div>
  );
}
