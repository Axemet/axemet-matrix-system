/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ConfigParams, InternalServiceItem, RawMaterial, MachiningType, StandardComponentStock } from '../types';
import { Settings, RefreshCw, Check, X, Plus, Trash2, HelpCircle } from 'lucide-react';
import { getMarginPercent } from '../utils/calculations';
import { DEFAULT_CONFIG, DEFAULT_RAW_MATERIALS, DEFAULT_INTERNAL_SERVICES } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigParams;
  onSaveConfig: (newConfig: ConfigParams) => void;
  serviceRates: InternalServiceItem[];
  onSaveServiceRates: (newRates: InternalServiceItem[]) => void;
  onResetToDefaults: () => void;
  rawMaterials: RawMaterial[];
  onSaveRawMaterials: (materials: RawMaterial[]) => void;
  machiningTypes: MachiningType[];
  onSaveMachiningTypes: (types: MachiningType[]) => void;
  standardComponents: StandardComponentStock[];
  onSaveStandardComponents: (components: StandardComponentStock[]) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  serviceRates,
  onSaveServiceRates,
  onResetToDefaults,
  rawMaterials,
  onSaveRawMaterials,
  machiningTypes,
  onSaveMachiningTypes,
  standardComponents,
  onSaveStandardComponents,
}: SettingsModalProps) {
  const [localConfig, setLocalConfig] = React.useState<ConfigParams>({ ...config });
  const [localRates, setLocalRates] = React.useState<InternalServiceItem[]>([]);
  const [localRawMaterials, setLocalRawMaterials] = React.useState<RawMaterial[]>([]);
  const [localMachiningTypes, setLocalMachiningTypes] = React.useState<MachiningType[]>([]);
  const [localStandardComponents, setLocalStandardComponents] = React.useState<StandardComponentStock[]>([]);

  // States for adding a new raw material
  const [newMatName, setNewMatName] = React.useState('');
  const [newMatDensity, setNewMatDensity] = React.useState(7.85);
  const [newMatPrice, setNewMatPrice] = React.useState(0);

  // States for adding a new machining type
  const [newMtName, setNewMtName] = React.useState('');
  const [newMtRate, setNewMtRate] = React.useState(0);

  // States for adding a new service rate
  const [newSrvName, setNewSrvName] = React.useState('');
  const [newSrvUnit, setNewSrvUnit] = React.useState<'h' | 'dia'>('h');
  const [newSrvRate, setNewSrvRate] = React.useState(0);
  const [newComponent, setNewComponent] = React.useState({ catalog: 'Outro' as StandardComponentStock['catalog'], code: '', name: '', stock: 0, minStock: 0, price: 0 });

  React.useEffect(() => {
    setLocalConfig({ ...config });
  }, [config, isOpen]);

  React.useEffect(() => {
    setLocalRates(serviceRates.map(r => ({ ...r })));
  }, [serviceRates, isOpen]);

  React.useEffect(() => {
    setLocalRawMaterials(rawMaterials.map(m => ({ ...m })));
  }, [rawMaterials, isOpen]);

  React.useEffect(() => {
    setLocalMachiningTypes(machiningTypes.map(mt => ({ ...mt })));
  }, [machiningTypes, isOpen]);

  React.useEffect(() => {
    setLocalStandardComponents(standardComponents.map(component => ({ ...component })));
  }, [standardComponents, isOpen]);

  if (!isOpen) return null;

  const handleConfigChange = (key: keyof ConfigParams, value: number) => {
    if (value < 0) return;
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleRateChange = (id: string, value: number) => {
    if (value < 0) return;
    setLocalRates(prev =>
      prev.map(r => (r.id === id ? { ...r, valUnit: value } : r))
    );
  };

  const handleRawMaterialChange = (id: string, field: 'density' | 'pricePerKg', value: number) => {
    if (value < 0) return;
    setLocalRawMaterials(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleAddRawMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    const newMat: RawMaterial = {
      id: `mat_custom_${Date.now()}`,
      name: newMatName.trim(),
      density: newMatDensity,
      pricePerKg: newMatPrice,
    };

    setLocalRawMaterials(prev => [...prev, newMat]);
    setNewMatName('');
    setNewMatDensity(7.85);
    setNewMatPrice(0);
  };

  const handleDeleteRawMaterial = (id: string) => {
    setLocalRawMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleMachiningTypeChange = (id: string, field: 'name' | 'hourlyRate', value: any) => {
    setLocalMachiningTypes(prev =>
      prev.map(mt => (mt.id === id ? { ...mt, [field]: value } : mt))
    );
  };

  const handleAddMachiningType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMtName.trim()) return;

    const newMt: MachiningType = {
      id: `mt_custom_${Date.now()}`,
      name: newMtName.trim(),
      hourlyRate: newMtRate,
    };

    setLocalMachiningTypes(prev => [...prev, newMt]);
    setNewMtName('');
    setNewMtRate(0);
  };

  const handleDeleteMachiningType = (id: string) => {
    setLocalMachiningTypes(prev => prev.filter(mt => mt.id !== id));
  };

  const handleDeleteAllMachiningTypes = () => {
    if (window.confirm('Tem certeza de que deseja excluir todos os tipos de usinagem cadastrados?')) {
      setLocalMachiningTypes([]);
    }
  };

  const handleAddServiceRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim()) return;

    const newSrv: InternalServiceItem = {
      id: `srv_custom_${Date.now()}`,
      name: newSrvName.trim(),
      unit: newSrvUnit,
      valUnit: newSrvRate,
      qtd: 0,
      total: 0,
    };

    setLocalRates((prev) => [...prev, newSrv]);
    setNewSrvName('');
    setNewSrvUnit('h');
    setNewSrvRate(0);
  };

  const handleDeleteServiceRate = (id: string) => {
    setLocalRates((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddStandardComponent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComponent.name.trim() || !newComponent.code.trim()) return;
    setLocalStandardComponents(previous => [...previous, { id: `std_component_${Date.now()}`, ...newComponent, code: newComponent.code.trim(), name: newComponent.name.trim() }]);
    setNewComponent({ catalog: 'Outro', code: '', name: '', stock: 0, minStock: 0, price: 0 });
  };

  const updateStandardComponent = (id: string, patch: Partial<StandardComponentStock>) => {
    setLocalStandardComponents(previous => previous.map(component => component.id === id ? { ...component, ...patch } : component));
  };

  const handleSaveAll = () => {
    // Also sync standard prices from rawMaterials to config if names match
    const p20Mat = localRawMaterials.find(m => m.name.toLowerCase() === 'aço p20' || m.name.toLowerCase() === 'p20');
    const steel1045Mat = localRawMaterials.find(m => m.name.toLowerCase() === 'aço 1045' || m.name.toLowerCase() === '1045');
    
    const updatedConfig = { ...localConfig };
    if (p20Mat) {
      updatedConfig.p20Price = p20Mat.pricePerKg;
      updatedConfig.defaultDensity = p20Mat.density;
    }
    if (steel1045Mat) {
      updatedConfig.steel1045Price = steel1045Mat.pricePerKg;
    }

    onSaveConfig(updatedConfig);
    onSaveServiceRates(localRates);
    onSaveRawMaterials(localRawMaterials);
    onSaveMachiningTypes(localMachiningTypes);
    onSaveStandardComponents(localStandardComponents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="settings-backdrop">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400 animate-spin-slow" />
            <h2 className="text-lg font-bold tracking-tight font-sans">Parâmetros e Matérias-Primas</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* MATÉRIAS-PRIMAS DINÂMICAS */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">
                Cadastro e Coeficientes de Matérias-Primas
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Gerencie os coeficientes de densidade de peso e valores por Kg para cada material de chapa.
              </p>
            </div>

            {/* List of current materials - Mobile View */}
            <div className="block sm:hidden space-y-3">
              {localRawMaterials.length === 0 ? (
                <div className="py-6 text-center text-gray-400 italic bg-slate-50 rounded-lg border border-dashed border-gray-200 text-xs">
                  Nenhuma matéria-prima cadastrada.
                </div>
              ) : (
                localRawMaterials.map((mat) => (
                  <div key={mat.id} className="bg-slate-50/70 border border-gray-150 rounded-xl p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-tight">
                        {mat.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRawMaterial(mat.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Excluir Matéria-Prima"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Densidade */}
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Densidade (g/cm³)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={mat.density}
                          onChange={(e) => handleRawMaterialChange(mat.id, 'density', parseFloat(e.target.value) || 0)}
                          className="w-full py-1.5 px-2.5 border border-gray-200 rounded-lg font-mono text-center text-xs bg-white text-gray-950 font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      {/* Preço */}
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Preço (R$ / Kg)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-[10px]">R$</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={mat.pricePerKg}
                            onChange={(e) => handleRawMaterialChange(mat.id, 'pricePerKg', parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg font-mono text-right text-xs bg-white text-gray-950 font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* List of current materials - Desktop View */}
            <div className="hidden sm:block border border-gray-150 rounded-lg overflow-hidden bg-gray-50/50">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Nome do Material</th>
                    <th className="py-2 px-3 text-center">Densidade (g/cm³)</th>
                    <th className="py-2 px-3 text-right">Preço (R$ / kg)</th>
                    <th className="py-2 px-3 w-12 text-center">Excluir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 bg-white text-gray-800">
                  {localRawMaterials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-gray-50/40">
                      <td className="py-2 px-3 font-semibold text-gray-900">
                        {mat.name}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={mat.density}
                          onChange={(e) => handleRawMaterialChange(mat.id, 'density', parseFloat(e.target.value) || 0)}
                          className="w-20 mx-auto block px-2 py-0.5 border border-gray-200 rounded font-mono text-center text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="relative w-24 ml-auto">
                          <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-gray-400 text-[10px]">R$</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={mat.pricePerKg}
                            onChange={(e) => handleRawMaterialChange(mat.id, 'pricePerKg', parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-1 py-0.5 border border-gray-200 rounded font-mono text-right text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRawMaterial(mat.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                          title="Excluir Matéria-Prima"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Material Creator Form */}
            <form onSubmit={handleAddRawMaterial} className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:flex-1">
                <label className="block text-[9px] font-bold uppercase text-indigo-950 mb-0.5">
                  Nova Matéria-Prima
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aço Ampcoloy, Nylon"
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  className="w-full px-2.5 py-2 sm:py-1 border border-indigo-200 rounded text-xs text-gray-950 bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="w-full sm:w-28">
                <label className="block text-[9px] font-bold uppercase text-indigo-950 mb-0.5 text-center sm:text-left">
                  Densidade
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newMatDensity}
                  onChange={(e) => setNewMatDensity(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 sm:py-1 border border-indigo-200 rounded text-xs text-center font-mono bg-white text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="w-full sm:w-28">
                <label className="block text-[9px] font-bold uppercase text-indigo-950 mb-0.5">
                  R$ / Kg
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newMatPrice || ''}
                  onChange={(e) => setNewMatPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 sm:py-1 border border-indigo-200 rounded text-xs text-right font-mono bg-white text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0,00"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto py-2.5 sm:py-1 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1 shrink-0 h-9 sm:h-[28px] cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar
              </button>
            </form>
          </div>

          {/* Alíquotas e Fatores de Venda */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              Taxas de Venda e Multiplicadores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 min-h-[36px] flex items-end">
                  Comissão Comercial (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="90"
                    value={localConfig.commission}
                    onChange={(e) => handleConfigChange('commission', parseFloat(e.target.value) || 0)}
                    className="w-full pr-8 pl-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 min-h-[36px] flex items-end">
                  Impostos (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="90"
                    value={localConfig.tax}
                    onChange={(e) => handleConfigChange('tax', parseFloat(e.target.value) || 0)}
                    className="w-full pr-8 pl-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 min-h-[36px] flex items-end">
                  Multiplicador Técnico (Molde)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={localConfig.multiplier}
                  onChange={(e) => handleConfigChange('multiplier', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 min-h-[36px] flex items-end">
                  Margem Comercial / Lucro (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="90"
                    value={getMarginPercent(localConfig)}
                    onChange={(e) => handleConfigChange('commercialMarkup', parseFloat(e.target.value) || 0)}
                    className="w-full pr-8 pl-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Serviços Internos - Valores das Horas/Dias */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              Custos das Atividades e Serviços Internos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {localRates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between border border-gray-100 p-3 rounded-lg bg-gray-50/50 gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-800 truncate">{rate.name}</span>
                    <span className="text-xs text-gray-400 capitalize">Cobrado por: {rate.unit === 'dia' ? 'diária' : 'horas'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="relative w-24">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 text-xs">R$</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={rate.valUnit}
                        onChange={(e) => handleRateChange(rate.id, parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-right font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteServiceRate(rate.id)}
                      className="p-1.5 border border-red-100 hover:border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Excluir Atividade/Serviço"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form for adding a new internal activity/service */}
            <form onSubmit={handleAddServiceRate} className="mt-4 p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-900">
                <Plus className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Adicionar Nova Atividade / Serviço Interno
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Nome da Atividade</label>
                  <input
                    type="text"
                    placeholder="Ex: Polimento Técnico"
                    required
                    value={newSrvName}
                    onChange={(e) => setNewSrvName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Forma de Cobrança</label>
                  <select
                    value={newSrvUnit}
                    onChange={(e) => setNewSrvUnit(e.target.value as 'h' | 'dia')}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium h-[28px]"
                  >
                    <option value="h">Hora (h)</option>
                    <option value="dia">Dia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Preço / Taxa Unitária</label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 text-xs">R$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        required
                        value={newSrvRate || ''}
                        onChange={(e) => setNewSrvRate(parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-2 py-1 text-xs text-right font-mono bg-white text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 border border-gray-200 rounded"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs flex items-center gap-1 shrink-0 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Catálogo de componentes normalizados */}
          <div className="border-t border-gray-100 pt-6">
            <div className="border-b border-gray-100 pb-2 mb-4"><h3 className="text-sm font-semibold text-gray-900">Catálogo de Componentes Normalizados</h3><p className="mt-1 text-[11px] text-gray-500">Cadastre os componentes para preenchê-los automaticamente na aba Componentes do orçamento. O preço e a descrição são puxados do catálogo e continuam rastreáveis.</p></div>
            <div className="space-y-2 mb-4">
              {localStandardComponents.length === 0 ? <div className="py-5 text-center text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs">Nenhum componente normalizado cadastrado.</div> : localStandardComponents.map(component => <div key={component.id} className="grid grid-cols-[90px_1fr_72px_72px_90px_32px] items-center gap-2 rounded-lg border border-gray-150 bg-gray-50/50 p-2 text-xs"><select value={component.catalog} onChange={e => updateStandardComponent(component.id, { catalog: e.target.value as StandardComponentStock['catalog'] })} className="rounded border border-gray-200 bg-white p-1.5"><option>Hasco</option><option>DME</option><option>Meusburger</option><option>Polimold</option><option>Outro</option></select><div className="min-w-0"><input value={component.code} onChange={e => updateStandardComponent(component.id, { code: e.target.value })} placeholder="Código" className="mb-1 w-full rounded border border-gray-200 bg-white px-2 py-1" /><input value={component.name} onChange={e => updateStandardComponent(component.id, { name: e.target.value })} placeholder="Nome" className="w-full rounded border border-gray-200 bg-white px-2 py-1" /></div><input type="number" min="0" value={component.stock} onChange={e => updateStandardComponent(component.id, { stock: Number(e.target.value) || 0 })} title="Estoque" className="rounded border border-gray-200 bg-white px-2 py-1 text-center" /><input type="number" min="0" value={component.minStock} onChange={e => updateStandardComponent(component.id, { minStock: Number(e.target.value) || 0 })} title="Estoque mínimo" className="rounded border border-gray-200 bg-white px-2 py-1 text-center" /><input type="number" min="0" step="0.01" value={component.price} onChange={e => updateStandardComponent(component.id, { price: Number(e.target.value) || 0 })} title="Preço unitário" className="rounded border border-gray-200 bg-white px-2 py-1 text-right" /><button type="button" onClick={() => setLocalStandardComponents(previous => previous.filter(current => current.id !== component.id))} className="p-1.5 text-gray-400 hover:text-red-600" title="Excluir componente"><Trash2 className="w-3.5 h-3.5" /></button></div>)}
            </div>
            <form onSubmit={handleAddStandardComponent} className="grid grid-cols-1 sm:grid-cols-[100px_110px_1fr_80px_80px_100px_auto] gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"><select value={newComponent.catalog} onChange={e => setNewComponent(current => ({ ...current, catalog: e.target.value as StandardComponentStock['catalog'] }))} className="rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs"><option>Hasco</option><option>DME</option><option>Meusburger</option><option>Polimold</option><option>Outro</option></select><input required value={newComponent.code} onChange={e => setNewComponent(current => ({ ...current, code: e.target.value }))} placeholder="Código" className="rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs" /><input required value={newComponent.name} onChange={e => setNewComponent(current => ({ ...current, name: e.target.value }))} placeholder="Nome do componente" className="rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs" /><input type="number" min="0" value={newComponent.stock || ''} onChange={e => setNewComponent(current => ({ ...current, stock: Number(e.target.value) || 0 }))} placeholder="Estoque" className="rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs" /><input type="number" min="0" value={newComponent.minStock || ''} onChange={e => setNewComponent(current => ({ ...current, minStock: Number(e.target.value) || 0 }))} placeholder="Mín." className="rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs" /><input type="number" min="0" step="0.01" value={newComponent.price || ''} onChange={e => setNewComponent(current => ({ ...current, price: Number(e.target.value) || 0 }))} placeholder="R$ unit." className="rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs" /><button type="submit" className="inline-flex items-center justify-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white"><Plus className="w-3.5 h-3.5" />Adicionar</button></form>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[9px] font-bold uppercase tracking-wide text-gray-400"><span>Estoque</span><span>Estoque mínimo</span><span>Preço unitário</span></div>
          </div>

          {/* Tipos de Usinagem (Alimentadores) */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Tipos de Usinagem (Alimentadores dos Serviços)
              </h3>
              {localMachiningTypes.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllMachiningTypes}
                  className="text-xs text-red-600 hover:text-red-700 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Todos
                </button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Defina os tipos de usinagem e seus valores por hora. Eles serão vinculados aos tempos lançados para cada chapa e alimentarão automaticamente a tabela de serviços de usinagem.
            </p>

            {/* List of current Machining Types */}
            <div className="space-y-2 mb-4">
              {localMachiningTypes.length === 0 ? (
                <div className="py-6 text-center text-gray-400 italic bg-gray-50/50 rounded-lg border border-dashed border-gray-200 text-xs">
                  Nenhum tipo de usinagem cadastrado. Cadastre um abaixo.
                </div>
              ) : (
                localMachiningTypes.map((mt) => (
                  <div key={mt.id} className="flex items-center justify-between border border-gray-150 p-3 rounded-lg bg-gray-50/50 gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={mt.name}
                        onChange={(e) => handleMachiningTypeChange(mt.id, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 font-semibold text-gray-900 text-sm py-0.5 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-32">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-xs">R$</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={mt.hourlyRate}
                          onChange={(e) => handleMachiningTypeChange(mt.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right font-mono font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMachiningType(mt.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        title="Excluir Tipo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form to add a new Machining Type */}
            <form onSubmit={handleAddMachiningType} className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:flex-1">
                <label className="block text-[9px] font-bold uppercase text-indigo-950 mb-0.5">
                  Novo Tipo de Usinagem
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fresa CNC, Torno, Erosão"
                  value={newMtName}
                  onChange={(e) => setNewMtName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-indigo-200 rounded text-xs text-gray-950 bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-[9px] font-bold uppercase text-indigo-950 mb-0.5">
                  Valor da Hora (R$ / h)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-[10px]">R$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={newMtRate || ''}
                    onChange={(e) => setNewMtRate(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-2.5 py-1.5 border border-indigo-200 rounded text-xs text-right font-mono bg-white text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1 shrink-0 h-[34px] cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3.5">
          <button
            onClick={() => {
              if (window.confirm('Tem certeza de que deseja restaurar as configurações originais de fábrica?')) {
                // Instantly reset local states to DEFAULT constants
                setLocalConfig({ ...DEFAULT_CONFIG });
                setLocalRawMaterials(DEFAULT_RAW_MATERIALS.map(m => ({ ...m })));
                setLocalRates(DEFAULT_INTERNAL_SERVICES.map((item, index) => ({
                  ...item,
                  id: `srv_${index}`,
                  total: 0,
                })) as any);
                
                onResetToDefaults();
                onClose();
              }
            }}
            className="flex items-center justify-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition cursor-pointer py-1.5 sm:py-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar Padrões
          </button>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition text-center cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAll}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white transition shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
