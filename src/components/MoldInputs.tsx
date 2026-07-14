/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Ruler, 
  Users, 
  FileText, 
  Calendar, 
  Plus, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle,
  FolderSync,
  ChevronDown,
  X,
  Hash,
  UserCheck
} from 'lucide-react';
import { Client } from '../types';

interface MoldInputsProps {
  reference: string;
  onReferenceChange: (val: string) => void;
  clientName: string;
  onClientNameChange: (val: string) => void;
  contactName: string;
  onContactNameChange: (val: string) => void;
  moldType: string;
  onMoldTypeChange: (val: string) => void;
  moldingMaterial: string;
  onMoldingMaterialChange: (val: string) => void;
  productQuantity: number;
  onProductQuantityChange: (val: number) => void;
  deliveryTime: string;
  onDeliveryTimeChange: (val: string) => void;
  observations: string;
  onObservationsChange: (val: string) => void;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  onStatusChange: (val: 'draft' | 'pending' | 'approved' | 'rejected') => void;
  moldDescription: string;
  onMoldDescriptionChange: (val: string) => void;
  date: string;
  onDateChange: (val: string) => void;
  clients: Client[];
  onAddClient: (client: Client) => void;
  onViewClientsTab: () => void;
}

export default function MoldInputs({
  reference,
  onReferenceChange,
  clientName,
  onClientNameChange,
  contactName,
  onContactNameChange,
  moldType,
  onMoldTypeChange,
  moldingMaterial,
  onMoldingMaterialChange,
  productQuantity,
  onProductQuantityChange,
  deliveryTime,
  onDeliveryTimeChange,
  observations,
  onObservationsChange,
  status,
  onStatusChange,
  moldDescription,
  onMoldDescriptionChange,
  date,
  onDateChange,
  clients,
  onAddClient,
  onViewClientsTab,
}: MoldInputsProps) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showNewForm, setShowNewForm] = React.useState(false);

  // New Client Form state (quick inline registration)
  const [newCNPJ, setNewCNPJ] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newCity, setNewCity] = React.useState('');
  const [newResponsible, setNewResponsible] = React.useState('');

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find if current client name exists in database
  const matchedClient = clients.find(
    (c) => c.name.trim().toLowerCase() === clientName.trim().toLowerCase()
  );

  // Filter clients based on current input text
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientName.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    onClientNameChange(client.name);
    onContactNameChange(client.responsible || '');
    setShowDropdown(false);
    setShowNewForm(false);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const newClient: Client = {
      id: `client_${Date.now()}`,
      name: clientName.trim(),
      cnpj: newCNPJ.trim() || undefined,
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      city: newCity.trim() || undefined,
      responsible: newResponsible.trim() || undefined,
    };

    onAddClient(newClient);
    setShowNewForm(false);
    setShowDropdown(false);
    
    // Clear form fields
    setNewCNPJ('');
    setNewPhone('');
    setNewEmail('');
    setNewCity('');
    setNewResponsible('');
  };

  const startNewClientRegistration = () => {
    setShowNewForm(true);
    setShowDropdown(false);
    setNewCNPJ('');
    setNewPhone('');
    setNewEmail('');
    setNewCity('');
    setNewResponsible('');
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold !text-gray-900 tracking-tight">
            Cadastro do Cliente & Identificação do Orçamento
          </h2>
        </div>
        <button
          type="button"
          onClick={onViewClientsTab}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
        >
          <FolderSync className="w-3.5 h-3.5" />
          Gerenciar Banco de Clientes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Cliente Name Column with searchable Combobox */}
        <div className="md:col-span-3 relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            Nome do Cliente
          </label>
          <div className="relative">
            <input
              id="client-name-input"
              type="text"
              required
              placeholder="Digite o nome do client..."
              value={clientName}
              onChange={(e) => {
                onClientNameChange(e.target.value);
                setShowDropdown(true);
                setShowNewForm(false);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-3.5 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute inset-y-0 right-0 px-2 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredClients.length > 0 ? (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                    Clientes Encontrados
                  </div>
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-xs text-gray-950 flex items-center justify-between transition border-b border-gray-50 last:border-0 cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold">{client.name}</span>
                        {client.city && (
                          <span className="text-gray-500 ml-1.5">({client.city})</span>
                        )}
                      </div>
                      {matchedClient?.id === client.id && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3.5 py-2 text-xs text-gray-500 italic">
                  Nenhum cliente correspondente encontrado.
                </div>
              )}

              {/* Action to create a new client */}
              {clientName.trim() && !matchedClient && (
                <div className="p-1.5 border-t border-gray-100 bg-gray-50">
                  <button
                    type="button"
                    onClick={startNewClientRegistration}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar "{clientName}" no Banco
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reference Code (Sequencial Auto) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-gray-400" />
            Referência
          </label>
          <input
            type="text"
            required
            placeholder="Ex: 0001/2026"
            value={reference}
            onChange={(e) => onReferenceChange(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 font-mono font-bold bg-indigo-50/30 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Mold Description */}
        <div className="md:col-span-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            Título do Ferramental
          </label>
          <input
            type="text"
            required
              placeholder="Ex: Conjunto Delta Frio – Linha 01"
            value={moldDescription}
            onChange={(e) => onMoldDescriptionChange(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>

        {/* Date */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Data do Orçamento
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>

      </div>

      {/* Informações Complementares e Comerciais */}
      <div className="pt-4 border-t border-gray-100 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <FolderSync className="w-4 h-4 text-indigo-500" />
          Informações Comerciais & Especificações do Produto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Contato/Responsável */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
              Contato / Responsável (preenchido pelo cadastro)
            </label>
            <input
              type="text"
              placeholder="Ex: Sr. Carlos Henrique"
              value={contactName}
              onChange={(e) => onContactNameChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Tipo de Molde */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              Tipo de Molde
            </label>
            <input
              type="text"
              placeholder="Ex: Molde de Injeção Plástica"
              value={moldType}
              onChange={(e) => onMoldTypeChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Material de Injeção */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-gray-400" />
              Material de Injeção
            </label>
            <input
              type="text"
              placeholder="Ex: PP, ABS, Nylon"
              value={moldingMaterial}
              onChange={(e) => onMoldingMaterialChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Quantidade de Peças */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-gray-400" />
              Número de Cavidades
            </label>
            <input
              type="number"
              placeholder="Ex: 5000"
              value={productQuantity || ''}
              onChange={(e) => onProductQuantityChange(Number(e.target.value))}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Prazo de Entrega */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Prazo de Entrega
            </label>
            <input
              type="text"
              placeholder="Ex: 45 dias úteis"
              value={deliveryTime}
              onChange={(e) => onDeliveryTimeChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Status do Orçamento */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
              Status do Orçamento
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer"
            >
              <option value="draft">Rascunho</option>
              <option value="pending">Pendente de Aprovação</option>
              <option value="approved">Aprovado pelo Cliente</option>
              <option value="rejected">Recusado pelo Cliente</option>
            </select>
          </div>

          {/* Observações */}
          <div className="md:col-span-9">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              Observações Gerais do Projeto
            </label>
            <input
              type="text"
              placeholder="Especificações sobre textura, polimento, rebarba, embalagem..."
              value={observations}
              onChange={(e) => onObservationsChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Inline Registration Form for New Client */}
      {showNewForm && (
        <form onSubmit={handleCreateClient} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/80 space-y-4 animate-slideDown">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-100/40">
            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-600" />
              Preencher Ficha de Cadastro: {clientName}
            </h3>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Responsável / Contato
              </label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={newResponsible}
                onChange={(e) => setNewResponsible(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                CNPJ
              </label>
              <input
                type="text"
                placeholder="Ex: 00.000.000/0001-00"
                value={newCNPJ}
                onChange={(e) => setNewCNPJ(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Telefone
              </label>
              <input
                type="text"
                placeholder="Ex: (47) 99999-9999"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <input
                type="email"
                placeholder="Ex: compras@cliente.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider mb-1">
                Cidade - UF
              </label>
              <input
                type="text"
                placeholder="Ex: Joinville - SC"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-3.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Confirmar Cadastro
            </button>
          </div>
        </form>
      )}

      {/* Selected Client metadata display card */}
      {matchedClient && (
        <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-1.5">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-950">Cliente Identificado no Banco de Dados</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-emerald-900">
            {matchedClient.responsible && (
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate" title={matchedClient.responsible}>Resp: {matchedClient.responsible}</span>
              </div>
            )}
            {matchedClient.cnpj && (
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-mono text-[11px]">CNPJ: {matchedClient.cnpj}</span>
              </div>
            )}
            {matchedClient.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tel: {matchedClient.phone}</span>
              </div>
            )}
            {matchedClient.email && (
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate" title={matchedClient.email}>{matchedClient.email}</span>
              </div>
            )}
            {matchedClient.city && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{matchedClient.city}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!matchedClient && !showNewForm && clientName.trim() && (
        <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-900">
              Este cliente não está cadastrado no banco de dados local.
            </span>
          </div>
          <button
            type="button"
            onClick={startNewClientRegistration}
            className="text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg transition self-start sm:self-auto cursor-pointer"
          >
            Cadastrar Agora
          </button>
        </div>
      )}

    </div>
  );
}
