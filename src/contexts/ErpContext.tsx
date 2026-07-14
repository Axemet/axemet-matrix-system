/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ErpContext — global state for ERP Modules 2–11.
 *
 * Replaces the 9 localStorage useState blocks previously in App.tsx.
 * Data is loaded from Supabase on mount (when configured) and persisted
 * on every mutation via the useErpSync hook. When Supabase is not configured
 * the arrays remain empty so the UI degrades gracefully.
 */

import React from 'react';
import {
  MatrixProject, RawMaterialStock, QualityInspection, NonConformance,
  BillingMilestone, CashTransaction, MaintenanceLog, PurchaseRequest,
} from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  syncFetchErpProjects, syncSaveErpProject, syncDeleteErpProject,
  syncFetchRawStock, syncSaveRawStockItem, syncDeleteRawStockItem,
  syncFetchInspections, syncSaveInspection, syncDeleteInspection,
  syncFetchNonConformances, syncSaveNonConformance, syncDeleteNonConformance,
  syncFetchMilestones, syncSaveMilestone, syncDeleteMilestone,
  syncFetchTransactions, syncSaveTransaction, syncDeleteTransaction,
  syncFetchMaintenanceLogs, syncSaveMaintenanceLog, syncDeleteMaintenanceLog,
} from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ErpContextValue {
  // State
  erpProjects: MatrixProject[];
  erpRawStock: RawMaterialStock[];
  erpAudits: QualityInspection[];
  erpRncs: NonConformance[];
  erpMilestones: BillingMilestone[];
  erpTransactions: CashTransaction[];
  erpRequests: PurchaseRequest[];
  erpMaintLogs: MaintenanceLog[];
  erpTools: any[];
  erpLoading: boolean;

  // Project handlers
  handleSaveProject: (project: MatrixProject) => Promise<void>;
  handleDeleteProject: (id: string) => Promise<void>;
  handleAssignOperation: (projectId: string, operationId: string, employeeName: string, machineName: string) => void;

  // Raw stock handlers
  handleSaveRawStockItem: (item: RawMaterialStock) => Promise<void>;
  handleDeleteRawStockItem: (id: string) => Promise<void>;
  setErpRawStock: React.Dispatch<React.SetStateAction<RawMaterialStock[]>>;

  // Inspection handlers
  handleSaveInspection: (inspection: QualityInspection) => Promise<void>;
  handleDeleteInspection: (id: string) => Promise<void>;
  setErpAudits: React.Dispatch<React.SetStateAction<QualityInspection[]>>;

  // RNC handlers
  handleSaveRnc: (rnc: NonConformance) => Promise<void>;
  handleDeleteRnc: (id: string) => Promise<void>;
  setErpRncs: React.Dispatch<React.SetStateAction<NonConformance[]>>;

  // Milestone handlers
  handleSaveMilestone: (milestone: BillingMilestone) => Promise<void>;
  handleDeleteMilestone: (id: string) => Promise<void>;
  setErpMilestones: React.Dispatch<React.SetStateAction<BillingMilestone[]>>;

  // Transaction handlers
  handleSaveTransaction: (transaction: CashTransaction) => Promise<void>;
  handleDeleteTransaction: (id: string) => Promise<void>;
  setErpTransactions: React.Dispatch<React.SetStateAction<CashTransaction[]>>;

  // Purchase request handlers (localStorage — no dedicated table yet)
  handleSavePurchaseRequest: (req: PurchaseRequest) => void;
  handleDeletePurchaseRequest: (id: string) => void;
  setErpRequests: React.Dispatch<React.SetStateAction<PurchaseRequest[]>>;
  handleTriggerPurchaseRequest: (projId: string, itemType: string, desc: string, qty: number) => void;

  // Maintenance log handlers
  handleSaveMaintenanceLog: (log: MaintenanceLog) => Promise<void>;
  handleDeleteMaintenanceLog: (id: string) => Promise<void>;
  setErpMaintLogs: React.Dispatch<React.SetStateAction<MaintenanceLog[]>>;

  // Tools (localStorage — no dedicated table yet)
  setErpTools: React.Dispatch<React.SetStateAction<any[]>>;

  // Derived
  workflowOperations: Array<{
    projectId: string;
    project: string;
    operationId: string;
    operation: string;
    workCenter: string | undefined;
    operator: string | undefined;
    status: string;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const ErpContext = React.createContext<ErpContextValue | null>(null);

export function useErpContext(): ErpContextValue {
  const ctx = React.useContext(ErpContext);
  if (!ctx) throw new Error('useErpContext must be used inside <ErpProvider>');
  return ctx;
}

// ─────────────────────────────────────────────────────────────
// Helper: generic optimistic upsert into an array by id
// ─────────────────────────────────────────────────────────────
function upsertById<T extends { id: string }>(arr: T[], item: T): T[] {
  const exists = arr.some(a => a.id === item.id);
  return exists ? arr.map(a => a.id === item.id ? item : a) : [item, ...arr];
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function ErpProvider({ children, showToast }: { children: React.ReactNode; showToast: (msg: string, type?: string) => void }) {
  const [erpLoading, setErpLoading] = React.useState(true);

  // ── State ──────────────────────────────────────────────────
  const [erpProjects, setErpProjects] = React.useState<MatrixProject[]>([]);
  const [erpRawStock, setErpRawStock] = React.useState<RawMaterialStock[]>([]);
  const [erpAudits, setErpAudits] = React.useState<QualityInspection[]>([]);
  const [erpRncs, setErpRncs] = React.useState<NonConformance[]>([]);
  const [erpMilestones, setErpMilestones] = React.useState<BillingMilestone[]>([]);
  const [erpTransactions, setErpTransactions] = React.useState<CashTransaction[]>([]);
  const [erpRequests, setErpRequests] = React.useState<PurchaseRequest[]>(() => {
    // Purchase requests have no Supabase table yet — keep localStorage for now
    try { return JSON.parse(localStorage.getItem('erp_requests') || '[]'); } catch { return []; }
  });
  const [erpMaintLogs, setErpMaintLogs] = React.useState<MaintenanceLog[]>([]);
  const [erpTools, setErpTools] = React.useState<any[]>(() => {
    // Tools have no Supabase table yet — keep localStorage
    try { return JSON.parse(localStorage.getItem('erp_tools') || '[]'); } catch { return []; }
  });

  // ── Initial load from Supabase ─────────────────────────────
  React.useEffect(() => {
    if (!isSupabaseConfigured) { setErpLoading(false); return; }
    const load = async () => {
      try {
        const [projects, rawStock, inspections, rncs, milestones, transactions, maintLogs] =
          await Promise.allSettled([
            syncFetchErpProjects(),
            syncFetchRawStock(),
            syncFetchInspections(),
            syncFetchNonConformances(),
            syncFetchMilestones(),
            syncFetchTransactions(),
            syncFetchMaintenanceLogs(),
          ]);

        if (projects.status === 'fulfilled') setErpProjects(projects.value);
        if (rawStock.status === 'fulfilled') setErpRawStock(rawStock.value);
        if (inspections.status === 'fulfilled') setErpAudits(inspections.value);
        if (rncs.status === 'fulfilled') setErpRncs(rncs.value);
        if (milestones.status === 'fulfilled') setErpMilestones(milestones.value);
        if (transactions.status === 'fulfilled') setErpTransactions(transactions.value);
        if (maintLogs.status === 'fulfilled') setErpMaintLogs(maintLogs.value);
      } catch (err) {
        console.error('Erro ao carregar dados ERP do Supabase:', err);
      } finally {
        setErpLoading(false);
      }
    };
    load();
  }, []);

  // ── localStorage persistence for items without a Supabase table yet ──
  React.useEffect(() => {
    localStorage.setItem('erp_requests', JSON.stringify(erpRequests));
  }, [erpRequests]);

  React.useEffect(() => {
    localStorage.setItem('erp_tools', JSON.stringify(erpTools));
  }, [erpTools]);

  // ── Derived ───────────────────────────────────────────────
  const workflowOperations = React.useMemo(() =>
    erpProjects.flatMap(project =>
      project.bom.flatMap(item =>
        item.operations.map(operation => ({
          projectId: project.id,
          project: project.reference,
          operationId: operation.id,
          operation: operation.name,
          workCenter: operation.workCenter,
          operator: operation.operator,
          status: operation.status,
        }))
      )
    ),
    [erpProjects]
  );

  // ── Project handlers ──────────────────────────────────────
  const handleSaveProject = async (updatedProj: MatrixProject) => {
    setErpProjects(prev => upsertById(prev, updatedProj));
    if (isSupabaseConfigured) {
      try { await syncSaveErpProject(updatedProj); }
      catch (err) { console.error('Erro ao salvar projeto:', err); showToast('Erro ao salvar projeto no banco.', 'error'); }
    }
  };

  const handleDeleteProject = async (id: string) => {
    setErpProjects(prev => prev.filter(p => p.id !== id));
    if (isSupabaseConfigured) {
      try { await syncDeleteErpProject(id); }
      catch (err) { console.error('Erro ao excluir projeto:', err); }
    }
    showToast('Projeto de molde removido.', 'info');
  };

  const handleAssignOperation = (projectId: string, operationId: string, employeeName: string, machineName: string) => {
    setErpProjects(projects => {
      const updated = projects.map(project => project.id !== projectId ? project : {
        ...project,
        bom: project.bom.map(item => ({
          ...item,
          operations: item.operations.map(operation => operation.id === operationId
            ? { ...operation, operator: employeeName, workCenter: machineName }
            : operation
          ),
        })),
      });
      // Persist the changed project to Supabase
      const changed = updated.find(p => p.id === projectId);
      if (changed && isSupabaseConfigured) {
        syncSaveErpProject(changed).catch(err => console.error('Erro ao salvar operação:', err));
      }
      return updated;
    });
  };

  // ── Raw stock handlers ────────────────────────────────────
  const handleSaveRawStockItem = async (item: RawMaterialStock) => {
    setErpRawStock(prev => upsertById(prev, item));
    if (isSupabaseConfigured) {
      try { await syncSaveRawStockItem(item); }
      catch (err) { console.error('Erro ao salvar estoque:', err); showToast('Erro ao salvar item de estoque.', 'error'); }
    }
  };

  const handleDeleteRawStockItem = async (id: string) => {
    setErpRawStock(prev => prev.filter(i => i.id !== id));
    if (isSupabaseConfigured) {
      try { await syncDeleteRawStockItem(id); }
      catch (err) { console.error('Erro ao excluir item de estoque:', err); }
    }
  };

  // ── Inspection handlers ───────────────────────────────────
  const handleSaveInspection = async (inspection: QualityInspection) => {
    setErpAudits(prev => upsertById(prev, inspection));
    if (isSupabaseConfigured) {
      try { await syncSaveInspection(inspection); }
      catch (err) { console.error('Erro ao salvar inspeção:', err); showToast('Erro ao salvar inspeção.', 'error'); }
    }
  };

  const handleDeleteInspection = async (id: string) => {
    setErpAudits(prev => prev.filter(i => i.id !== id));
    if (isSupabaseConfigured) {
      try { await syncDeleteInspection(id); }
      catch (err) { console.error('Erro ao excluir inspeção:', err); }
    }
  };

  // ── RNC handlers ──────────────────────────────────────────
  const handleSaveRnc = async (rnc: NonConformance) => {
    setErpRncs(prev => upsertById(prev, rnc));
    if (isSupabaseConfigured) {
      try { await syncSaveNonConformance(rnc); }
      catch (err) { console.error('Erro ao salvar RNC:', err); showToast('Erro ao salvar não-conformidade.', 'error'); }
    }
  };

  const handleDeleteRnc = async (id: string) => {
    setErpRncs(prev => prev.filter(r => r.id !== id));
    if (isSupabaseConfigured) {
      try { await syncDeleteNonConformance(id); }
      catch (err) { console.error('Erro ao excluir RNC:', err); }
    }
  };

  // ── Milestone handlers ────────────────────────────────────
  const handleSaveMilestone = async (milestone: BillingMilestone) => {
    setErpMilestones(prev => upsertById(prev, milestone));
    if (isSupabaseConfigured) {
      try { await syncSaveMilestone(milestone); }
      catch (err) { console.error('Erro ao salvar marco:', err); showToast('Erro ao salvar marco de faturamento.', 'error'); }
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    setErpMilestones(prev => prev.filter(m => m.id !== id));
    if (isSupabaseConfigured) {
      try { await syncDeleteMilestone(id); }
      catch (err) { console.error('Erro ao excluir marco:', err); }
    }
  };

  // ── Transaction handlers ──────────────────────────────────
  const handleSaveTransaction = async (transaction: CashTransaction) => {
    setErpTransactions(prev => upsertById(prev, transaction));
    if (isSupabaseConfigured) {
      try { await syncSaveTransaction(transaction); }
      catch (err) { console.error('Erro ao salvar transação:', err); showToast('Erro ao salvar lançamento financeiro.', 'error'); }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setErpTransactions(prev => prev.filter(t => t.id !== id));
    if (isSupabaseConfigured) {
      try { await syncDeleteTransaction(id); }
      catch (err) { console.error('Erro ao excluir transação:', err); }
    }
  };

  // ── Purchase request handlers (localStorage) ───────────────
  const handleSavePurchaseRequest = (req: PurchaseRequest) => {
    setErpRequests(prev => upsertById(prev, req));
  };

  const handleDeletePurchaseRequest = (id: string) => {
    setErpRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleTriggerPurchaseRequest = (projId: string, itemType: string, desc: string, qty: number) => {
    const proj = erpProjects.find(p => p.id === projId);
    const newReq: PurchaseRequest = {
      id: `req_${Date.now()}`,
      projectId: projId,
      projectName: proj ? proj.reference : 'Geral',
      itemType: itemType as PurchaseRequest['itemType'],
      description: desc,
      qty,
      status: 'pending_quote',
    };
    setErpRequests(prev => [newReq, ...prev]);
    showToast(`Solicitação de compra gerada para ${desc}!`, 'success');
  };

  // ── Maintenance log handlers ──────────────────────────────
  const handleSaveMaintenanceLog = async (log: MaintenanceLog) => {
    setErpMaintLogs(prev => upsertById(prev, log));
    if (isSupabaseConfigured) {
      try { await syncSaveMaintenanceLog(log); }
      catch (err) { console.error('Erro ao salvar log de manutenção:', err); showToast('Erro ao salvar log de manutenção.', 'error'); }
    }
  };

  const handleDeleteMaintenanceLog = async (id: string) => {
    setErpMaintLogs(prev => prev.filter(l => l.id !== id));
    if (isSupabaseConfigured) {
      try { await syncDeleteMaintenanceLog(id); }
      catch (err) { console.error('Erro ao excluir log de manutenção:', err); }
    }
  };

  // ─────────────────────────────────────────────────────────
  const value: ErpContextValue = {
    erpProjects, erpRawStock, erpAudits, erpRncs,
    erpMilestones, erpTransactions, erpRequests, erpMaintLogs, erpTools, erpLoading,

    handleSaveProject, handleDeleteProject, handleAssignOperation,

    handleSaveRawStockItem, handleDeleteRawStockItem, setErpRawStock,

    handleSaveInspection, handleDeleteInspection, setErpAudits,

    handleSaveRnc, handleDeleteRnc, setErpRncs,

    handleSaveMilestone, handleDeleteMilestone, setErpMilestones,

    handleSaveTransaction, handleDeleteTransaction, setErpTransactions,

    handleSavePurchaseRequest, handleDeletePurchaseRequest,
    setErpRequests, handleTriggerPurchaseRequest,

    handleSaveMaintenanceLog, handleDeleteMaintenanceLog, setErpMaintLogs,

    setErpTools,

    workflowOperations,
  };

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}
