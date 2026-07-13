/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { InternalServiceItem, MachiningType } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';
import { Briefcase, HelpCircle, Link } from 'lucide-react';

interface InternalServicesTableProps {
  services: InternalServiceItem[];
  onUpdateService: (id: string, updated: Partial<InternalServiceItem>) => void;
  onAddService: (item: InternalServiceItem) => void;
  onDeleteService: (id: string) => void;
  servicesTotal: number;
  machiningTypes?: MachiningType[];
}

export default function InternalServicesTable({
  services,
  onUpdateService,
  servicesTotal,
  machiningTypes = [],
}: InternalServicesTableProps) {
  
  const machiningNames = React.useMemo(() => {
    return new Set(machiningTypes.map(mt => mt.name.toLowerCase().trim()));
  }, [machiningTypes]);

  // All services configured by the company must be visible. Only services
  // that match a machining type are fed automatically by the machining tab.
  const displayedServices = React.useMemo(() => {
    return services;
  }, [services, machiningNames]);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4 overflow-hidden">
      
      {/* Header and Running Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            Serviços Internos (Oficina)
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Total Interno:
          </span>
          <span className="text-sm font-black font-mono text-indigo-800">
            {formatCurrency(servicesTotal)}
          </span>
        </div>
      </div>

      {/* Mobile view of services */}
      <div className="block md:hidden space-y-3">
        {displayedServices.map((s) => {
          const isSyncedAuto = machiningNames.has(s.name.toLowerCase().trim());

          return (
            <div key={s.id} className="bg-slate-50/50 rounded-xl p-3.5 border border-gray-150 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                <div>
                  <span className="font-bold text-gray-900 text-xs block">
                    {s.name}
                  </span>
                  <span className="text-[9px] text-gray-400 capitalize block mt-0.5">
                    Unidade: {s.unit === 'dia' ? 'diária' : 'horas'}
                  </span>
                </div>
                {isSyncedAuto && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                    <Link className="w-2.5 h-2.5" />
                    Automático
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity input */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    disabled={isSyncedAuto}
                    value={s.qtd || ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      onUpdateService(s.id, { qtd: val, total: val * s.valUnit });
                    }}
                    placeholder="0"
                    className={`w-full py-1.5 px-2.5 border rounded-lg text-center font-mono font-bold text-xs ${
                      isSyncedAuto 
                        ? 'bg-slate-100 text-indigo-800 border-slate-200 cursor-not-allowed' 
                        : 'bg-white border-gray-200 text-indigo-700'
                    }`}
                  />
                </div>

                {/* Unit Value (ReadOnly info) */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Preço Unitário</label>
                  <div className="py-1.5 px-2 bg-white border border-gray-200 rounded-lg font-mono font-bold text-right text-xs text-gray-600">
                    {formatCurrency(s.valUnit)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-150 bg-slate-100/30 -mx-3.5 -mb-3.5 px-3.5 py-1.5 rounded-b-xl">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase">Custo Total:</span>
                <span className="font-mono font-black text-xs text-gray-950">{formatCurrency(s.total)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table of services */}
      <div className="hidden md:block overflow-x-auto -mx-6">
        <div className="inline-block min-w-full align-middle px-6">
          <div className="overflow-hidden border border-gray-100 rounded-lg">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Atividade / Posto de Trabalho</th>
                  <th className="py-3 px-4 w-28 text-center">Unidade</th>
                  <th className="py-3 px-4 w-32 text-center">Quantidade</th>
                  <th className="py-3 px-4 w-36 text-right">Taxa / Preço Unitário</th>
                  <th className="py-3 px-4 w-36 text-right">Custo Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-900 bg-white">
                {displayedServices.map((s) => {
                  const isSyncedAuto = machiningNames.has(s.name.toLowerCase().trim());

                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-gray-50/50 transition ${s.qtd === 0 ? 'opacity-50 hover:opacity-100' : ''}`}
                    >
                      {/* Activity name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {s.name}
                          {isSyncedAuto && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                              <Link className="w-2.5 h-2.5" />
                              Automático
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium capitalize mt-0.5 block">
                          Unidade de cobrança: {s.unit === 'dia' ? 'diária' : 'horas'}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.unit === 'dia' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-teal-50 text-teal-700 border border-teal-100'
                        }`}>
                          {s.unit === 'dia' ? 'Dias' : 'Horas'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          disabled={isSyncedAuto}
                          value={s.qtd || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            onUpdateService(s.id, { qtd: val, total: val * s.valUnit });
                          }}
                          placeholder="0"
                          className={`w-20 py-1 px-2 border text-center rounded-lg font-mono font-bold ${
                            isSyncedAuto 
                              ? 'bg-slate-100 text-indigo-800 border-slate-200 cursor-not-allowed font-black' 
                              : s.qtd > 0 
                                ? 'bg-indigo-50/30 text-indigo-700 border-indigo-200' 
                                : 'bg-white border-gray-200 text-gray-500'
                          }`}
                        />
                      </td>

                      {/* Value Unit */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-600">
                        {formatCurrency(s.valUnit)} / {s.unit}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-gray-950 font-black">
                        {formatCurrency(s.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Helper Warning */}
      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <span className="text-[10px] text-gray-500">
          Todos os serviços cadastrados em <strong>Configurações</strong> aparecem nesta lista e podem ser lançados manualmente. Apenas os serviços que correspondem a um tipo de usinagem são <strong>alimentados automaticamente</strong> pela aba <strong>Tempos Usinagem</strong>.
        </span>
      </div>

    </div>
  );
}
