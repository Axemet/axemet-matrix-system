/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  Trash2, 
  Edit3, 
  UserCheck, 
  X, 
  FileText,
  Briefcase
} from 'lucide-react';
import { Client } from '../types';

interface ClientsDatabaseProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (client: Client) => void;
  onSelectClient: (client: Client) => void;
  activeClientName: string;
}

export default function ClientsDatabase({
  clients,
  onAddClient,
  onDeleteClient,
  onUpdateClient,
  onSelectClient,
  activeClientName,
}: ClientsDatabaseProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showNewForm, setShowNewForm] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);

  // New Client State
  const [newName, setNewName] = React.useState('');
  const [newCorporateName, setNewCorporateName] = React.useState('');
  const [newCNPJ, setNewCNPJ] = React.useState('');
  const [newStateInscription, setNewStateInscription] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newResponsible, setNewResponsible] = React.useState('');
  const [newCEP, setNewCEP] = React.useState('');
  const [newAddress, setNewAddress] = React.useState('');
  const [newNumber, setNewNumber] = React.useState('');
  const [newNeighborhood, setNewNeighborhood] = React.useState('');
  const [newCity, setNewCity] = React.useState('');
  const [newState, setNewState] = React.useState('');

  // Editing Client State
  const [editName, setEditName] = React.useState('');
  const [editCorporateName, setEditCorporateName] = React.useState('');
  const [editCNPJ, setEditCNPJ] = React.useState('');
  const [editStateInscription, setEditStateInscription] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editResponsible, setEditResponsible] = React.useState('');
  const [editCEP, setEditCEP] = React.useState('');
  const [editAddress, setEditAddress] = React.useState('');
  const [editNumber, setEditNumber] = React.useState('');
  const [editNeighborhood, setEditNeighborhood] = React.useState('');
  const [editCity, setEditCity] = React.useState('');
  const [editState, setEditState] = React.useState('');

  // CEP Lookup helper
  const handleCEPLookup = async (cepVal: string, isEdit: boolean) => {
    const cleaned = cepVal.replace(/\D/g, '');
    if (cleaned.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (isEdit) {
            setEditAddress(data.logradouro || '');
            setEditNeighborhood(data.bairro || '');
            setEditCity(data.localidade || '');
            setEditState(data.uf || '');
          } else {
            setNewAddress(data.logradouro || '');
            setNewNeighborhood(data.bairro || '');
            setNewCity(data.localidade || '');
            setNewState(data.uf || '');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  // Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Filter clients
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.corporateName && c.corporateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.cnpj && c.cnpj.includes(searchTerm)) ||
    (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.responsible && c.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newClient: Client = {
      id: `client_${Date.now()}`,
      name: newName.trim(),
      corporateName: newCorporateName.trim() || undefined,
      cnpj: newCNPJ.trim() || undefined,
      stateInscription: newStateInscription.trim() || undefined,
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      responsible: newResponsible.trim() || undefined,
      cep: newCEP.trim() || undefined,
      address: newAddress.trim() || undefined,
      number: newNumber.trim() || undefined,
      neighborhood: newNeighborhood.trim() || undefined,
      city: newCity.trim() || undefined,
      state: newState.trim() || undefined,
    };

    onAddClient(newClient);
    setShowNewForm(false);
    
    // Clear
    setNewName('');
    setNewCorporateName('');
    setNewCNPJ('');
    setNewStateInscription('');
    setNewPhone('');
    setNewEmail('');
    setNewResponsible('');
    setNewCEP('');
    setNewAddress('');
    setNewNumber('');
    setNewNeighborhood('');
    setNewCity('');
    setNewState('');
  };

  const startEdit = (c: Client) => {
    setEditingClient(c);
    setEditName(c.name);
    setEditCorporateName(c.corporateName || '');
    setEditCNPJ(c.cnpj || '');
    setEditStateInscription(c.stateInscription || '');
    setEditPhone(c.phone || '');
    setEditEmail(c.email || '');
    setEditCity(c.city || '');
    setEditResponsible(c.responsible || '');
    setEditCEP(c.cep || '');
    setEditAddress(c.address || '');
    setEditNumber(c.number || '');
    setEditNeighborhood(c.neighborhood || '');
    setEditState(c.state || '');
    setConfirmDeleteId(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editName.trim()) return;

    const updated: Client = {
      ...editingClient,
      name: editName.trim(),
      corporateName: editCorporateName.trim() || undefined,
      cnpj: editCNPJ.trim() || undefined,
      stateInscription: editStateInscription.trim() || undefined,
      phone: editPhone.trim() || undefined,
      email: editEmail.trim() || undefined,
      responsible: editResponsible.trim() || undefined,
      cep: editCEP.trim() || undefined,
      address: editAddress.trim() || undefined,
      number: editNumber.trim() || undefined,
      neighborhood: editNeighborhood.trim() || undefined,
      city: editCity.trim() || undefined,
      state: editState.trim() || undefined,
    };

    onUpdateClient(updated);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Banco de Clientes</h2>
          </div>
          <p className="text-xs text-gray-500">
            Gerencie o cadastro de clientes, dados para faturamento e preenchimento automático de propostas.
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => {
            setShowNewForm(!showNewForm);
            setEditingClient(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          {showNewForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showNewForm ? 'Cancelar' : 'Novo Cliente'}
        </button>
      </div>
      {/* Form: New Client */}
      {showNewForm && (
        <form onSubmit={handleCreateSubmit} className="p-6 bg-white rounded-xl border border-indigo-100 shadow-xs space-y-6 animate-slideDown">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Cadastrar Novo Cliente
            </h3>
            <button type="button" onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Dados Gerais */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">1. Dados Principais / Faturamento</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nome do Cliente / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Metalúrgica Indústria Catarinense"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Razão Social
                </label>
                <input
                  type="text"
                  value={newCorporateName}
                  onChange={(e) => setNewCorporateName(e.target.value)}
                  placeholder="Ex: Metalúrgica Indústria Catarinense S/A"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  CNPJ / CPF
                </label>
                <input
                  type="text"
                  value={newCNPJ}
                  onChange={(e) => setNewCNPJ(e.target.value)}
                  placeholder="Ex: 00.000.000/0001-00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Inscrição Estadual (I.E.)
                </label>
                <input
                  type="text"
                  value={newStateInscription}
                  onChange={(e) => setNewStateInscription(e.target.value)}
                  placeholder="Ex: 254.845.120"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contato */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">2. Informações de Contato</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Responsável / Contato
                </label>
                <input
                  type="text"
                  value={newResponsible}
                  onChange={(e) => setNewResponsible(e.target.value)}
                  placeholder="Ex: João da Silva (Comprador)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ex: (47) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ex: compras@empresa.com.br"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Endereço */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">3. Endereço e Localização</h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  CEP (Buscar Auto)
                </label>
                <input
                  type="text"
                  value={newCEP}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCEP(val);
                    handleCEPLookup(val, false);
                  }}
                  placeholder="Ex: 89200-000"
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs font-mono text-gray-955 bg-indigo-50/20 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Logradouro / Rua
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="Ex: 123"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={newNeighborhood}
                  onChange={(e) => setNewNeighborhood(e.target.value)}
                  placeholder="Ex: Centro"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Ex: Joinville"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="Ex: SC"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Cadastro
            </button>
          </div>
        </form>
      )}

      {/* Form: Edit Client */}
      {editingClient && (
        <form onSubmit={handleEditSubmit} className="p-6 bg-white rounded-xl border border-amber-200 shadow-xs space-y-6 animate-slideDown">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-600" />
              Editar Cadastro de {editingClient.name}
            </h3>
            <button type="button" onClick={() => setEditingClient(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Dados Gerais */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">1. Dados Principais / Faturamento</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nome do Cliente / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Nome Fantasia"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Razão Social
                </label>
                <input
                  type="text"
                  value={editCorporateName}
                  onChange={(e) => setEditCorporateName(e.target.value)}
                  placeholder="Ex: Razão Social Completa"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  CNPJ / CPF
                </label>
                <input
                  type="text"
                  value={editCNPJ}
                  onChange={(e) => setEditCNPJ(e.target.value)}
                  placeholder="Ex: 00.000.000/0001-00"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs font-mono text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Inscrição Estadual (I.E.)
                </label>
                <input
                  type="text"
                  value={editStateInscription}
                  onChange={(e) => setEditStateInscription(e.target.value)}
                  placeholder="Ex: Inscrição Estadual"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs font-mono text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contato */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">2. Informações de Contato</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Responsável / Contato
                </label>
                <input
                  type="text"
                  value={editResponsible}
                  onChange={(e) => setEditResponsible(e.target.value)}
                  placeholder="Ex: Nome do contato"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Ex: (47) 99999-9999"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Ex: compras@cliente.com"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Endereço */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">3. Endereço e Localização</h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  CEP (Buscar Auto)
                </label>
                <input
                  type="text"
                  value={editCEP}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditCEP(val);
                    handleCEPLookup(val, true);
                  }}
                  placeholder="Ex: CEP"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs font-mono text-gray-955 bg-amber-50/20 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Logradouro / Rua
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Ex: Rua, Avenida..."
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  placeholder="Ex: Número"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={editNeighborhood}
                  onChange={(e) => setEditNeighborhood(e.target.value)}
                  placeholder="Ex: Bairro"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Ex: Cidade"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  placeholder="Ex: UF"
                  className="w-full px-3 py-2 border border-amber-250 rounded-lg text-xs text-gray-950 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-50">
            <button
              type="button"
              onClick={() => setEditingClient(null)}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* Main Table and search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        
        {/* Search Bar Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-950 focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <span className="text-[11px] font-medium text-gray-400 font-mono">
            {filteredClients.length} {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </span>
        </div>

        {/* Clients Table */}
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">Nenhum cliente cadastrado</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchTerm ? 'Sua busca não retornou resultados. Experimente outro termo.' : 'Comece registrando o primeiro cliente clicando em "Novo Cliente".'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredClients.map((client) => {
              const isActive = activeClientName.trim().toLowerCase() === client.name.trim().toLowerCase();
              return (
                <div 
                  key={client.id} 
                  className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs relative ${
                    isActive 
                      ? 'border-[#EA580C] ring-1 ring-[#EA580C] bg-[#EA580C]/5' 
                      : 'border-gray-150 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 space-y-2 bg-slate-50/40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-2" title={client.name}>
                          {client.name}
                        </h4>
                        {client.corporateName && (
                          <p className="text-[10px] text-slate-500 font-medium line-clamp-1">
                            {client.corporateName}
                          </p>
                        )}
                      </div>
                      {isActive && (
                        <span className="bg-[#EA580C] text-white text-[9px] px-2 py-0.5 rounded-full font-bold font-mono tracking-wider shrink-0 shadow-xs animate-pulse uppercase">
                          Ativo
                        </span>
                      )}
                    </div>
                    {client.cnpj && (
                      <div className="text-[10px] font-mono text-gray-450 flex items-center gap-1.5 bg-white/60 py-0.5 px-2 rounded border border-gray-100 w-fit">
                        <span className="font-bold text-gray-400 text-[9px] uppercase tracking-wider">CNPJ:</span>
                        <span>{client.cnpj}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3.5 flex-1 text-xs">
                    {/* Responsável */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-indigo-50/50 rounded-lg text-indigo-650 shrink-0">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Responsável</span>
                        <p className="font-bold text-gray-800 truncate">
                          {client.responsible || <span className="text-gray-400 italic font-normal">Não informado</span>}
                        </p>
                      </div>
                    </div>

                    {/* Contatos */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-50/50 rounded-lg text-[#059669] shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Contatos</span>
                        <div className="space-y-1">
                          {client.phone ? (
                            <p className="font-mono font-bold text-gray-800 text-[11px] truncate">{client.phone}</p>
                          ) : null}
                          {client.email ? (
                            <p className="text-gray-500 font-medium truncate text-[11px] hover:text-indigo-600 transition">
                              {client.email}
                            </p>
                          ) : null}
                          {!client.phone && !client.email && (
                            <span className="text-gray-400 italic">Sem contato cadastrado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Localização */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-amber-50/50 rounded-lg text-amber-600 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Localização</span>
                        {client.city ? (
                          <div className="space-y-0.5 text-[11px]">
                            <p className="font-bold text-gray-800">
                              {client.city} - {client.state || ''}
                            </p>
                            {client.address && (
                              <p className="text-[10px] text-gray-500 leading-normal line-clamp-2" title={`${client.address}, ${client.number || 'S/N'} - ${client.neighborhood}`}>
                                {client.address}, {client.number || 'S/N'}<br />
                                {client.neighborhood && `${client.neighborhood}`} {client.cep && `(CEP: ${client.cep})`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Não informado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-slate-50/80 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
                    {/* Left Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => startEdit(client)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer border border-transparent hover:border-amber-100"
                        title="Editar cadastro"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button Block with confirmation */}
                      {confirmDeleteId === client.id ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100 shrink-0 z-10">
                          <span className="text-[8px] font-bold text-red-700 uppercase px-1">Excluir?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteClient(client.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-extrabold tracking-wider transition cursor-pointer uppercase"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[9px] font-extrabold tracking-wider transition cursor-pointer uppercase"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(client.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-transparent hover:border-red-100"
                          title="Excluir cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Right Select Action */}
                    <button
                      type="button"
                      onClick={() => onSelectClient(client)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                        isActive 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                          : 'bg-indigo-600 hover:bg-[#EA580C] hover:border-[#EA580C] text-white border-indigo-600'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isActive ? 'Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
