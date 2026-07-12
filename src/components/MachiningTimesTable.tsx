/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MaterialItem, MachiningType } from '../types';
import { Clock, HelpCircle, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/pdfGenerator';

interface MachiningTimesTableProps {
  materials: MaterialItem[];
  machiningTypes: MachiningType[];
  onUpdateMaterialTimes: (materialId: string, times: { [machiningTypeId: string]: number }) => void;
  onClearAllTimes: () => void;
}

export default function MachiningTimesTable({
  materials,
  machiningTypes,
  onUpdateMaterialTimes,
  onClearAllTimes,
}: MachiningTimesTableProps) {
  // Local state to keep track of the selected machining type per material row
  const [selectedTypes, setSelectedTypes] = React.useState<{ [materialId: string]: string }>({});
  const [showConfirmClear, setShowConfirmClear] = React.useState(false);

  // Sum up machining times per type across all plates
  const totalHoursByType = React.useMemo(() => {
    const totals: { [id: string]: number } = {};
    machiningTypes.forEach(mt => {
      totals[mt.id] = 0;
    });

    materials.forEach(m => {
      if (m.machiningTimes) {
        Object.entries(m.machiningTimes).forEach(([mtId, hours]) => {
          if (totals[mtId] !== undefined && typeof hours === 'number') {
            totals[mtId] += hours;
          }
        });
      }
    });
    return totals;
  }, [materials, machiningTypes]);

  const totalEstimatedCost = React.useMemo(() => {
    let cost = 0;
    machiningTypes.forEach(mt => {
      const hours = totalHoursByType[mt.id] || 0;
      cost += hours * mt.hourlyRate;
    });
    return cost;
  }, [machiningTypes, totalHoursByType]);

  const activeMaterials = React.useMemo(() => {
    // Return materials that are active (qtd > 0 or has manual dimensions)
    return materials.filter(m => m.qtd > 0 || m.comp > 0);
  }, [materials]);

  const handleTimeChange = (materialId: string, mtId: string, value: string) => {
    const hours = Math.max(0, parseFloat(value) || 0);
    const material = materials.find(m => m.id === materialId);
    const currentTimes = material?.machiningTimes || {};
    
    onUpdateMaterialTimes(materialId, {
      ...currentTimes,
      [mtId]: hours,
    });
  };

  if (machiningTypes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-8 text-center space-y-4">
        <Clock className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-sm font-bold text-gray-900">Nenhum Tipo de Usinagem Configurado</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Para lançar tempos de usinagem, primeiro acesse as configurações no topo da tela (ícone de engrenagem) e cadastre seus <strong>Tipos de Usinagem</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-6">
      
      {/* Header with summary stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              Lançamento de Tempos de Usinagem
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Selecione o serviço diretamente na linha de cada chapa ou componente e preencha as horas correspondentes.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg flex flex-col justify-center">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
              Custo Total de Usinagem:
            </span>
            <span className="text-sm font-black font-mono text-indigo-800">
              {formatCurrency(totalEstimatedCost)}
            </span>
          </div>

          {!showConfirmClear ? (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Zerar Tempos
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-lg border border-red-200">
              <span className="text-[10px] font-bold text-red-700 px-2">Zerar todos os tempos?</span>
              <button
                type="button"
                onClick={() => {
                  onClearAllTimes();
                  setShowConfirmClear(false);
                }}
                className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold hover:bg-red-700 transition"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold hover:bg-slate-50 transition"
              >
                Não
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid table with row-level selectors */}
      <div className="overflow-x-auto -mx-6">
        <div className="inline-block min-w-full align-middle px-6">
          <div className="overflow-hidden border border-gray-100 rounded-lg shadow-2xs bg-slate-50/25">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 min-w-[200px]">Chapa / Componente</th>
                  <th className="py-3 px-3 text-center w-24">Quantidade</th>
                  <th className="py-3 px-4 text-center min-w-[240px]">Serviço</th>
                  <th className="py-3 px-4 text-center min-w-[180px]">Tempos Lançados</th>
                  <th className="py-3 px-4 text-right w-36">Custo Usinagem (Chapa)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-900 bg-white">
                {activeMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                      Nenhuma chapa ativa ou configurada na aba "Chapas &amp; Aço".
                    </td>
                  </tr>
                ) : (
                  activeMaterials.map((m) => {
                    // Compute total machining cost and total hours for this material
                    let rowHours = 0;
                    let rowCost = 0;
                    machiningTypes.forEach(mt => {
                      const h = m.machiningTimes?.[mt.id] || 0;
                      rowHours += h;
                      rowCost += h * mt.hourlyRate;
                    });

                    // Get currently selected machining type for this specific row
                    const selectedTypeId = selectedTypes[m.id] || (machiningTypes[0]?.id || '');
                    const currentVal = m.machiningTimes?.[selectedTypeId] || 0;

                    // Get all machining types that already have hours on this plate
                    const activeTimes = machiningTypes.filter(mt => (m.machiningTimes?.[mt.id] || 0) > 0);

                    return (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition">
                        {/* Name and specs */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {m.name}
                          </div>
                          <span className="text-[10px] text-gray-400 block font-medium mt-0.5 font-mono">
                            {m.material} • {m.comp}x{m.larg}x{m.esp}mm
                          </span>
                        </td>

                        {/* Qtd */}
                        <td className="py-3 px-3 text-center font-bold font-mono text-gray-500">
                          {m.qtd}x
                        </td>

                        {/* Row Selector and Hours input */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <select
                              value={selectedTypeId}
                              onChange={(e) => setSelectedTypes(prev => ({ ...prev, [m.id]: e.target.value }))}
                              className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 font-medium max-w-[150px] truncate"
                            >
                              {machiningTypes.map(mt => (
                                <option key={mt.id} value={mt.id}>
                                  {mt.name} ({formatCurrency(mt.hourlyRate)}/h)
                                </option>
                              ))}
                            </select>

                            <div className="relative inline-block w-20">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={currentVal || ''}
                                onChange={(e) => handleTimeChange(m.id, selectedTypeId, e.target.value)}
                                placeholder="0"
                                className={`w-full py-1.5 px-2 text-center border rounded-lg font-mono font-bold text-xs ${
                                  currentVal > 0 
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                                    : 'bg-white border-gray-200 text-gray-400'
                                }`}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold shrink-0">h</span>
                          </div>
                        </td>

                        {/* Badges for times already entered on this plate */}
                        <td className="py-2.5 px-4 text-center">
                          {activeTimes.length === 0 ? (
                            <span className="text-[10px] text-gray-400 italic">Nenhum tempo lançado</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 justify-center max-w-[220px] mx-auto">
                              {activeTimes.map(mt => (
                                <span 
                                  key={mt.id} 
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                >
                                  <span>{mt.name.replace('Usinagem ', '')}: {m.machiningTimes?.[mt.id]}h</span>
                                  <button
                                    type="button"
                                    onClick={() => handleTimeChange(m.id, mt.id, '0')}
                                    className="text-indigo-400 hover:text-red-500 font-extrabold focus:outline-none px-0.5 cursor-pointer"
                                    title="Excluir este tempo"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Row Cost & Hours */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-bold text-gray-900">
                            {formatCurrency(rowCost)}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                            {rowHours.toFixed(1)} h total
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Subtotals Footer Row */}
                {activeMaterials.length > 0 && (
                  <tr className="bg-slate-50/70 font-bold border-t border-gray-200">
                    <td className="py-3.5 px-4 font-black text-gray-900">
                      Subtotais por Chapa
                    </td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-4 text-center font-mono font-black text-indigo-700">
                      {(Object.entries(totalHoursByType) as [string, number][]).map(([mtId, hours]) => {
                        const mt = machiningTypes.find(t => t.id === mtId);
                        if (!mt || hours === 0) return null;
                        return (
                          <div key={mtId} className="text-[10px] font-bold text-indigo-800">
                            {mt.name.replace('Usinagem ', '')}: {hours.toFixed(1)}h
                          </div>
                        );
                      })}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[10px]">
                      {(Object.values(totalHoursByType) as number[]).reduce((a, b) => a + b, 0).toFixed(1)} h total
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-gray-950">
                      {formatCurrency(totalEstimatedCost)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Integration details warning */}
      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <span className="font-extrabold text-emerald-800 uppercase text-[10px] tracking-wider block">
            Sincronização Ativa de Tempos
          </span>
          <p className="leading-relaxed">
            As horas de usinagem digitadas na linha de cada chapa alimentam <strong>automaticamente</strong> as atividades correspondentes na aba <strong>Serviços</strong>.
            As taxas e custos atualizarão o orçamento final de forma instantânea!
          </p>
        </div>
      </div>

    </div>
  );
}
