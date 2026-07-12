/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BudgetDraft } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';
import { FolderOpen, Trash2, Calendar, FileText, ChevronRight, X } from 'lucide-react';

interface BudgetListProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: BudgetDraft[];
  onLoadDraft: (draft: BudgetDraft) => void;
  onDeleteDraft: (id: string) => void;
}

export default function BudgetList({
  isOpen,
  onClose,
  drafts,
  onLoadDraft,
  onDeleteDraft,
}: BudgetListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const filteredDrafts = drafts.filter(
    (d) =>
      d.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.moldDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" id="history-backdrop">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold tracking-tight">Histórico de Orçamentos</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <input
            type="text"
            placeholder="Buscar por cliente ou molde..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>

        {/* Draft List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-sm">Nenhum orçamento encontrado.</p>
            </div>
          ) : (
            filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className="group border border-gray-100 hover:border-indigo-100 rounded-xl p-4 bg-white hover:bg-indigo-50/20 transition shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-gray-900 text-sm line-clamp-1">
                      {draft.clientName || 'Cliente sem nome'}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {formatCurrency(draft.totals.finalPrice)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-medium">
                    {draft.moldDescription || 'Sem descrição do molde'}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-3 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-300" />
                      {new Date(draft.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span>
                      {draft.moldWidth}x{draft.moldLength} mm
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
                  {confirmDeleteId === draft.id ? (
                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-100">
                      <span className="text-[10px] font-bold text-red-700 uppercase px-1">Excluir?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteDraft(draft.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-bold transition cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(draft.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Excluir orçamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onLoadDraft(draft);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Carregar
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 text-center font-medium">
          Total de {drafts.length} orçamentos salvos localmente.
        </div>

      </div>
    </div>
  );
}
