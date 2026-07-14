/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  DEFAULT_CONFIG, 
  DEFAULT_THIRD_PARTY_ITEMS, 
  DEFAULT_INTERNAL_SERVICES,
  DEFAULT_RAW_MATERIALS
} from './constants';
import { 
  MaterialItem, 
  ThirdPartyItem, 
  InternalServiceItem, 
  ConfigParams, 
  BudgetDraft,
  Client,
  RawMaterial,
  MachiningType,
  UserProfile,
  ProductionStage,
  MatrixProject,
  RawMaterialStock,
  StandardComponentStock,
  QualityInspection,
  NonConformance,
  BillingMilestone,
  CashTransaction,
  PurchaseRequest,
  MaintenanceLog,
  ProposalItem,
  CommercialTerms
} from './types';
import { 
  generateDefaultMaterials, 
  generateZeroMaterials,
  updateAutomaticPlates, 
  calculateTotals, 
  calculatePlateCost,
  getCommercialBudgetValue
} from './utils/calculations';
import { generateBudgetPDF } from './utils/pdfGenerator';
import { 
  isSupabaseConfigured,
  syncFetchClients,
  syncSaveClient,
  syncDeleteClient,
  syncFetchMaterials,
  syncSaveRawMaterials,
  syncFetchServices,
  syncSaveServices,
  syncFetchMachiningTypes,
  syncSaveMachiningTypes,
  syncFetchStandardComponents,
  syncSaveStandardComponents,
  syncFetchBudgets,
  syncSaveBudget,
  syncDeleteBudget,
  supabase,
  signOutUser,
  getCurrentUserProfile,
  fetchProfiles,
  updateProfile
} from './lib/supabase';

// Components
import LoginScreen from './components/LoginScreen';
import OrganizationAdminScreen from './components/OrganizationAdminScreen';
import MoldInputs from './components/MoldInputs';
import MaterialsTable from './components/MaterialsTable';
import ThirdPartyTable from './components/ThirdPartyTable';
import InternalServicesTable from './components/InternalServicesTable';
import MachiningTimesTable from './components/MachiningTimesTable';
import QuoteSummary from './components/QuoteSummary';
import CommercialProposalEditor from './components/CommercialProposalEditor';
import SettingsModal from './components/SettingsModal';
import BudgetList from './components/BudgetList';
import ClientsDatabase from './components/ClientsDatabase';

// ERP Integrated Modules
import Modulo2Engenharia from './components/Modulo2Engenharia';
import Modulo3PCP from './components/Modulo3PCP';
import Modulo4Estoque from './components/Modulo4Estoque';
import Modulo5ChaoDeFabrica from './components/Modulo5ChaoDeFabrica';
import Modulo6Qualidade from './components/Modulo6Qualidade';
import Modulo7Custos from './components/Modulo7Custos';
import Modulo8Financeiro from './components/Modulo8Financeiro';
import Modulo9Compras from './components/Modulo9Compras';
import Modulo10Manutencao from './components/Modulo10Manutencao';
import Modulo11BI from './components/Modulo11BI';
import ModuloRH from './components/ModuloRH';
import SuppliersModule from './components/SuppliersModule';
import IndustrialProjectsModule from './components/IndustrialProjectsModule';
import PurchasingModule from './components/PurchasingModule';
import { approveBudgetToProject } from './lib/industrial';
import { loadOrganizationSettings, saveOrganizationSettings } from './lib/settings';

// Icons
import {
  Plus,
  FolderOpen,
  Save,
  RotateCcw,
  Settings,
  FileDown,
  HelpCircle,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Ruler,
  Layers,
  Briefcase,
  Eye,
  ChevronRight,
  ChevronLeft,
  Users,
  Trash2,
  FileText,
  Check,
  LogOut,
  Clock,
  Link,
  X,
  Copy,
  Shield,
  Activity,
  Building,
  Building2,
  ChevronDown,
  DollarSign,
  LayoutDashboard,
  Calculator,
  Contact,
  FolderKanban,
  CalendarRange,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Factory,
  ShieldCheck,
  PieChart,
  Landmark,
  Wrench,
  IdCard,
  Truck,
  KeyRound,
  GanttChartSquare
} from 'lucide-react';

function generateNextReference(existingDrafts: BudgetDraft[]): string {
  const currentYear = new Date().getFullYear();
  const yearSuffix = `/${currentYear}`;
  const usedNumbers = new Set(
    existingDrafts
      .filter(draft => draft.reference?.endsWith(yearSuffix))
      .map(draft => Number.parseInt(draft.reference!.split('/')[0], 10))
      .filter(number => Number.isInteger(number) && number > 0),
  );

  // Keep the sequence continuous: reuse the first available gap instead of
  // always using the highest reference plus one.
  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) nextNumber += 1;
  return `${String(nextNumber).padStart(4, '0')}${yearSuffix}`;
}

function createDefaultCommercialTerms(): CommercialTerms {
  return {
    scope: `Molde Ref. (Cliente fornece)
Porta Molde em Aço 1045/ Cavidades em Aço 1045.
Acabamento polido funcional
Injeção Lateral da peça.
Extração por pino extrator.
Cliente fornece produto 3D.
Cliente fornece O.C.
Incluso:
   Projeto 3D da matriz
   Todo processo de fabricação (compra de material, insumos, usinagem, tornearia, retífica, erosão, montagem, acabamento)
   Informações complementares estão sujeitas a alteração de valor (ponto de injeção, altura molde, etc)`,
    validityDays: 10,
    paymentTerms: 'Entrada 50% pedido / Saldo na entrega do molde',
    freightTerms: 'FOB',
    billingSchedule: [
      { id: 'billing_signal', description: 'Sinal na aprovação comercial', percent: 40, dueDays: 0 },
      { id: 'billing_delivery', description: 'Saldo na entrega técnica', percent: 60, dueDays: 0 },
    ],
  };
}

/** Value actually presented to the customer: all consolidated technical items. */
function normalizePermissions(source: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean }>) {
  const map: Record<string, string> = { Comercial: 'comercial', Engenharia: 'engenharia', PCP: 'pcp', Produção: 'producao', Almoxarifado: 'estoque', Compras: 'compras', Qualidade: 'qualidade', Controladoria: 'controladoria', Financeiro: 'financeiro', Manutenção: 'manutencao', BI: 'bi' };
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [map[key] || key.toLowerCase(), value]));
}

function displayPermissions(source: Record<string, any>) {
  const map: Record<string, string> = { comercial: 'Comercial', engenharia: 'Engenharia', pcp: 'PCP', producao: 'Produção', estoque: 'Almoxarifado', compras: 'Compras', qualidade: 'Qualidade', controladoria: 'Controladoria', financeiro: 'Financeiro', manutencao: 'Manutenção', bi: 'BI', rh: 'RH' };
  return Object.fromEntries(Object.entries(source || {}).map(([key, value]) => [map[key] || key, value]));
}

/* Professional sidebar navigation item with an icon chip + clear active state. */
function SidebarNavItem({
  icon,
  label,
  hint,
  view,
  activeView,
  onNavigate,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  view: string;
  activeView: string;
  onNavigate: (view: string) => void;
}) {
  const active = activeView === view;
  return (
    <button
      type="button"
      onClick={() => onNavigate(view)}
      aria-label={hint || label}
      aria-current={active ? 'page' : undefined}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold leading-tight transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-[var(--ax-accent)]/10 text-[var(--ax-accent)] shadow-md ring-1 ring-[var(--ax-accent)]/30'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
          active
            ? 'border-[var(--ax-accent)]/40 bg-[var(--ax-accent)]/15 text-[var(--ax-accent)]'
            : 'border-white/5 bg-white/[0.03] text-slate-400 group-hover:bg-white/[0.06] group-hover:text-slate-200'
        }`}
      >
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="block px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </span>
      {children}
    </div>
  );
}

export default function App() {
  // Navigation & View Mode for the Axemet CRM & budgeting flow
  const [appView, setAppView] = React.useState<'home' | 'editor' | 'details' | 'clientes' | 'crm' | 'producao' | 'projetos' | 'acessos' | 'organizacao' | 'rh' | 'fornecedores' | 'modulo2' | 'modulo3' | 'modulo4' | 'modulo5' | 'modulo6' | 'modulo7' | 'modulo8' | 'modulo9' | 'modulo10' | 'modulo11'>('modulo11');

  // --- INTEGRATED ERP 11-MODULE STATES ---
  const [erpProjects, setErpProjects] = React.useState<MatrixProject[]>(() => {
    const saved = localStorage.getItem('erp_projects');
    let loaded: any[] | null = null;
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    // Production starts with the company's own records. Demo projects are never loaded automatically.
    const targetList = Array.isArray(loaded) ? loaded : [];

    // Smart migration for backward compatibility
    return targetList.map((p: any) => {
      // Check status validity
      let validStatus = p.status;
      if (validStatus === 'in_progress') validStatus = 'production';
      if (validStatus === 'try_out') validStatus = 'tryout';
      if (!['planning', 'production', 'tryout', 'delivered', 'warranty', 'completed'].includes(validStatus)) {
        validStatus = 'production';
      }

      // Convert bom
      const rawBom = Array.isArray(p.bom) ? p.bom : [];
      const migratedBom = rawBom.map((b: any) => {
        const name = b.name || b.partName || 'Item da BOM';
        const operations = Array.isArray(b.operations) ? b.operations : [];
        const source = b.source || (b.catalog || b.catalogCode ? 'standard' : 'internal');
        const qty = typeof b.qty === 'number' ? b.qty : 1;
        const status = b.status || 'pending';
        return {
          ...b,
          id: b.id || `bom_${Date.now()}_${Math.random()}`,
          name,
          qty,
          source,
          status,
          operations: operations.map((op: any) => ({
            ...op,
            id: op.id || `op_${Date.now()}_${Math.random()}`,
            bomItemId: op.bomItemId || b.id,
            name: op.name || op.process || 'Operação',
            workCenter: op.workCenter || op.machine || 'Geral',
            setupTime: typeof op.setupTime === 'number' ? op.setupTime : (op.hoursPlanned ? op.hoursPlanned * 10 : 30),
            cycleTime: typeof op.cycleTime === 'number' ? op.cycleTime : (op.hoursPlanned ? op.hoursPlanned * 50 : 60),
            queueTime: typeof op.queueTime === 'number' ? op.queueTime : 1,
            tools: Array.isArray(op.tools) ? op.tools : [],
            status: op.status || 'pending'
          }))
        };
      });

      return {
        id: p.id || `p_${Date.now()}_${Math.random()}`,
        reference: p.reference || '0000/2026',
        clientName: p.clientName || 'Cliente Geral',
        moldDescription: p.moldDescription || 'Descrição do Molde',
        moldType: p.moldType || 'Injeção Termoplástica',
        moldingMaterial: p.moldingMaterial || 'PP',
        productQuantity: p.productQuantity || 10000,
        deliveryTime: p.deliveryTime || '45 dias',
        status: validStatus,
        date: p.date || '2026-07-01',
        moldWidth: p.moldWidth || 400,
        moldLength: p.moldLength || 400,
        subprojects: Array.isArray(p.subprojects) ? p.subprojects : [],
        bom: migratedBom,
        revisions: Array.isArray(p.revisions) ? p.revisions : [],
        costs: p.costs || { orçado: 50000, real: 0, detalhado: { materials: 0, normalizados: 0, horasMaquina: 0, maoDeObra: 0, terceiros: 0, refugo: 0 } },
        documents: Array.isArray(p.documents) ? p.documents : []
      };
    });
  });

  const [erpRawStock, setErpRawStock] = React.useState<RawMaterialStock[]>(() => {
    const saved = localStorage.getItem('erp_raw_stock');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [erpStdStock, setErpStdStock] = React.useState<StandardComponentStock[]>(() => {
    const saved = localStorage.getItem('erp_std_stock');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [erpAudits, setErpAudits] = React.useState<QualityInspection[]>(() => {
    const saved = localStorage.getItem('erp_audits');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [erpRncs, setErpRncs] = React.useState<NonConformance[]>(() => {
    const saved = localStorage.getItem('erp_rncs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [erpMilestones, setErpMilestones] = React.useState<BillingMilestone[]>(() => {
    const saved = localStorage.getItem('erp_milestones');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [erpTransactions, setErpTransactions] = React.useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem('erp_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [erpRequests, setErpRequests] = React.useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem('erp_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [erpMaintLogs, setErpMaintLogs] = React.useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem('erp_maint_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // Automatically persist ERP states
  React.useEffect(() => {
    localStorage.setItem('erp_projects', JSON.stringify(erpProjects));
  }, [erpProjects]);

  React.useEffect(() => {
    localStorage.setItem('erp_raw_stock', JSON.stringify(erpRawStock));
  }, [erpRawStock]);

  React.useEffect(() => {
    localStorage.setItem('erp_std_stock', JSON.stringify(erpStdStock));
  }, [erpStdStock]);

  React.useEffect(() => {
    localStorage.setItem('erp_audits', JSON.stringify(erpAudits));
  }, [erpAudits]);

  React.useEffect(() => {
    localStorage.setItem('erp_rncs', JSON.stringify(erpRncs));
  }, [erpRncs]);

  React.useEffect(() => {
    localStorage.setItem('erp_milestones', JSON.stringify(erpMilestones));
  }, [erpMilestones]);

  React.useEffect(() => {
    localStorage.setItem('erp_transactions', JSON.stringify(erpTransactions));
  }, [erpTransactions]);

  React.useEffect(() => {
    localStorage.setItem('erp_requests', JSON.stringify(erpRequests));
  }, [erpRequests]);

  React.useEffect(() => {
    localStorage.setItem('erp_maint_logs', JSON.stringify(erpMaintLogs));
  }, [erpMaintLogs]);

  // --- ERP STATE HANDLERS ---
  const [erpTools, setErpTools] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('erp_tools');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  React.useEffect(() => {
    localStorage.setItem('erp_tools', JSON.stringify(erpTools));
  }, [erpTools]);

  // The Google AI Studio prototype persisted illustrative records in each browser.
  // They are not operational data and must never reappear in a production workspace.
  // Real records now live in Supabase; this one-time migration clears only legacy keys.
  React.useEffect(() => {
    const cleanupKey = 'axemet_legacy_demo_cleanup_v1';
    if (localStorage.getItem(cleanupKey) === 'done') return;

    [
      'erp_projects', 'erp_raw_stock', 'erp_std_stock', 'erp_audits', 'erp_rncs',
      'erp_milestones', 'erp_transactions', 'erp_requests', 'erp_maint_logs', 'erp_tools',
      'orcamolde_drafts', 'orcamolde_clients', 'orcamolde_raw_materials',
      'orcamolde_machining_types', 'orcamolde_internal_services', 'orcamolde_third_party_items',
    ].forEach((key) => localStorage.removeItem(key));

    setErpProjects([]);
    setErpRawStock([]);
    setErpStdStock([]);
    setErpAudits([]);
    setErpRncs([]);
    setErpMilestones([]);
    setErpTransactions([]);
    setErpRequests([]);
    setErpMaintLogs([]);
    setErpTools([]);
    localStorage.setItem(cleanupKey, 'done');
  }, []);

  const handleSaveProject = (updatedProj: MatrixProject) => {
    setErpProjects(prev => {
      const exists = prev.some(p => p.id === updatedProj.id);
      if (exists) {
        return prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      } else {
        return [updatedProj, ...prev];
      }
    });
  };

  const workflowOperations = React.useMemo(() => erpProjects.flatMap(project =>
    project.bom.flatMap(item => item.operations.map(operation => ({
      projectId: project.id,
      project: project.reference,
      operationId: operation.id,
      operation: operation.name,
      workCenter: operation.workCenter,
      operator: operation.operator,
      status: operation.status,
    })))
  ), [erpProjects]);

  const handleAssignOperation = (projectId: string, operationId: string, employeeName: string, machineName: string) => {
    setErpProjects(projects => projects.map(project => project.id !== projectId ? project : {
      ...project,
      bom: project.bom.map(item => ({
        ...item,
        operations: item.operations.map(operation => operation.id === operationId ? {
          ...operation,
          operator: employeeName,
          workCenter: machineName,
        } : operation),
      })),
    }));
  };

  const handleDeleteProject = (id: string) => {
    setErpProjects(prev => prev.filter(p => p.id !== id));
    showToast('Projeto de molde removido.', 'info');
  };

  const handleTriggerPurchaseRequest = (projId: string, itemType: string, desc: string, qty: number) => {
    const proj = erpProjects.find(p => p.id === projId);
    const newReq = {
      id: `req_${Date.now()}`,
      projectId: projId,
      projectName: proj ? proj.reference : 'Geral',
      itemType: itemType as any,
      description: desc,
      qty,
      status: 'pending_quote' as const
    };
    setErpRequests(prev => [newReq, ...prev]);
    showToast(`Solicitação de compra gerada para ${desc}!`, 'success');
  };

  // User Authentication State
  // Access is granted exclusively by Supabase Auth and an active database profile.
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [forceRecoveryScreen, setForceRecoveryScreen] = React.useState(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return query.get('recovery') === '1' || hash.get('type') === 'recovery';
  });
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [profilesList, setProfilesList] = React.useState<UserProfile[]>([]);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [accessBlockedMsg, setAccessBlockedMsg] = React.useState<string | null>(null);
  
  // Supabase Database initialization checks
  const [isSupabaseSchemaMissing, setIsSupabaseSchemaMissing] = React.useState(false);
  const [showSchemaGuide, setShowSchemaGuide] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // States for user permissions and collaborator CRUD
  const [isUserFormOpen, setIsUserFormOpen] = React.useState(false);
  const [selectedProfileForEdit, setSelectedProfileForEdit] = React.useState<any | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [formPhone, setFormPhone] = React.useState('');
  const [formRole, setFormRole] = React.useState<'admin' | 'manager' | 'operator' | 'viewer'>('viewer');
  const [formStatus, setFormStatus] = React.useState<'active' | 'pending' | 'inactive'>('pending');
  const [formSector, setFormSector] = React.useState('');
  const [formOrg, setFormOrg] = React.useState('');
  const [formPermissions, setFormPermissions] = React.useState<Record<string, { view: boolean, create: boolean, edit: boolean, delete: boolean, approve: boolean }>>({
    'Comercial': { view: true, create: true, edit: false, delete: false, approve: false },
    'Engenharia': { view: true, create: false, edit: false, delete: false, approve: false },
    'PCP': { view: true, create: false, edit: false, delete: false, approve: false },
    'Produção': { view: true, create: false, edit: false, delete: false, approve: false },
    'Almoxarifado': { view: true, create: false, edit: false, delete: false, approve: false },
    'Compras': { view: true, create: false, edit: false, delete: false, approve: false },
    'Qualidade': { view: true, create: false, edit: false, delete: false, approve: false },
    'Controladoria': { view: true, create: false, edit: false, delete: false, approve: false },
    'Financeiro': { view: true, create: false, edit: false, delete: false, approve: false },
    'Manutenção': { view: true, create: false, edit: false, delete: false, approve: false },
    'BI': { view: true, create: false, edit: false, delete: false, approve: false },
  });
  
  const handleCopySQL = () => {
    navigator.clipboard.writeText('Use as migrações versionadas na pasta supabase/migrations. Não execute scripts de demonstração ou cópias antigas.');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadUserProfile = async (userId: string, email: string) => {
    setProfileLoading(true);
    setAccessBlockedMsg(null);
    try {
      const profile = await getCurrentUserProfile(userId);
      if (profile) {
        if (profile.status === 'active') {
          setUserProfile(profile);
          setIsLoggedIn(true);
        } else {
          // Block access
          setIsLoggedIn(false);
          setCurrentUser(null);
          setUserProfile(null);
          sessionStorage.removeItem('mm_logged_in');
          if (profile.status === 'pending') {
            setAccessBlockedMsg('Seu cadastro está pendente de aprovação pelo Administrador da Axemet Solution.');
          } else {
            setAccessBlockedMsg('Seu acesso foi desativado pelo Administrador da Axemet Solution.');
          }
          await signOutUser();
        }
      } else {
        // If profile was not created automatically by the trigger yet
        // we can create a pending profile row manually
        try {
          const newProfile = await updateProfile(userId, {
            full_name: email.split('@')[0],
            role: 'viewer',
            status: 'pending',
            organization: 'Organização Cliente'
          });
          setAccessBlockedMsg('Seu cadastro foi realizado com sucesso e está aguardando aprovação pelo Administrador.');
          await signOutUser();
        } catch (err) {
          // Fallback if profiles table doesn't exist
          setIsSupabaseSchemaMissing(true);
          setShowSchemaGuide(true);
          setIsLoggedIn(false);
          setAccessBlockedMsg('Não foi possível validar seu perfil. Contate o administrador.');
        }
      }
    } catch (e) {
      console.error('Erro ao processar perfil:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  React.useEffect(() => {
    if (isSupabaseConfigured) {
      // Check active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser(session.user);
          loadUserProfile(session.user.id, session.user.email || '');
        }
      });

      // Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          loadUserProfile(session.user.id, session.user.email || '');
        } else {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setUserProfile(null);
          sessionStorage.removeItem('mm_logged_in');
          localStorage.removeItem('mm_logged_in');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Active Tab state inside editor
  const [activeTab, setActiveTab] = React.useState<'dados' | 'materiais' | 'tempos' | 'terceiros' | 'servicos' | 'resumo'>('dados');

  // Client registry list
  const [clients, setClients] = React.useState<Client[]>([]);

  // Raw Materials state
  const [rawMaterials, setRawMaterials] = React.useState<RawMaterial[]>([]);

  // Reference Code State
  const [reference, setReference] = React.useState('');

  // Client & Mold State
  const [clientName, setClientName] = React.useState('');
  const [contactName, setContactName] = React.useState('');
  const [moldType, setMoldType] = React.useState('');
  const [moldingMaterial, setMoldingMaterial] = React.useState('');
  const [productQuantity, setProductQuantity] = React.useState<number>(0);
  const [deliveryTime, setDeliveryTime] = React.useState('');
  const [observations, setObservations] = React.useState('');
  const [status, setStatus] = React.useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');
  const [moldDescription, setMoldDescription] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [moldWidth, setMoldWidth] = React.useState(0);
  const [moldLength, setMoldLength] = React.useState(0);

  // A registered client is the source of truth for the commercial contact.
  // The field remains editable for an exceptional proposal, but never needs
  // to be retyped when the client is selected or matched by name.
  React.useEffect(() => {
    const selected = clients.find(client => client.name.trim().toLocaleLowerCase() === clientName.trim().toLocaleLowerCase());
    if (selected?.responsible) setContactName(selected.responsible);
  }, [clientName, clients]);

  // Negotiation Discounts
  const [discountPercent, setDiscountPercent] = React.useState<number>(0);
  const [discountValue, setDiscountValue] = React.useState<number>(0);
  const [proposalItems, setProposalItems] = React.useState<ProposalItem[]>([]);
  const [commercialTerms, setCommercialTerms] = React.useState<CommercialTerms>(createDefaultCommercialTerms);

  // Configuration State
  const [config, setConfig] = React.useState<ConfigParams>({ ...DEFAULT_CONFIG });

  // Items State
  const [materials, setMaterials] = React.useState<MaterialItem[]>([]);
  const [thirdPartyItems, setThirdPartyItems] = React.useState<ThirdPartyItem[]>([]);
  const [internalServices, setInternalServices] = React.useState<InternalServiceItem[]>([]);

  // Machining Types State
  const [machiningTypes, setMachiningTypes] = React.useState<MachiningType[]>(() => {
    const defaultTypes: MachiningType[] = [];
    const saved = localStorage.getItem('orcamolde_machining_types');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If some of the default items are missing, merge them so user gets new defaults
          const existingIds = new Set(parsed.map((item: any) => item.id));
          const toAdd = defaultTypes.filter(d => !existingIds.has(d.id));
          if (toAdd.length > 0) {
            const merged = [...parsed, ...toAdd];
            localStorage.setItem('orcamolde_machining_types', JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      } catch (e) {
        console.error('Erro ao carregar tipos de usinagem', e);
      }
    }
    return defaultTypes;
  });

  // Modals Visibility
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  // Drafts History State
  const [drafts, setDrafts] = React.useState<BudgetDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = React.useState<string | null>(null);
  const [editingProposalItemId, setEditingProposalItemId] = React.useState<string | null>(null);
  const [approvalDraft, setApprovalDraft] = React.useState<BudgetDraft | null>(null);
  const [approvalProjectCode, setApprovalProjectCode] = React.useState('');
  const [approvalDueDate, setApprovalDueDate] = React.useState('');

  // Home Screen Search & Filters State
  const [homeSearchTerm, setHomeSearchTerm] = React.useState('');
  const [homeFilterStatus, setHomeFilterStatus] = React.useState<string>('all');
  const [homeFilterClient, setHomeFilterClient] = React.useState<string>('all');
  const [confirmDeleteDraftId, setConfirmDeleteDraftId] = React.useState<string | null>(null);

  // Toast / Alerts notification state
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Trigger auto toast dismissal
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
  };

  const canOpenView = React.useCallback((view: string) => {
    if (!userProfile || userProfile.role === 'admin' || userProfile.role === 'manager') return true;
    const moduleByView: Record<string, string> = { home: 'comercial', editor: 'comercial', details: 'comercial', clientes: 'comercial', crm: 'comercial', fornecedores: 'compras', projetos: 'producao', producao: 'producao', modulo2: 'engenharia', modulo3: 'pcp', modulo4: 'estoque', modulo5: 'producao', modulo6: 'qualidade', modulo7: 'controladoria', modulo8: 'financeiro', modulo9: 'compras', modulo10: 'manutencao', rh: 'rh' };
    const module = moduleByView[view];
    return !module || !!userProfile.permissions?.[module]?.view;
  }, [userProfile]);

  React.useEffect(() => {
    if (isLoggedIn && !canOpenView(appView)) {
      setAppView('modulo11');
      showToast('Você não possui permissão para acessar este módulo.', 'error');
    }
  }, [appView, canOpenView, isLoggedIn]);

  const handleLoginAttempt = (): boolean => false;

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await signOutUser();
      } catch (e) {
        console.error('Erro ao encerrar sessão no Supabase:', e);
      }
    }
    setIsLoggedIn(false);
    sessionStorage.removeItem('mm_logged_in');
    localStorage.removeItem('mm_logged_in');
    localStorage.removeItem('mm_remember_me');
    showToast('Sessão encerrada com segurança.', 'info');
  };

  // --- INITIALIZATION & PERSISTED CONFIGS ---
  React.useEffect(() => {
    async function loadInitialData() {
      // Load config from localStorage if it exists
      const savedConfig = localStorage.getItem('mold_config');
      let activeConfig = DEFAULT_CONFIG;
      if (savedConfig) {
        try {
          activeConfig = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
          setConfig(activeConfig);
        } catch (e) {
          console.error('Erro ao carregar configurações salvas', e);
        }
      }

      // With Supabase, data can only be read after Auth restores and validates the
      // user's active profile. Loading earlier returns an empty RLS-scoped list and
      // made saved budgets appear to disappear after a new login.
      if (isSupabaseConfigured && !isLoggedIn) return;

      if (isSupabaseConfigured) {
        try {
          showToast('Sincronizando com o Supabase...', 'info');
          
          let schemaMissing = false;
          const handleFetchError = (name: string, err: any) => {
            console.error(`${name} fetch error:`, err);
            if (err && (err.code === 'PGRST205' || (err.message && err.message.includes('Could not find the table')) || (err.message && err.message.includes('relation') && err.message.includes('does not exist')))) {
              schemaMissing = true;
            }
            return [];
          };

          const [dbClients, dbMaterials, dbMachiningTypes, dbServices, dbBudgets, dbConfig, dbStandardComponents] = await Promise.all([
            syncFetchClients().catch((err) => handleFetchError('Clients', err)),
            syncFetchMaterials().catch((err) => handleFetchError('Materials', err)),
            syncFetchMachiningTypes().catch((err) => handleFetchError('Machining types', err)),
            syncFetchServices().catch((err) => handleFetchError('Services', err)),
            syncFetchBudgets().catch((err) => handleFetchError('Budgets', err)),
            loadOrganizationSettings().catch((err) => handleFetchError('Organization settings', err)),
            syncFetchStandardComponents().catch((err) => handleFetchError('Standard components', err)),
          ]);

          if (schemaMissing) {
            setIsSupabaseSchemaMissing(true);
            showToast('As tabelas corporativas ainda não foram aplicadas no Supabase.', 'error');
            return;
          }

          const activeClients = dbClients;
          setClients(dbClients);
          activeConfig = { ...DEFAULT_CONFIG, ...dbConfig };
          setConfig(activeConfig);

          let activeRawMaterials = dbMaterials;
          if (activeRawMaterials.length === 0) activeRawMaterials = [];
          setRawMaterials(activeRawMaterials);

          if (dbMachiningTypes.length > 0) {
            setMachiningTypes(dbMachiningTypes);
          }

          setDrafts(dbBudgets);
          setErpStdStock(dbStandardComponents);

          const nextRef = generateNextReference(dbBudgets);
          setReference(nextRef);

          const initialMaterials = generateZeroMaterials(activeConfig, activeRawMaterials);
          setMaterials(initialMaterials);

          setThirdPartyItems([]);

          const initialServices = dbServices.map((item: any) => ({ ...item, qtd: 0, total: 0 }));
          setInternalServices(initialServices);

          showToast('Dados sincronizados com o Supabase!', 'success');
          return;
        } catch (e) {
          console.error('Falha na sincronização do Supabase:', e);
          showToast('Erro ao sincronizar com o Supabase. Nenhum dado local será usado.', 'error');
          return;
        }
      }

      // Fallback
      const savedDrafts = localStorage.getItem('mold_drafts');
      let loadedDrafts: BudgetDraft[] = [];
      if (savedDrafts) {
        try {
          loadedDrafts = JSON.parse(savedDrafts);
          setDrafts(loadedDrafts);
        } catch (e) {
          console.error('Erro ao carregar orçamentos salvos', e);
        }
      }

      const nextRef = generateNextReference(loadedDrafts);
      setReference(nextRef);

      const savedRawMaterials = localStorage.getItem('orcamolde_raw_materials');
      let loadedRawMaterials: RawMaterial[] = [];
      if (savedRawMaterials) {
        try {
          loadedRawMaterials = JSON.parse(savedRawMaterials);
          setRawMaterials(loadedRawMaterials);
        } catch (e) {
          console.error('Erro ao carregar matérias-primas salvas', e);
        }
      }

      const savedClients = localStorage.getItem('orcamolde_clients');
      if (savedClients) {
        try {
          setClients(JSON.parse(savedClients));
        } catch (e) {
          console.error('Erro ao carregar clientes', e);
        }
      } else setClients([]);

      const initialMaterials = generateZeroMaterials(activeConfig, loadedRawMaterials);
      setMaterials(initialMaterials);

      setThirdPartyItems([]);

      const savedRates = localStorage.getItem('orcamolde_service_rates');
      let loadedRates: any[] = [];
      if (savedRates) {
        try {
          loadedRates = JSON.parse(savedRates);
        } catch (e) {
          console.error('Erro ao carregar taxas de serviço salvas', e);
        }
      }

      const initialServices = loadedRates.map((item: any) => ({ ...item, qtd: 0, total: 0 }));
      setInternalServices(initialServices);

      showToast('Sistema carregado com sucesso. Molde padrão 250x250 configurado.', 'info');
    }

    loadInitialData();
  }, [isLoggedIn]);

  // Fetch profiles when Acessos tab is viewed
  React.useEffect(() => {
    if (appView === 'acessos') {
      if (isSupabaseConfigured && !isSupabaseSchemaMissing) {
        setProfileLoading(true);
        fetchProfiles()
          .then((profs) => {
            if (profs && profs.length > 0) {
              setProfilesList(profs);
            } else {
              setProfilesList([]);
            }
          })
          .catch((err) => {
            console.warn('Erro ao buscar perfis:', err);
            setProfilesList([]);
          })
          .finally(() => {
            setProfileLoading(false);
          });
      } else {
        setProfilesList([]);
      }
    }
  }, [appView, isSupabaseSchemaMissing]);

  // --- CLIENT DATABASE HANDLERS ---
  const handleAddClient = async (newClient: Client) => {
    try { await syncSaveClient(newClient); setClients(prev => [...prev, newClient]); showToast(`Cliente "${newClient.name}" cadastrado com sucesso!`, 'success'); }
    catch (e) { console.error('Erro ao salvar cliente no Supabase:', e); showToast('O cliente não foi salvo no banco.', 'error'); }
  };

  const handleDeleteClient = async (id: string) => {
    try { await syncDeleteClient(id); setClients(prev => prev.filter(c => c.id !== id)); showToast('Cliente excluído do banco de dados.'); }
    catch (e) { console.error('Erro ao deletar cliente no Supabase:', e); showToast('O cliente não foi excluído do banco.', 'error'); }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try { await syncSaveClient(updatedClient); setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c)); showToast(`Cliente "${updatedClient.name}" alterado com sucesso!`, 'success'); }
    catch (e) { console.error('Erro ao atualizar cliente no Supabase:', e); showToast('O cliente não foi atualizado no banco.', 'error'); }
  };

  const handleUpdateProfile = async (profileId: string, updates: Partial<UserProfile>) => {
    showToast('Atualizando permissões...', 'info');
    if (!isSupabaseConfigured) {
      showToast('Não é possível alterar acessos sem conexão com o Supabase.', 'error');
      return false;
    }
    try {
      const saved = await updateProfile(profileId, updates);
      setProfilesList(prev => prev.map(p => p.id === profileId ? { ...p, ...saved } : p));
      showToast('Perfil atualizado com sucesso!', 'success');
      return true;
    } catch (err) {
      console.error('Erro ao atualizar perfil no Supabase:', err);
      showToast('A alteração não foi salva. Verifique as permissões do administrador e tente novamente.', 'error');
      const profs = await fetchProfiles();
      setProfilesList(profs);
      return false;
    }
  };

  // --- REACTIVE PLATE UPDATES ---
  // Whenever width, length, or raw materials/prices change, recalculate the automatic plates
  React.useEffect(() => {
    if (materials.length > 0) {
      setMaterials(prev => updateAutomaticPlates(moldWidth, moldLength, prev, config, rawMaterials));
    }
  }, [moldWidth, moldLength, config, rawMaterials]);

  // --- SYNC MACHINING TIMES TO INTERNAL SERVICES ---
  // Whenever materials (containing machiningTimes) or machiningTypes configuration changes,
  // we automatically update the corresponding service item inside internalServices.
  React.useEffect(() => {
    setInternalServices(prevServices => {
      // 1. Sum up machining times per type across all plates
      const summedTimes: { [id: string]: number } = {};
      machiningTypes.forEach(mt => {
        summedTimes[mt.id] = 0;
      });

      materials.forEach(m => {
        if (m.machiningTimes) {
          Object.entries(m.machiningTimes).forEach(([mtId, hours]) => {
            if (summedTimes[mtId] !== undefined && typeof hours === 'number') {
              summedTimes[mtId] += hours;
            }
          });
        }
      });

      // 2. Separate manual and automated service items
      const machiningNames = new Set(machiningTypes.map(mt => mt.name.toLowerCase().trim()));
      const manualServices = prevServices.filter(s => !machiningNames.has(s.name.toLowerCase().trim()));

      // 3. Create or update services for current machining types
      const autoServices: InternalServiceItem[] = machiningTypes.map(mt => {
        const hours = summedTimes[mt.id] || 0;
        // See if we already have this service in prevServices
        const existing = prevServices.find(s => s.name.toLowerCase().trim() === mt.name.toLowerCase().trim());
        return {
          id: existing?.id || `srv_machining_${mt.id}`,
          name: mt.name,
          unit: 'h',
          valUnit: mt.hourlyRate,
          qtd: hours,
          total: hours * mt.hourlyRate
        };
      });

      return [...manualServices, ...autoServices];
    });
  }, [materials, machiningTypes]);

  // --- CALCULATE ALL TOTALS ON EACH RENDER ---
  const totals = calculateTotals(materials, thirdPartyItems, internalServices, config);
  const proposalTotal = proposalItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const closingPrice = proposalTotal > 0 ? proposalTotal : totals.finalPrice;
  const hasCompleteTechnicalMemory = proposalItems.length > 0 && proposalItems.every(item => item.technicalSnapshot?.totals);
  const summaryTotals = React.useMemo(() => {
    if (!hasCompleteTechnicalMemory) return totals;
    const aggregate = proposalItems.reduce((acc, item) => {
      const itemTotals = item.technicalSnapshot!.totals!;
      const quantity = Number(item.quantity) || 0;
      acc.materialsTotal += itemTotals.materialsTotal * quantity;
      acc.thirdPartyTotal += itemTotals.thirdPartyTotal * quantity;
      acc.internalTotal += itemTotals.internalTotal * quantity;
      acc.baseCost += itemTotals.baseCost * quantity;
      acc.costWithMultiplier += itemTotals.costWithMultiplier * quantity;
      return acc;
    }, { materialsTotal: 0, thirdPartyTotal: 0, internalTotal: 0, baseCost: 0, costWithMultiplier: 0 });
    const commissionAmount = closingPrice * (config.commission / 100);
    const taxAmount = closingPrice * (config.tax / 100);
    return {
      ...aggregate,
      totalBeforeTaxes: aggregate.costWithMultiplier,
      commissionAmount,
      taxAmount,
      finalPrice: closingPrice,
      effectiveMarkup: aggregate.baseCost > 0 ? closingPrice / aggregate.baseCost : 0,
    };
  }, [closingPrice, config.commission, config.tax, hasCompleteTechnicalMemory, proposalItems, totals]);

  const handleAddCurrentTechnicalItem = () => {
    if (!moldDescription.trim()) {
      showToast('Informe a descrição do molde antes de incorporar o cálculo técnico.', 'error');
      return;
    }
    const calculatedPrice = Math.max(0, totals.finalPrice - (discountValue || 0));
    if (calculatedPrice <= 0) {
      showToast('Conclua o orçamento técnico do item antes de incorporá-lo à proposta.', 'error');
      return;
    }
    const technicalSnapshot: Partial<BudgetDraft> = {
      reference, clientName, contactName, moldType, moldingMaterial, productQuantity, deliveryTime, observations, status,
      moldDescription, date, moldWidth, moldLength, materials, thirdPartyItems, internalServices, config,
      discountPercent, discountValue, totals, machiningTypes,
    };
    const calculatedItem: ProposalItem = {
      id: editingProposalItemId || `proposal_technical_${Date.now()}`,
      title: moldDescription.trim(),
      description: moldType.trim() || 'Ferramental sob encomenda',
      quantity: 1,
      unitPrice: calculatedPrice,
      sourceTechnicalReference: reference || 'Sem referência',
      technicalSnapshot,
    };
    setProposalItems(previous => editingProposalItemId ? previous.map(item => item.id === editingProposalItemId ? calculatedItem : item) : [...previous, calculatedItem]);
    setEditingProposalItemId(null);
    showToast(editingProposalItemId ? `Item “${moldDescription.trim()}” recalculado e atualizado na proposta.` : `Cálculo técnico de “${moldDescription.trim()}” incorporado à proposta consolidada.`, 'success');
  };

  const handleEditTechnicalProposalItem = (id: string) => {
    const item = proposalItems.find(current => current.id === id);
    const snapshot = item?.technicalSnapshot;
    if (!item || !snapshot) {
      showToast('Este item foi criado em uma versão anterior e não possui memória técnica para reabertura.', 'error');
      return;
    }
    setEditingProposalItemId(id);
    setClientName(snapshot.clientName || clientName);
    setContactName(snapshot.contactName || '');
    setMoldType(snapshot.moldType || '');
    setMoldingMaterial(snapshot.moldingMaterial || '');
    setProductQuantity(snapshot.productQuantity || 0);
    setDeliveryTime(snapshot.deliveryTime || '');
    setObservations(snapshot.observations || '');
    setStatus(snapshot.status || 'draft');
    setMoldDescription(snapshot.moldDescription || item.title || '');
    setDate(snapshot.date || new Date().toISOString().split('T')[0]);
    setMoldWidth(snapshot.moldWidth || 0);
    setMoldLength(snapshot.moldLength || 0);
    setMaterials(snapshot.materials || []);
    setThirdPartyItems(snapshot.thirdPartyItems || []);
    setInternalServices(snapshot.internalServices || []);
    if (snapshot.config) setConfig(snapshot.config);
    if (snapshot.machiningTypes) setMachiningTypes(snapshot.machiningTypes);
    setDiscountPercent(snapshot.discountPercent || 0);
    setDiscountValue(snapshot.discountValue || 0);
    setActiveTab('dados');
    showToast('Item reaberto. Edite todos os campos técnicos e clique em “Incorporar cálculo atual” para atualizar a proposta.', 'info');
  };

  const handlePrepareNextTechnicalItem = () => {
    setEditingProposalItemId(null);
    setMoldType('');
    setMoldingMaterial('');
    setProductQuantity(0);
    setMoldDescription('');
    setMoldWidth(0);
    setMoldLength(0);
    setDiscountPercent(0);
    setDiscountValue(0);
    setMaterials(generateZeroMaterials(config, rawMaterials));
    setThirdPartyItems([]);
    setInternalServices(previous => previous.map(item => ({ ...item, qtd: 0, total: 0 })));
    setActiveTab('dados');
    setTimeout(() => document.getElementById('client-name-input')?.focus(), 100);
    showToast('Próximo item técnico iniciado. O cliente e a proposta consolidada foram preservados.', 'info');
  };

  const machiningTotal = React.useMemo(() => {
    let sum = 0;
    materials.forEach(m => {
      if (m.machiningTimes) {
        Object.entries(m.machiningTimes).forEach(([mtId, hours]) => {
          if (typeof hours === 'number') {
            const mt = machiningTypes.find(t => t.id === mtId);
            if (mt) {
              sum += hours * mt.hourlyRate;
            }
          }
        });
      }
    });
    return sum;
  }, [materials, machiningTypes]);

  // --- HANDLERS ---

  // Materials Update
  const handleUpdateMaterial = (id: string, updated: Partial<MaterialItem>) => {
    setMaterials(prev =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // If manual changes are made to measurements, mark isAuto as false (or keep it if it's manual rows)
        const isAuto = updated.comp !== undefined || updated.larg !== undefined ? false : item.isAuto;

        const merged = { ...item, ...updated, isAuto };
        
        // Ensure standard material types map to appropriate config prices/densities
        if (updated.material) {
          const matInfo = rawMaterials.find(rm => rm.name === updated.material);
          if (matInfo) {
            merged.valKg = matInfo.pricePerKg;
            merged.dens = matInfo.density;
          }
        }

        // Recalculate total cost
        merged.total = calculatePlateCost(merged.comp, merged.larg, merged.esp, merged.qtd, merged.dens, merged.valKg);
        return merged;
      })
    );
  };

  // Add Custom Material Plate
  const handleAddMaterial = (newItem: MaterialItem) => {
    setMaterials(prev => [...prev, newItem]);
    showToast(`Item "${newItem.name}" adicionado com sucesso!`);
  };

  // Delete Material Plate
  const handleDeleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(item => item.id !== id));
    showToast('Item de material removido com sucesso.', 'info');
  };

  // Update Machining Times for a Material Plate
  const handleUpdateMaterialTimes = (materialId: string, times: { [machiningTypeId: string]: number }) => {
    setMaterials(prev =>
      prev.map(m => (m.id === materialId ? { ...m, machiningTimes: times } : m))
    );
  };

  // Clear All Machining Times
  const handleClearAllMachiningTimes = () => {
    setMaterials(prev =>
      prev.map(m => ({ ...m, machiningTimes: {} }))
    );
    showToast('Todos os tempos de usinagem foram zerados.');
  };

  // Add Custom Internal Service
  const handleAddInternalService = (newItem: InternalServiceItem) => {
    setInternalServices(prev => [...prev, newItem]);
    showToast(`Atividade "${newItem.name}" adicionada com sucesso!`);
  };

  // Delete Internal Service
  const handleDeleteInternalService = (id: string) => {
    setInternalServices(prev => prev.filter(item => item.id !== id));
    showToast('Atividade de serviço interno excluída com sucesso.', 'info');
  };

  // Third-party Update
  const handleUpdateThirdParty = (id: string, updated: Partial<ThirdPartyItem>) => {
    setThirdPartyItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleAddThirdParty = (newItem: { description: string; qtd: number; valUnit: number }) => {
    const id = `tp_custom_${Date.now()}`;
    setThirdPartyItems(prev => [
      ...prev,
      {
        id,
        description: newItem.description,
        qtd: newItem.qtd,
        valUnit: newItem.valUnit,
        total: newItem.qtd * newItem.valUnit,
      },
    ]);
    showToast(`Item "${newItem.description}" adicionado com sucesso.`);
  };

  const handleDeleteThirdParty = (id: string) => {
    setThirdPartyItems(prev => prev.filter(item => item.id !== id));
    showToast('Componente terceirizado removido.');
  };

  // Internal Services Update
  const handleUpdateInternalService = (id: string, updated: Partial<InternalServiceItem>) => {
    setInternalServices(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  // Save Config parameters
  const handleSaveConfig = async (newConfig: ConfigParams) => {
    try { await saveOrganizationSettings(newConfig); setConfig(newConfig); showToast('Configurações corporativas salvas e aplicadas.', 'success'); }
    catch (error:any) { showToast(error.message || 'Não foi possível salvar as configurações.', 'error'); }
  };

  const handleSaveServiceRates = async (newRates: InternalServiceItem[]) => {
    setInternalServices(previous => newRates.map(rate => {
      const existing = previous.find(item => item.id === rate.id) || previous.find(item => item.name.trim().toLowerCase() === rate.name.trim().toLowerCase());
      const qtd = existing?.qtd || 0;
      return { ...rate, qtd, total: qtd * rate.valUnit };
    }));
    localStorage.setItem('orcamolde_service_rates', JSON.stringify(newRates));
    if (isSupabaseConfigured) {
      try {
        await syncSaveServices(newRates);
      } catch (e) {
        console.error('Erro ao salvar taxas no Supabase:', e);
      }
    }
  };

  // Save raw materials
  const handleSaveRawMaterials = async (newRawMaterials: RawMaterial[]) => {
    setRawMaterials(newRawMaterials);
    localStorage.setItem('orcamolde_raw_materials', JSON.stringify(newRawMaterials));
    if (isSupabaseConfigured) {
      try {
        await syncSaveRawMaterials(newRawMaterials);
      } catch (e) {
        console.error('Erro ao salvar matérias primas no Supabase:', e);
      }
    }
    showToast('Matérias-primas salvas e aplicadas com sucesso.');
  };

  // Reset to original factory parameters
  const handleResetToDefaults = () => {
    setConfig({ ...DEFAULT_CONFIG });
    localStorage.setItem('mold_config', JSON.stringify(DEFAULT_CONFIG));

    setRawMaterials(DEFAULT_RAW_MATERIALS);
    localStorage.setItem('orcamolde_raw_materials', JSON.stringify(DEFAULT_RAW_MATERIALS));

    // Reset internal service rates to defaults
    const defaultRates = DEFAULT_INTERNAL_SERVICES.map((item, index) => ({
      ...item,
      id: `srv_${index}`,
      total: 0,
    }));
    localStorage.setItem('orcamolde_service_rates', JSON.stringify(defaultRates));

    setInternalServices(prev =>
      prev.map((item) => {
        const d = DEFAULT_INTERNAL_SERVICES.find(x => x.name === item.name);
        if (d) {
          return { ...item, valUnit: d.valUnit, total: item.qtd * d.valUnit };
        }
        return item;
      })
    );

    showToast('Configurações redefinidas para o padrão de fábrica.', 'success');
  };

  // Save draft locally to localStorage
  const handleSaveDraft = async () => {
    const isEditing = activeDraftId !== null;
    const targetId = activeDraftId || `draft_${Date.now()}`;

    const newDraft: BudgetDraft = {
      id: targetId,
      reference,
      clientName,
      contactName,
      moldType,
      moldingMaterial,
      productQuantity,
      deliveryTime,
      observations,
      status,
      moldDescription,
      date,
      moldWidth,
      moldLength,
      materials,
      thirdPartyItems,
      internalServices,
      config,
      discountPercent,
      discountValue,
      proposalItems,
      commercialTerms,
      representativeName: userProfile?.full_name || currentUser?.email || '',
      representativePhone: userProfile?.phone || currentUser?.phone || '',
      representativeEmail: currentUser?.email || '',
      totals,
      machiningTypes,
    };

    let updatedDrafts: BudgetDraft[];
    if (isEditing) {
      updatedDrafts = drafts.map(d => d.id === targetId ? newDraft : d);
    } else {
      updatedDrafts = [newDraft, ...drafts];
    }

    try { await syncSaveBudget(newDraft); setDrafts(updatedDrafts); }
    catch (e: any) {
      console.error('Erro ao salvar orçamento no Supabase:', e);
      showToast(e?.message ? `O orçamento não foi salvo: ${e.message}` : 'O orçamento não foi salvo no banco.', 'error');
      return;
    }

    if (isEditing) {
      showToast('Alterações salvas no orçamento existente com sucesso!', 'success');
    } else {
      // Auto increment reference code only for NEW budgets
      const nextRef = generateNextReference(updatedDrafts);
      setReference(nextRef);
      // Set the newly saved draft as active so they can continue editing it
      setActiveDraftId(targetId);
      showToast('Orçamento salvo no histórico com sucesso!', 'success');
    }
  };

  // Load draft from history
  const handleLoadDraft = (selected: BudgetDraft) => {
    setActiveDraftId(selected.id);
    setClientName(selected.clientName);
    setContactName(selected.contactName || '');
    setMoldType(selected.moldType || '');
    setMoldingMaterial(selected.moldingMaterial || '');
    setProductQuantity(selected.productQuantity !== undefined ? selected.productQuantity : 1000);
    setDeliveryTime(selected.deliveryTime || '');
    setObservations(selected.observations || '');
    setStatus(selected.status || 'draft');
    setMoldDescription(selected.moldDescription);
    setDate(selected.date);
    setMoldWidth(selected.moldWidth);
    setMoldLength(selected.moldLength);
    setMaterials(selected.materials);
    setThirdPartyItems(selected.thirdPartyItems);
    setReference(selected.reference || '');
    setDiscountPercent(selected.discountPercent || 0);
    setDiscountValue(selected.discountValue || 0);
    setProposalItems(selected.proposalItems || []);
    setCommercialTerms(selected.commercialTerms || createDefaultCommercialTerms());
    
    // Safety check for legacy or mismatched service structures
    setInternalServices(
      selected.internalServices.map(item => {
        // Ensure rates align with active values if missing
        return {
          ...item,
          total: item.qtd * item.valUnit,
        };
      })
    );

    if (selected.config) {
      setConfig(selected.config);
    }

    if (selected.machiningTypes) {
      setMachiningTypes(selected.machiningTypes);
    }

    showToast(`Orçamento de "${selected.clientName}" carregado com sucesso!`, 'info');
  };

  // Delete draft from history
  const handleDeleteDraft = async (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem('mold_drafts', JSON.stringify(updated));
    if (id === activeDraftId) {
      setActiveDraftId(null);
    }
    if (isSupabaseConfigured) {
      try {
        await syncDeleteBudget(id);
      } catch (e) {
        console.error('Erro ao deletar orçamento no Supabase:', e);
      }
    }
    showToast('Orçamento excluído do histórico.');
  };

  // Clear current active quote editor
  const handleClearForm = () => {
    setActiveDraftId(null);
    setEditingProposalItemId(null);
    setClientName('');
    setContactName('');
    setMoldType('');
    setMoldingMaterial('');
    setProductQuantity(1000);
    setDeliveryTime('');
    setObservations('');
    setStatus('draft');
    setMoldDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setMoldWidth(0);
    setMoldLength(0);
    setDiscountPercent(0);
    setDiscountValue(0);
    setProposalItems([]);
    setCommercialTerms(createDefaultCommercialTerms());

    // Re-initialize materials to defaults
    const cleanMats = generateZeroMaterials(config, rawMaterials);
    setMaterials(cleanMats);

    // Re-initialize services and third party to 0 quantities
    setThirdPartyItems(prev => prev.map(item => ({ ...item, qtd: 0, total: 0 })));
    setInternalServices(prev => prev.map(item => ({ ...item, qtd: 0, total: 0 })));

    showToast('Formulário limpo com sucesso.');
  };

  // --- GERAL NOVO (CLEAN BLANK START) ---
  const handleGeralNovo = () => {
    setActiveDraftId(null);
    setEditingProposalItemId(null);
    setClientName('');
    setContactName('');
    setMoldType('');
    setMoldingMaterial('');
    setProductQuantity(1000);
    setDeliveryTime('');
    setObservations('');
    setStatus('draft');
    setMoldDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setMoldWidth(0);
    setMoldLength(0);
    setDiscountPercent(0);
    setDiscountValue(0);
    setProposalItems([]);
    setCommercialTerms(createDefaultCommercialTerms());

    // Re-initialize materials to defaults (clean slate at 0x0)
    const cleanMats = generateZeroMaterials(config, rawMaterials);
    setMaterials(cleanMats);

    // Re-initialize services and third party to 0 quantities
    setThirdPartyItems(prev => prev.map(item => ({ ...item, qtd: 0, total: 0 })));
    setInternalServices(prev => prev.map(item => ({ ...item, qtd: 0, total: 0 })));

    // Generate the next reference code dynamically from current drafts list
    const nextRef = generateNextReference(drafts);
    setReference(nextRef);

    // Switch to first tab and focus the first editable field (Nome do Cliente)
    setActiveTab('dados');
    setTimeout(() => {
      document.getElementById('client-name-input')?.focus();
    }, 150);

    showToast('Novo orçamento ("Geral Novo") iniciado em branco.', 'success');
  };

  // PDF Export Trigger
  const handleExportPDF = () => {
    const draft: BudgetDraft = {
      id: `draft_temp_${Date.now()}`,
      reference,
      clientName,
      contactName,
      moldType,
      moldingMaterial,
      productQuantity,
      deliveryTime,
      observations,
      status,
      moldDescription,
      date,
      moldWidth,
      moldLength,
      materials,
      thirdPartyItems,
      internalServices,
      config,
      discountPercent,
      discountValue,
      proposalItems,
      commercialTerms,
      representativeName: userProfile?.full_name || currentUser?.email || '',
      representativePhone: userProfile?.phone || currentUser?.phone || '',
      representativeEmail: currentUser?.email || '',
      totals,
      machiningTypes,
    };
    void generateBudgetPDF(draft);
    showToast('Proposta comercial do cliente gerada em PDF.');
  };

  const createFinancialAgreement = (budget: BudgetDraft, projectCode: string, approvalDate: string) => {
    const proposalTotal = getCommercialBudgetValue(budget);
    const schedule = budget.commercialTerms?.billingSchedule || [];
    if (!schedule.length) return;
    const baseDate = new Date(`${approvalDate}T12:00:00`);
    const milestones: BillingMilestone[] = schedule
      .filter(event => event.description.trim() && event.percent > 0)
      .map(event => {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + Math.max(0, event.dueDays || 0));
        return {
          id: `agreement_${budget.id}_${event.id}`,
          projectId: budget.id,
          projectName: projectCode,
          description: event.description.trim(),
          percent: event.percent,
          value: Math.round(proposalTotal * (event.percent / 100) * 100) / 100,
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'pending' as const,
        };
      });
    setErpMilestones(previous => [
      ...previous.filter(item => item.projectId !== budget.id),
      ...milestones,
    ]);
  };

  if (!isLoggedIn || forceRecoveryScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-y-auto py-10">
        {toastMessage && (
          <div className="fixed bottom-10 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border bg-slate-900 text-white animate-bounce-short">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage.text}</span>
          </div>
        )}
        
        {accessBlockedMsg && (
          <div className="max-w-md mx-auto w-full px-4 mb-4 z-20">
            <div className="bg-red-550/10 border border-red-500/20 p-4 rounded-2xl text-red-200 text-xs flex flex-col gap-2.5 shadow-lg backdrop-blur-md">
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">🚫</span>
                <div>
                  <h4 className="font-extrabold text-red-400 uppercase tracking-wider text-[10px] font-heading">Acesso Reservado</h4>
                  <p className="mt-1 leading-relaxed text-slate-300">
                    {accessBlockedMsg}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400 leading-normal">
                    Este aplicativo é comercializado de forma privada pela <strong>Axemet Solution LTDA</strong>. O administrador principal de sua organização deve aprovar e atribuir as suas permissões antes que você possa navegar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <LoginScreen
          onLogin={handleLoginAttempt}
          forceRecovery={forceRecoveryScreen}
          onRecoveryComplete={() => {
            setForceRecoveryScreen(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />

        {/* Render SQL guide modal here so it can be opened from login screen */}
        {showSchemaGuide && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-[#EA580C]">Configuração de Banco de Dados</h3>
                    <p className="text-[10px] text-slate-400">Como inicializar o seu banco de dados Supabase</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSchemaGuide(false)}
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-orange-400">Passos para Configuração:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                    <li>Acesse o seu painel do <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline font-bold">Supabase Console</a>.</li>
                    <li>Selecione o seu projeto correspondente.</li>
                    <li>No menu lateral esquerdo, clique em <strong>SQL Editor</strong> (ícone de terminal/documento).</li>
                    <li>Clique em <strong>"New query"</strong> (ou "New Blank Query").</li>
                    <li>Cole o código SQL abaixo no editor e clique no botão <strong>"Run"</strong> no canto inferior direito.</li>
                  </ol>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Script SQL de Inicialização</span>
                    <button
                      onClick={handleCopySQL}
                      className="px-3 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] overflow-auto max-h-60 text-slate-300 select-all leading-normal whitespace-pre">Use as migrações versionadas em supabase/migrations, na ordem cronológica. Não execute scripts legados de demonstração.</pre>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowSchemaGuide(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="axemet-shell min-h-screen bg-[#040710] text-slate-100 font-sans antialiased flex flex-col md:flex-row">
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border border-slate-800 bg-[#0d1423] text-slate-200 animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* DESKTOP INDUSTRIAL FUNNEL SIDEBAR */}
      <aside 
        role="navigation" 
        aria-label="Menu principal de navegação do sistema"
        className="axemet-sidebar hidden md:flex flex-col w-72 bg-[#080c17]/95 text-slate-100 border-r border-slate-800 shrink-0 select-none max-h-screen overflow-y-auto sticky top-0"
      >
        {/* Brand/Logo */}
        <div className="axemet-brand p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/80">
          <img src="/axemet-system-logo.png?v=2" alt="Axemet System" className="w-10 h-10 rounded-xl object-cover border border-[var(--ax-accent)] shadow-lg" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-[var(--ax-accent)] uppercase font-mono leading-none">AXEMET SYSTEM</span>
            <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase mt-1 leading-none">
              Gestão Industrial
            </span>
          </div>
        </div>

        {/* Current Org Indicator */}
        <div className="axemet-org px-5 py-3 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[var(--ax-accent)]" />
            <span>Empresa: <strong className="text-slate-200">{userProfile?.organization || 'Axemet Solution LTDA'}</strong></span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 font-mono text-[9px] font-bold">● ONLINE</span>
        </div>

        {/* Funnel Sections — Professional modular navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Módulos do sistema">
          <SidebarSection title="Visão Geral">
            <SidebarNavItem
              icon={<LayoutDashboard className="h-[18px] w-[18px]" />}
              label="Dashboard 360°"
              hint="Dashboard 360° — visão geral executiva em tempo real"
              view="modulo11"
              activeView={appView}
              onNavigate={setAppView}
            />
          </SidebarSection>

          <SidebarSection title="1 · Comercial & Vendas">
            <SidebarNavItem icon={<TrendingUp className="h-[18px] w-[18px]" />} label="Funil de Vendas CRM" hint="Funil de Vendas CRM — oportunidades e pipeline" view="crm" activeView={appView} onNavigate={setAppView} />
            <SidebarNavItem icon={<Calculator className="h-[18px] w-[18px]" />} label="Orçamentos & Custos" hint="Orçamentos & Custos — crie e gerencie orçamentos de moldes" view="home" activeView={appView} onNavigate={setAppView} />
            <SidebarNavItem icon={<Contact className="h-[18px] w-[18px]" />} label="Banco de Clientes" hint="Banco de Clientes — cadastro e histórico" view="clientes" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          <SidebarSection title="2 · Engenharia">
            <SidebarNavItem icon={<FolderKanban className="h-[18px] w-[18px]" />} label="Projetos & BOM" hint="Projetos & BOM — engenharia e lista de materiais" view="modulo2" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          <SidebarSection title="3 · Planejamento PCP">
            <SidebarNavItem icon={<GanttChartSquare className="h-[18px] w-[18px]" />} label="Gantt & Programação" hint="Gantt & Programação — planejamento e controle de produção" view="modulo3" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          <SidebarSection title="4 · Suprimentos">
            <SidebarNavItem icon={<Boxes className="h-[18px] w-[18px]" />} label="Estoque & Chapas" hint="Estoque & Chapas — matérias-primas e chapas" view="modulo4" activeView={appView} onNavigate={setAppView} />
            <SidebarNavItem icon={<ShoppingCart className="h-[18px] w-[18px]" />} label="Compras Triple-Vendor" hint="Compras Triple-Vendor — cotação com 3 fornecedores" view="modulo9" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          <SidebarSection title="5 · Manufatura">
            <SidebarNavItem icon={<ClipboardList className="h-[18px] w-[18px]" />} label="Projetos & Ordens" hint="Projetos & Ordens — acompanhamento de produção" view="projetos" activeView={appView} onNavigate={setAppView} />
            <SidebarNavItem icon={<Factory className="h-[18px] w-[18px]" />} label="Chão de Fábrica OS" hint="Chão de Fábrica OS — ordens de serviço e apontamento" view="modulo5" activeView={appView} onNavigate={setAppView} />
            <SidebarNavItem icon={<ShieldCheck className="h-[18px] w-[18px]" />} label="Qualidade & RNC" hint="Qualidade & RNC — não conformidades" view="modulo6" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          <SidebarSection title="6 · Controladoria">
            <SidebarNavItem icon={<PieChart className="h-[18px] w-[18px]" />} label="Custos Radar (Orç vs Real)" hint="Custos Radar — comparativo orçado vs realizado" view="modulo7" activeView={appView} onNavigate={setAppView} />
            <SidebarNavItem icon={<Landmark className="h-[18px] w-[18px]" />} label="Financeiro & DRE" hint="Financeiro & DRE — demonstração de resultados" view="modulo8" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          <SidebarSection title="7 · Operação em Campo">
            <SidebarNavItem icon={<Wrench className="h-[18px] w-[18px]" />} label="Manutenção & Ciclos" hint="Manutenção & Ciclos — preventiva e corretiva" view="modulo10" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          <SidebarSection title="8 · Pessoas & Estrutura">
            <SidebarNavItem icon={<IdCard className="h-[18px] w-[18px]" />} label="RH, Setores & Máquinas" hint="RH, Setores & Máquinas — pessoas e estrutura" view="rh" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          <SidebarSection title="Parceiros">
            <SidebarNavItem icon={<Truck className="h-[18px] w-[18px]" />} label="Fornecedores & Homologação" hint="Fornecedores & Homologação — qualificação" view="fornecedores" activeView={appView} onNavigate={setAppView} />
          </SidebarSection>

          {(userProfile?.role === 'admin' || !isSupabaseConfigured) && (
            <SidebarSection title="Configurações & Admin">
              <SidebarNavItem icon={<Building2 className="h-[18px] w-[18px]" />} label="Minha Organização" hint="Minha Organização — dados da empresa" view="organizacao" activeView={appView} onNavigate={setAppView} />
              <SidebarNavItem icon={<KeyRound className="h-[18px] w-[18px]" />} label="Gestão de Acessos" hint="Gestão de Acessos — permissões de usuários" view="acessos" activeView={appView} onNavigate={setAppView} />
            </SidebarSection>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/80 text-[11px] font-bold">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-500 animate-pulse" />
            Sair do ERP
          </button>
        </div>
      </aside>

      {/* MOBILE RESPONSIVE HEADER & SELECTOR */}
      <header className="md:hidden bg-[#080c17]/95 border-b border-slate-800 text-white sticky top-0 z-45 p-4 flex flex-col gap-3 shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/axemet-system-logo.png?v=2" alt="Axemet System" className="w-8 h-8 rounded-lg object-cover border border-[var(--ax-accent)]" />
            <div>
              <span className="text-[8px] font-black tracking-widest text-[var(--ax-accent)] uppercase block leading-none font-mono">AXEMET SYSTEM</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase block leading-none mt-0.5">Gestão Industrial</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/20 rounded-lg transition border border-red-900/30"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Responsive Dropdown Selector for Funnel Stages */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 shrink-0 font-mono">Navegar Funil:</span>
          <select
            value={appView}
            onChange={(e) => setAppView(e.target.value as any)}
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-[var(--ax-accent)] cursor-pointer"
          >
            <option value="modulo11">📊 Dashboard 360°</option>
            <optgroup label="1. COMERCIAL">
              <option value="crm">💼 Funil de Vendas CRM</option>
              <option value="home">📋 Orçamentos & Custos</option>
              <option value="clientes">👥 Banco de Clientes</option>
            </optgroup>
            <optgroup label="2. ENGENHARIA">
              <option value="modulo2">🔧 Projetos & BOM (M2)</option>
            </optgroup>
            <optgroup label="3. PCP">
              <option value="modulo3">📅 Gantt & PCP (M3)</option>
            </optgroup>
            <optgroup label="4. SUPRIMENTOS">
              <option value="modulo4">📦 Estoque & Chapas (M4)</option>
              <option value="modulo9">🛒 Compras Triple-Vendor (M9)</option>
            </optgroup>
            <optgroup label="5. MANUFATURA">
              <option value="projetos">Projetos e Ordens de Fabricação</option>
              <option value="modulo5">🏭 Chão de Fábrica OS (M5)</option>
              <option value="modulo6">✅ Qualidade & RNC (M6)</option>
            </optgroup>
            <optgroup label="6. CONTROLADORIA">
              <option value="modulo7">📊 Custos Radar (M7)</option>
              <option value="modulo8">💰 Financeiro e DRE (M8)</option>
            </optgroup>
            <optgroup label="7. CAMPO">
              <option value="modulo10">🔧 Manutenção & Ciclos (M10)</option>
            </optgroup>
            <optgroup label="8. PESSOAS & ESTRUTURA">
              <option value="rh">👥 RH, Setores & Máquinas</option>
            </optgroup>
            {(userProfile?.role === 'admin' || !isSupabaseConfigured) && (
              <optgroup label="ADMIN">
                <option value="organizacao">⚙️ Minha Organização</option>
                <option value="acessos">🔒 Gestão de Acessos</option>
              </optgroup>
            )}
          </select>
        </div>
      </header>

      {/* RIGHT VIEWPORT CONTENT CONTAINER */}
      <div className="axemet-workspace flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* DESKTOP METADATA TOP BAR */}
        <header className="axemet-topbar hidden md:flex items-center justify-between px-6 py-4 bg-[#060a13]/80 border-b border-slate-800 shrink-0 shadow-md backdrop-blur-2xl">
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block leading-none font-mono">AXEMET SYSTEM • GESTÃO INDUSTRIAL • T1</span>
            <h2 className="text-sm font-black text-slate-200 uppercase tracking-tight mt-1 flex items-center gap-1.5 font-heading">
              {appView === 'modulo11' && '📊 Dashboard 360°'}
              {appView === 'crm' && '💼 Funil de Vendas CRM'}
              {appView === 'projetos' && 'Projetos e Ordens de Fabricação'}
              {appView === 'home' && '📋 Orçamentos & Custos'}
              {appView === 'editor' && '✍️ Editor de Orçamento'}
              {appView === 'clientes' && '👥 Banco de Clientes'}
              {appView === 'modulo2' && '🔧 Engenharia & BOM'}
              {appView === 'modulo3' && '📅 Planejamento PCP'}
              {appView === 'modulo4' && '📦 Almoxarifado e Estoque'}
              {appView === 'modulo5' && '🏭 Terminal do Operador'}
              {appView === 'modulo6' && '✅ Qualidade & RNC'}
              {appView === 'modulo7' && '📊 Controladoria de Custos'}
              {appView === 'modulo8' && '💰 Financeiro e DRE'}
              {appView === 'modulo9' && '🛒 Compras Triple-Vendor'}
              {appView === 'modulo10' && '🔧 Manutenção de Moldes'}
              {appView === 'rh' && '👥 Pessoas, RH & Estrutura'}
              {appView === 'fornecedores' && 'Fornecedores & Homologação'}
              {appView === 'organizacao' && '⚙️ Configurações de Organização'}
              {appView === 'acessos' && '🔒 Controle de Acessos'}
            </h2>
          </div>

          {/* Quick Actions & Profiles */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="text-slate-300 font-bold">{userProfile?.organization || 'Axemet Solution LTDA'}</span>
            </div>
            
            <div className="text-right">
              <span className="text-slate-200 block font-black leading-none">{userProfile?.full_name || 'Filipe Santos'}</span>
              <span className="text-[10px] text-[var(--ax-accent)] block mt-1 font-extrabold uppercase tracking-wide font-mono">
                {userProfile?.role === 'admin' ? 'Super Admin' : userProfile?.role === 'manager' ? 'Gestor' : 'Colaborador'}
              </span>
            </div>
          </div>
        </header>

        {/* CONTENT STAGE */}
        <main id="main-content" tabIndex={-1} className="axemet-main w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 focus:outline-none">


        {/* 1. HOME SCREEN: List of Budgets */}
        {appView === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header / Hero Stats */}
            <div className="axemet-hero bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Cpu className="w-40 h-40" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold tracking-widest text-[#EA580C] uppercase font-heading">Axemet Solution LTDA</span>
                  <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">Painel de Orçamentos de Moldes</h2>
                  <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
                    Gerencie especificações técnicas, pesos de chapas, componentes padronizados, custos de matrizaria e margens de venda com o motor de Markup Divisor.
                  </p>
                </div>

                {/* Dashboard Stats */}
                <div className="axemet-hero-stats grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between min-h-[84px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Projetos</p>
                    <p className="text-xl sm:text-2xl font-black font-heading text-white">{drafts.length}</p>
                  </div>
                  <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-xl flex flex-col justify-between min-h-[84px]">
                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">Pendentes</p>
                    <p className="text-xl sm:text-2xl font-black font-heading text-amber-300">
                      {drafts.filter(d => d.status === 'pending').length}
                    </p>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl flex flex-col justify-between min-h-[84px]">
                    <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-1">Aprovados</p>
                    <p className="text-xl sm:text-2xl font-black font-heading text-emerald-300">
                      {drafts.filter(d => d.status === 'approved').length}
                    </p>
                  </div>
                  <div className="bg-indigo-950/40 border border-indigo-500/40 p-3.5 rounded-xl flex flex-col justify-between min-h-[84px]">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Faturamento Aprovado</p>
                    <p className="text-base sm:text-lg font-black font-heading text-indigo-300 truncate">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
                        drafts.filter(d => d.status === 'approved').reduce((acc, curr) => acc + getCommercialBudgetValue(curr), 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick action: Create new budget */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-extrabold text-slate-100 font-heading flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#EA580C]" />
                Histórico de Orçamentos
              </h3>
              <button
                onClick={() => {
                  handleGeralNovo();
                  setAppView('editor');
                }}
                className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Orçamento
              </button>
            </div>

            {/* Search & Filters block */}
            <div className="axemet-filter bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search */}
                <div className="md:col-span-6 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FolderOpen className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por cliente, molde ou referência..."
                    value={homeSearchTerm}
                    onChange={(e) => setHomeSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-950 placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white"
                  />
                </div>

                {/* Filter Status */}
                <div className="md:col-span-3">
                  <select
                    value={homeFilterStatus}
                    onChange={(e) => setHomeFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-950 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer focus:bg-white"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="draft">Rascunhos</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Recusados</option>
                  </select>
                </div>

                {/* Filter Client */}
                <div className="md:col-span-3">
                  <select
                    value={homeFilterClient}
                    onChange={(e) => setHomeFilterClient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-950 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer focus:bg-white truncate"
                  >
                    <option value="all">Todos os Clientes</option>
                    {Array.from(new Set(drafts.map(d => d.clientName))).filter(Boolean).map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* List of Orçamentos (Inspired by Soluções/Novidades horizontal blocks) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {drafts.filter(d => {
                const matchesSearch = 
                  d.clientName.toLowerCase().includes(homeSearchTerm.toLowerCase()) ||
                  d.moldDescription.toLowerCase().includes(homeSearchTerm.toLowerCase()) ||
                  (d.reference && d.reference.toLowerCase().includes(homeSearchTerm.toLowerCase()));
                const matchesStatus = homeFilterStatus === 'all' || d.status === homeFilterStatus;
                const matchesClient = homeFilterClient === 'all' || d.clientName === homeFilterClient;
                return matchesSearch && matchesStatus && matchesClient;
              }).length === 0 ? (
                <div className="md:col-span-2 text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-sm font-medium">Nenhum orçamento encontrado com as especificações inseridas.</p>
                  <button
                    onClick={() => {
                      setHomeSearchTerm('');
                      setHomeFilterStatus('all');
                      setHomeFilterClient('all');
                    }}
                    className="text-xs font-bold text-[#EA580C] hover:underline cursor-pointer"
                  >
                    Limpar Filtros de Busca
                  </button>
                </div>
              ) : (
                drafts.filter(d => {
                  const matchesSearch = 
                    d.clientName.toLowerCase().includes(homeSearchTerm.toLowerCase()) ||
                    d.moldDescription.toLowerCase().includes(homeSearchTerm.toLowerCase()) ||
                    (d.reference && d.reference.toLowerCase().includes(homeSearchTerm.toLowerCase()));
                  const matchesStatus = homeFilterStatus === 'all' || d.status === homeFilterStatus;
                  const matchesClient = homeFilterClient === 'all' || d.clientName === homeFilterClient;
                  return matchesSearch && matchesStatus && matchesClient;
                }).map((draft) => {
                  const statusColors = {
                    draft: { bg: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-400', bar: 'border-l-slate-400', label: 'Rascunho' },
                    pending: { bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500', bar: 'border-l-[#EA580C]', label: 'Pendente' },
                    approved: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', bar: 'border-l-emerald-500', label: 'Aprovado' },
                    rejected: { bg: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500', bar: 'border-l-red-500', label: 'Recusado' },
                  };
                  const currentStatus = statusColors[draft.status || 'draft'];

                  return (
                    <div
                      key={draft.id}
                      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 border-l-4 ${currentStatus.bar} group`}
                    >
                      {/* Card Header */}
                      <div className="p-4 pb-2 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                        <span className="text-[11px] font-mono font-black text-slate-600">
                          REF: {draft.reference || draft.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentStatus.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                          {currentStatus.label}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3 flex-1">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 font-heading uppercase tracking-tight line-clamp-1">
                            {draft.clientName || 'CLIENTE NÃO CADASTRADO'}
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold line-clamp-1 mt-0.5">
                            {draft.moldDescription || 'Sem descrição do molde'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500 font-medium font-sans pt-1 border-t border-slate-50">
                          <div>
                            <span className="text-slate-400 font-semibold uppercase text-[9px] block font-heading">Molde / Injeção</span>
                            <span className="text-slate-700 font-bold truncate block">{draft.moldType || 'Plástico Injeção'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold uppercase text-[9px] block font-heading">Matéria-Prima</span>
                            <span className="text-slate-700 font-bold truncate block">{draft.moldingMaterial || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold uppercase text-[9px] block font-heading">Quantidade / Prazo</span>
                            <span className="text-slate-700 font-bold block">
                              {draft.productQuantity !== undefined ? new Intl.NumberFormat('pt-BR').format(draft.productQuantity) : '1.000'} pçs / {draft.deliveryTime || '45d'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold uppercase text-[9px] block font-heading">Dimensões Molde</span>
                            <span className="text-slate-700 font-bold block font-mono">
                              {draft.moldWidth || 0} x {draft.moldLength || 0} mm
                            </span>
                          </div>
                        </div>

                        {draft.observations && (
                          <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg line-clamp-2 italic font-sans">
                            Obs: {draft.observations}
                          </p>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider font-heading">Valor comercial consolidado</span>
                          <span className="text-sm font-black text-[#EA580C] font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getCommercialBudgetValue(draft))}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Quick Export PDF */}
                          <button
                            onClick={() => {
                              void generateBudgetPDF(draft);
                              showToast('Proposta comercial gerada em PDF.', 'success');
                            }}
                            className="p-2 text-slate-500 hover:text-[#EA580C] hover:bg-orange-50 rounded-lg transition cursor-pointer"
                            title="Gerar proposta comercial para o cliente"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>

                          {/* Quick Delete */}
                          {confirmDeleteDraftId === draft.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                              <span className="text-[9px] font-bold text-red-700 px-1">Excluir?</span>
                              <button
                                onClick={() => {
                                  handleDeleteDraft(draft.id);
                                  setConfirmDeleteDraftId(null);
                                }}
                                className="px-2 py-1 bg-red-600 text-white rounded text-[9px] font-bold hover:bg-red-700 transition cursor-pointer"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmDeleteDraftId(null)}
                                className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded text-[9px] font-bold hover:bg-slate-50 transition cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmDeleteDraftId(draft.id);
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Excluir Orçamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Primary CTA (Identical to site's CTA button) */}
                          <button
                            onClick={() => {
                              handleLoadDraft(draft);
                              setAppView('editor');
                            }}
                            className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-[11px] font-extrabold rounded-lg transition duration-150 uppercase shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            Acessar
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop and Mobile Floating Button */}
            <button
              onClick={() => {
                handleGeralNovo();
                setAppView('editor');
              }}
              className="fixed bottom-24 right-6 md:bottom-10 z-50 w-14 h-14 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full flex items-center justify-center shadow-2xl transition duration-300 hover:scale-105 cursor-pointer"
              title="Iniciar Novo Orçamento"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {/* 2. EDITOR SCREEN: Pricing & Technical Config */}
        {appView === 'editor' && (
          <div className="space-y-6 animate-fadeIn pb-12">
            
            {/* Editor Control Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Cpu className="w-4.5 h-4.5 text-[#EA580C]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase font-heading tracking-tight">
                    {clientName ? `Cálculo Técnico: ${clientName}` : 'Configuração de Orçamento Técnico'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono font-bold">
                    REF: {reference || 'RASCUNHO AUTOMÁTICO'} • DATA: {new Date(date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setAppView('home')}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
                <button
                  onClick={handleClearForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Limpar campos"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  Limpar
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Parâmetros do orçamento"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Parâmetros
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  PDF
                </button>
              </div>
            </div>

            {/* Stepper sector tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              {[
                { id: 'dados', label: '1. Dados & Molde', icon: Ruler, description: 'Molde e cliente' },
                { id: 'materiais', label: '2. Chapas & Aço', icon: Layers, description: 'Peso e cubagem', amount: totals.materialsTotal },
                { id: 'tempos', label: '3. Tempos Usinagem', icon: Clock, description: 'Alimentador de serviços', amount: machiningTotal },
                { id: 'terceiros', label: '4. Componentes', icon: Cpu, description: 'Acessórios e terceiros', amount: totals.thirdPartyTotal },
                { id: 'servicos', label: '5. Serviços', icon: Briefcase, description: 'Usinagem e matrizaria', amount: totals.internalTotal },
                { id: 'resumo', label: '6. Comercial', icon: TrendingUp, description: 'Preço final e taxas', amount: totals.finalPrice },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`text-left p-3 rounded-lg border transition duration-200 cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50/50 border-slate-200/80 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#EA580C]' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold tracking-tight truncate">{tab.label}</span>
                    </div>
                    <p className={`text-[9px] mt-1 truncate ${isActive ? 'text-slate-400' : 'text-slate-400 font-medium'}`}>
                      {tab.description}
                    </p>
                    {tab.amount !== undefined && (
                      <div className={`text-xs font-bold mt-2 font-mono ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(tab.amount)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB CORRESPONDENT COMPONENT */}
            <div className="space-y-6">
              
              {/* Section A: Mold Inputs */}
              {activeTab === 'dados' && (
                <section id="secao-dados-molde">
                  <MoldInputs
                    reference={reference}
                    onReferenceChange={setReference}
                    clientName={clientName}
                    onClientNameChange={setClientName}
                    contactName={contactName}
                    onContactNameChange={setContactName}
                    moldType={moldType}
                    onMoldTypeChange={setMoldType}
                    moldingMaterial={moldingMaterial}
                    onMoldingMaterialChange={setMoldingMaterial}
                    productQuantity={productQuantity}
                    onProductQuantityChange={setProductQuantity}
                    deliveryTime={deliveryTime}
                    onDeliveryTimeChange={setDeliveryTime}
                    observations={observations}
                    onObservationsChange={setObservations}
                    status={status}
                    onStatusChange={setStatus}
                    moldDescription={moldDescription}
                    onMoldDescriptionChange={setMoldDescription}
                    date={date}
                    onDateChange={setDate}
                    clients={clients}
                    onAddClient={handleAddClient}
                    onViewClientsTab={() => setAppView('clientes')}
                  />
                </section>
              )}

              {/* Section B: Materials */}
              {activeTab === 'materiais' && (
                <section id="secao-materiais">
                  <MaterialsTable
                    materials={materials}
                    onUpdateMaterial={handleUpdateMaterial}
                    onAddMaterial={handleAddMaterial}
                    onDeleteMaterial={handleDeleteMaterial}
                    materialsTotal={totals.materialsTotal}
                    moldWidth={moldWidth}
                    onMoldWidthChange={setMoldWidth}
                    moldLength={moldLength}
                    onMoldLengthChange={setMoldLength}
                    rawMaterials={rawMaterials}
                  />
                </section>
              )}

              {/* Section B.5: Machining Times */}
              {activeTab === 'tempos' && (
                <section id="secao-tempos-usinagem">
                  <MachiningTimesTable
                    materials={materials}
                    machiningTypes={machiningTypes}
                    onUpdateMaterialTimes={handleUpdateMaterialTimes}
                    onClearAllTimes={handleClearAllMachiningTimes}
                  />
                </section>
              )}

              {/* Section C: Third Party Components */}
              {activeTab === 'terceiros' && (
                <section id="secao-terceiros">
                  <ThirdPartyTable
                    items={thirdPartyItems}
                    onUpdateItem={handleUpdateThirdParty}
                    onAddItem={handleAddThirdParty}
                    onDeleteItem={handleDeleteThirdParty}
                    thirdPartyTotal={totals.thirdPartyTotal}
                    standardComponents={erpStdStock}
                  />
                </section>
              )}

              {/* Section D: Internal Services */}
              {activeTab === 'servicos' && (
                <section id="secao-servicos-internos">
                  <InternalServicesTable
                    services={internalServices}
                    onUpdateService={handleUpdateInternalService}
                    onAddService={handleAddInternalService}
                    onDeleteService={handleDeleteInternalService}
                    servicesTotal={totals.internalTotal}
                    machiningTypes={machiningTypes}
                  />
                </section>
              )}

              {/* Section E: Final Closing commercial summary */}
              {activeTab === 'resumo' && (
                <section id="secao-resumo-comercial">
                  <CommercialProposalEditor
                    items={proposalItems}
                    terms={commercialTerms}
                    onItemsChange={setProposalItems}
                    onTermsChange={setCommercialTerms}
                    onEditTechnicalItem={handleEditTechnicalProposalItem}
                    onAddCurrentTechnicalItem={handleAddCurrentTechnicalItem}
                    onPrepareNextTechnicalItem={handlePrepareNextTechnicalItem}
                  />
                  <div className="h-6" />
                  <QuoteSummary
                    totals={summaryTotals}
                    config={config}
                    proposalTotal={closingPrice}
                    hasCompleteTechnicalMemory={hasCompleteTechnicalMemory}
                    onSaveDraft={handleSaveDraft}
                    onExportPDF={handleExportPDF}
                    discountPercent={discountPercent}
                    onDiscountPercentChange={(val) => {
                      setDiscountPercent(val);
                      setDiscountValue(closingPrice * (val / 100));
                    }}
                    discountValue={discountValue}
                    onDiscountValueChange={(val) => {
                      setDiscountValue(val);
                      setDiscountPercent(closingPrice > 0 ? (val / closingPrice) * 100 : 0);
                    }}
                  />
                </section>
              )}

            </div>

            {/* Progression Stepper Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                disabled={activeTab === 'dados'}
                onClick={() => {
                  const order: typeof activeTab[] = ['dados', 'materiais', 'tempos', 'terceiros', 'servicos', 'resumo'];
                  const prevIdx = order.indexOf(activeTab) - 1;
                  if (prevIdx >= 0) setActiveTab(order[prevIdx]);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg text-xs font-bold transition ${
                  activeTab === 'dados'
                    ? 'text-slate-300 border-slate-100 bg-slate-50/50 cursor-not-allowed'
                    : 'text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Setor Anterior
              </button>
              <div className="hidden sm:flex items-center gap-1.5">
                {['dados', 'materiais', 'tempos', 'terceiros', 'servicos', 'resumo'].map((step) => (
                  <div 
                    key={step} 
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      activeTab === step ? 'bg-[#EA580C] w-6' : 'bg-slate-200'
                    }`} 
                  />
                ))}
              </div>
              <button
                type="button"
                disabled={activeTab === 'clientes'}
                onClick={() => {
                  const order: typeof activeTab[] = ['dados', 'materiais', 'tempos', 'terceiros', 'servicos', 'resumo'];
                  const nextIdx = order.indexOf(activeTab) + 1;
                  if (nextIdx < order.length) setActiveTab(order[nextIdx]);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                  activeTab === 'clientes' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Avançar Setor
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* 3. CLIENTES SCREEN: Local bank database */}
        {appView === 'clientes' && (
          <div className="space-y-6 animate-fadeIn pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-heading uppercase tracking-tight">Banco de Dados Local de Clientes</h2>
                <p className="text-xs text-slate-500">Cadastro de faturamento e dados cadastrais dos clientes ativos.</p>
              </div>
              <button
                onClick={() => setAppView('home')}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar para Orçamentos
              </button>
            </div>

            <ClientsDatabase
              clients={clients}
              onAddClient={handleAddClient}
              onDeleteClient={handleDeleteClient}
              onUpdateClient={handleUpdateClient}
              onSelectClient={(c) => {
                setClientName(c.name);
                handleGeralNovo();
                // Override newly reset name with selected client
                setClientName(c.name);
                setAppView('editor');
                setActiveTab('dados');
                showToast(`Orçamento para "${c.name}" iniciado.`, 'success');
              }}
              activeClientName={clientName}
            />
          </div>
        )}

        {/* 4. CRM PIPELINE SCREEN */}
        {appView === 'crm' && (
          <div className="space-y-6 animate-fadeIn pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Funil de Vendas CRM
                </h2>
                <p className="text-xs text-slate-500">Acompanhe e qualifique o andamento de suas propostas comerciais desde o primeiro contato.</p>
              </div>
              <button
                onClick={() => setAppView('home')}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Painel de Orçamentos
              </button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Potencial em Negociação</p>
                <p className="text-xl font-black text-[#EA580C] font-mono mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    drafts.filter(d => d.status === 'pending' || d.status === 'draft').reduce((acc, curr) => acc + getCommercialBudgetValue(curr), 0)
                  )}
                </p>
                <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#EA580C] w-[45%]" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Ganho</p>
                <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    drafts.filter(d => d.status === 'approved').reduce((acc, curr) => acc + getCommercialBudgetValue(curr), 0)
                  )}
                </p>
                <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[65%]" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa de Conversão</p>
                <p className="text-xl font-black text-indigo-600 font-sans mt-1">
                  {drafts.length > 0 
                    ? `${Math.round((drafts.filter(d => d.status === 'approved').length / drafts.length) * 100)}%`
                    : '0%'
                  }
                </p>
                <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: drafts.length > 0 ? `${(drafts.filter(d => d.status === 'approved').length / drafts.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Funnel Pipeline Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
              
              {/* Col 1: Elaboração (Rascunhos) */}
              <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-3 min-w-[250px] space-y-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">1. Rascunhos / Contato</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full">
                    {drafts.filter(d => d.status === 'draft' || !d.status).length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {drafts.filter(d => d.status === 'draft' || !d.status).map(draft => (
                    <div key={draft.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-bold text-slate-900 uppercase truncate" title={draft.clientName}>
                          {draft.clientName || 'Cliente sem nome'}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate leading-none">{draft.moldDescription || 'Molde Injeção'}</p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                        <span className="text-xs font-bold text-[#EA580C] font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(getCommercialBudgetValue(draft))}
                        </span>
                        <button
                          onClick={async () => {
                            const updated = { ...draft, status: 'pending' as const };
                            setDrafts(prev => prev.map(d => d.id === draft.id ? updated : d));
                            if (isSupabaseConfigured) await syncSaveBudget(updated);
                            showToast('Proposta enviada para Negociação!');
                          }}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] uppercase rounded-md transition"
                        >
                          Negociar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 2: Negociação (Pendentes) */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 min-w-[250px] space-y-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">2. Em Negociação</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                    {drafts.filter(d => d.status === 'pending').length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {drafts.filter(d => d.status === 'pending').map(draft => (
                    <div key={draft.id} className="bg-white p-3 rounded-lg border border-amber-200/50 shadow-2xs hover:border-amber-300 transition space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase truncate" title={draft.clientName}>
                        {draft.clientName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate leading-none">{draft.moldDescription || 'Molde Injeção'}</p>
                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-50">
                        <span className="text-xs font-bold text-[#EA580C] font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(getCommercialBudgetValue(draft))}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setApprovalDraft(draft); setApprovalProjectCode(`OS-${(draft.reference || draft.id).replace(/[^a-zA-Z0-9]/g, '-')}`); setApprovalDueDate(''); }}
                            className="flex-1 px-1.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase rounded-md transition text-center"
                          >
                            Aprovar e gerar OS
                          </button>
                          <button
                            onClick={async () => {
                              const updated = { ...draft, status: 'rejected' as const };
                              setDrafts(prev => prev.map(d => d.id === draft.id ? updated : d));
                              if (isSupabaseConfigured) await syncSaveBudget(updated);
                              showToast('Proposta recusada comercialmente.', 'info');
                            }}
                            className="px-1.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-[9px] uppercase rounded-md transition"
                          >
                            Perdido
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 3: Ganho (Aprovado) */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 min-w-[250px] space-y-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">3. Ganho / Aprovado</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {drafts.filter(d => d.status === 'approved').length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {drafts.filter(d => d.status === 'approved').map(draft => (
                    <div key={draft.id} className="bg-white p-3 rounded-lg border border-emerald-200/50 shadow-2xs space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase truncate" title={draft.clientName}>
                        {draft.clientName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate leading-none">{draft.moldDescription || 'Molde Injeção'}</p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                        <span className="text-xs font-bold text-emerald-600 font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(getCommercialBudgetValue(draft))}
                        </span>
                        <button
                          onClick={() => {
                            setAppView('projetos');
                            showToast('Acompanhe a fabricação técnica deste molde.');
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] uppercase rounded-md transition"
                        >
                          Ver OS
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 4: Perdido (Recusado) */}
              <div className="bg-red-50/30 border border-red-100 rounded-xl p-3 min-w-[250px] space-y-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-red-200/50 pb-2">
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wider">4. Perdido / Recusado</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">
                    {drafts.filter(d => d.status === 'rejected').length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {drafts.filter(d => d.status === 'rejected').map(draft => (
                    <div key={draft.id} className="bg-white p-3 rounded-lg border border-red-100/50 shadow-2xs opacity-70 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase truncate" title={draft.clientName}>
                        {draft.clientName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate leading-none">{draft.moldDescription || 'Molde Injeção'}</p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                        <span className="text-xs font-bold text-red-600 font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(getCommercialBudgetValue(draft))}
                        </span>
                        <button
                          onClick={async () => {
                            const updated = { ...draft, status: 'pending' as const };
                            setDrafts(prev => prev.map(d => d.id === draft.id ? updated : d));
                            if (isSupabaseConfigured) await syncSaveBudget(updated);
                            showToast('Proposta recuperada para negociação.');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] uppercase rounded-md transition"
                        >
                          Reabrir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. PRODUCTION CHECKLIST SCREEN */}
        {appView === 'producao' && (
          <div className="space-y-6 animate-fadeIn pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-heading uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Ordem de Serviço (Acompanhamento de Produção)
                </h2>
                <p className="text-xs text-slate-500">Controle o status de execução de todas as etapas de ferramentaria para os orçamentos aprovados.</p>
              </div>
              <button
                onClick={() => setAppView('home')}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Painel de Orçamentos
              </button>
            </div>

            {drafts.filter(d => d.status === 'approved').length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
                <Activity className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-sm font-medium">Nenhuma Ordem de Serviço ativa.</p>
                <p className="text-xs text-slate-400">Aprovar orçamentos comercialmente para gerar Ordens de Serviço automáticas para a engenharia/fábrica.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.filter(d => d.status === 'approved').map(draft => {
                  // Ensure stages are populated
                  const stages = draft.productionStages || [
                    { id: 'projeto', name: 'Projeto 3D', status: 'pending' },
                    { id: 'usinagem_placas', name: 'Usinagem de Placas', status: 'pending' },
                    { id: 'ajuste', name: 'Ajuste & Bancada', status: 'pending' },
                    { id: 'test_t1', name: 'Teste Try-out T1', status: 'pending' },
                    { id: 'entrega', name: 'Entrega Final', status: 'pending' }
                  ];

                  const completedStagesCount = stages.filter(s => s.status === 'completed').length;
                  const progressPct = Math.round((completedStagesCount / stages.length) * 100);

                  const cycleStageStatus = async (stageId: string) => {
                    const currentStatusOrder: ('pending' | 'in_progress' | 'completed')[] = ['pending', 'in_progress', 'completed'];
                    const updatedStages = stages.map(stage => {
                      if (stage.id === stageId) {
                        const nextIdx = (currentStatusOrder.indexOf(stage.status) + 1) % currentStatusOrder.length;
                        return { ...stage, status: currentStatusOrder[nextIdx], updated_at: new Date().toISOString() };
                      }
                      return stage;
                    });

                    const updatedDraft = {
                      ...draft,
                      productionStages: updatedStages
                    };

                    // Optimistic state update
                    setDrafts(prev => prev.map(d => d.id === draft.id ? updatedDraft : d));

                    if (isSupabaseConfigured) {
                      try {
                        await syncSaveBudget(updatedDraft);
                        showToast('Status da etapa atualizado com sucesso!', 'success');
                      } catch (err) {
                        console.error('Erro ao salvar etapa no Supabase:', err);
                        showToast('Erro ao sincronizar etapa com o banco', 'error');
                      }
                    } else {
                      localStorage.setItem('mold_drafts', JSON.stringify(drafts.map(d => d.id === draft.id ? updatedDraft : d)));
                      showToast('Status da etapa salvo localmente!', 'success');
                    }
                  };

                  return (
                    <div key={draft.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                      
                      {/* Top bar info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-mono font-black text-slate-500 uppercase">OS REF: {draft.reference}</span>
                          <h3 className="text-sm font-extrabold text-slate-900 uppercase font-heading">{draft.clientName}</h3>
                          <p className="text-xs text-slate-500 font-semibold">{draft.moldDescription || 'Molde Injeção'}</p>
                        </div>
                        <div className="text-right sm:text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase font-heading">Progresso Total</span>
                          <span className="text-sm font-black text-blue-600 font-sans">{progressPct}% Concluído</span>
                        </div>
                      </div>

                      {/* Progress Line */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Interactive Stage Steps */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                        {stages.map(stage => {
                          const badgeColors = {
                            pending: 'bg-slate-50 border-slate-200 text-slate-500',
                            in_progress: 'bg-blue-50 border-blue-200 text-blue-600 animate-pulse',
                            completed: 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                          };

                          const labelNames = {
                            pending: 'Pendente',
                            in_progress: 'Executando',
                            completed: 'Concluído'
                          };

                          return (
                            <button
                              key={stage.id}
                              onClick={() => cycleStageStatus(stage.id)}
                              className={`p-3 border rounded-lg transition text-left cursor-pointer flex flex-col justify-between h-20 shadow-2xs hover:scale-[1.01] ${badgeColors[stage.status]}`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider block">{stage.name}</span>
                              <span className="text-[10px] mt-2 block font-extrabold uppercase text-right w-full">
                                {labelNames[stage.status]}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Módulo 2: Engenharia e BOM */}
        {appView === 'modulo2' && (
          <Modulo2Engenharia
            projects={erpProjects}
            approvedBudgets={drafts}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            showToast={showToast}
          />
        )}

        {/* Módulo 3: Planejamento PCP */}
        {appView === 'modulo3' && (
          <Modulo3PCP
            projects={erpProjects}
            onSaveProject={handleSaveProject}
            showToast={showToast}
          />
        )}

        {/* Módulo 4: Almoxarifado e Estoque */}
        {appView === 'modulo4' && (
          <Modulo4Estoque
            rawStock={erpRawStock}
            stdStock={erpStdStock}
            tools={erpTools}
            projects={erpProjects}
            onSaveRawStock={setErpRawStock}
            onSaveStdStock={setErpStdStock}
            onSaveTools={setErpTools}
            showToast={showToast}
            triggerPurchaseRequest={handleTriggerPurchaseRequest}
          />
        )}

        {/* Módulo 5: Chão de Fábrica */}
        {appView === 'modulo5' && (
          <Modulo5ChaoDeFabrica
            projects={erpProjects}
            onSaveProject={handleSaveProject}
            showToast={showToast}
          />
        )}

        {/* Módulo 6: Controle de Qualidade */}
        {appView === 'modulo6' && (
          <Modulo6Qualidade
            inspections={erpAudits}
            nonConformances={erpRncs}
            projects={erpProjects}
            rawStock={erpRawStock}
            onSaveInspections={setErpAudits}
            onSaveNonConformances={setErpRncs}
            onSaveProject={handleSaveProject}
            showToast={showToast}
          />
        )}

        {/* Módulo 7: Custos e Controladoria */}
        {appView === 'modulo7' && (
          <Modulo7Custos
            projects={erpProjects}
            onSaveProject={handleSaveProject}
            showToast={showToast}
          />
        )}

        {/* Módulo 8: Financeiro e Fluxo de Caixa */}
        {appView === 'modulo8' && (
          <Modulo8Financeiro
            milestones={erpMilestones}
            transactions={erpTransactions}
            projects={erpProjects}
            onSaveMilestones={setErpMilestones}
            onSaveTransactions={setErpTransactions}
            showToast={showToast}
          />
        )}

        {/* Módulo 9: Compras e Cotações */}
        {appView === 'modulo9' && (
          <PurchasingModule
            canManage={userProfile?.role === 'admin' || userProfile?.role === 'manager' || !!userProfile?.permissions?.compras?.edit}
            showToast={showToast}
          />
        )}

        {/* Módulo 10: Manutenção de Moldes */}
        {appView === 'modulo10' && (
          <Modulo10Manutencao
            logs={erpMaintLogs}
            projects={erpProjects}
            onSaveLogs={setErpMaintLogs}
            showToast={showToast}
          />
        )}

        {appView === 'rh' && (
          <ModuloRH
            canManage={userProfile?.role === 'admin' || userProfile?.role === 'manager' || !!userProfile?.permissions?.rh?.edit}
            operations={workflowOperations}
            onAssignOperation={handleAssignOperation}
            showToast={showToast}
          />
        )}

        {appView === 'fornecedores' && (
          <SuppliersModule
            canManage={userProfile?.role === 'admin' || userProfile?.role === 'manager' || !!userProfile?.permissions?.compras?.edit}
            showToast={showToast}
          />
        )}

        {appView === 'projetos' && (
          <IndustrialProjectsModule
            canManage={userProfile?.role === 'admin' || userProfile?.role === 'manager' || !!userProfile?.permissions?.producao?.edit}
            showToast={showToast}
          />
        )}

        {/* Módulo 11: Business Intelligence */}
        {appView === 'modulo11' && (
          <Modulo11BI
            onNavigate={setAppView}
            projects={erpProjects}
            transactions={erpTransactions}
            requests={erpRequests}
          />
        )}

        {appView === 'acessos' && userProfile?.role === 'admin' && (
          <div className="space-y-6 animate-fadeIn pb-12">
            
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black text-[#0F2A43] font-heading uppercase tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#2563A8]" />
                  Painel de Usuários & Matriz de Permissões
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastre novos colaboradores, defina setores e configure as permissões individuais para cada etapa do funil industrial.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedProfileForEdit(null);
                    setFormName('');
                    setFormEmail('');
                    setFormPhone('');
                    setFormRole('viewer');
                    setFormStatus('pending');
                    setFormSector('Comercial');
                    setFormOrg('Unidade Alpha Matrix');
                    // Reset to default
                    setFormPermissions({
                      'Comercial': { view: true, create: true, edit: false, delete: false, approve: false },
                      'Engenharia': { view: true, create: false, edit: false, delete: false, approve: false },
                      'PCP': { view: true, create: false, edit: false, delete: false, approve: false },
                      'Produção': { view: true, create: false, edit: false, delete: false, approve: false },
                      'Almoxarifado': { view: true, create: false, edit: false, delete: false, approve: false },
                      'Compras': { view: true, create: false, edit: false, delete: false, approve: false },
                      'Qualidade': { view: true, create: false, edit: false, delete: false, approve: false },
                      'Controladoria': { view: true, create: false, edit: false, delete: false, approve: false },
                      'Financeiro': { view: true, create: false, edit: false, delete: false, approve: false },
                      'Manutenção': { view: true, create: false, edit: false, delete: false, approve: false },
                      'BI': { view: true, create: false, edit: false, delete: false, approve: false },
                    });
                    setIsUserFormOpen(true);
                  }}
                  className="px-4 py-2 bg-[#2563A8] hover:bg-[#1A3F6F] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Novo Usuário
                </button>
                <button
                  onClick={() => setAppView('modulo11')}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Dashboard 360°
                </button>
              </div>
            </div>

            {/* BANNER REGRA DE NEGÓCIO */}
            <div className="bg-[#0F2A43] text-white p-4 rounded-xl border border-[#1A3F6F] text-xs leading-relaxed flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <strong>🛡️ Segurança e Rastreabilidade Matrix System:</strong>
                <p className="text-slate-300">Cada ação de criação, edição ou aprovação fica permanentemente registrada sob a assinatura do colaborador logado. Usuários inativos ou pendentes de aprovação têm acesso imediatamente bloqueado.</p>
              </div>
              <div className="shrink-0 bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase text-center">
                Total RLS Ativo
              </div>
            </div>

            {/* MAIN LIST TABLE */}
            {profileLoading ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-xl space-y-2">
                <svg className="animate-spin h-8 w-8 text-[#2563A8] mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-slate-500 text-xs font-semibold">Buscando perfis reais de usuários no banco de dados...</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Colaborador / Código</th>
                        <th className="p-4">E-mail Corporativo</th>
                        <th className="p-4">Setor Vinculado</th>
                        <th className="p-4">Papel / Nível</th>
                        <th className="p-4">Status de Ativação</th>
                        <th className="p-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {profilesList.map(profile => {
                        // Cast as any for local dynamic additions
                        const prof = profile as any;
                        const sector = prof.sector || 'Comercial';

                        return (
                          <tr key={profile.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{profile.full_name || 'Usuário Sem Nome'}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{profile.id}</div>
                            </td>
                            <td className="p-4 text-slate-600 font-mono">{profile.email}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                {sector}
                              </span>
                            </td>
                            <td className="p-4">
                              <select
                                value={profile.role}
                                onChange={(e) => handleUpdateProfile(profile.id, { role: e.target.value as any })}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="admin">Administrador (Total)</option>
                                <option value="manager">Gestor de Setor</option>
                                <option value="operator">Operador Técnico</option>
                                <option value="viewer">Convidado / Leitura</option>
                              </select>
                            </td>
                            <td className="p-4">
                              <select
                                value={profile.status}
                                onChange={(e) => handleUpdateProfile(profile.id, { status: e.target.value as any })}
                                className={`px-2 py-1 border rounded-lg text-xs font-black cursor-pointer focus:ring-1 focus:ring-indigo-500 ${
                                  profile.status === 'active' 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                    : profile.status === 'pending'
                                      ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                                      : 'bg-red-50 border-red-200 text-red-700'
                                }`}
                              >
                                <option value="active">✓ Ativo (Autorizado)</option>
                                <option value="pending">⏳ Aguardando Ativação</option>
                                <option value="inactive">🚫 Inativo (Bloqueado)</option>
                              </select>
                            </td>
                            <td className="p-4 text-center space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedProfileForEdit(profile);
                                  setFormName(profile.full_name);
                                  setFormEmail(profile.email);
                                  setFormPhone(profile.phone || '');
                                  setFormRole(profile.role);
                                  setFormStatus(profile.status);
                                  setFormSector(prof.sector || 'Comercial');
                                  setFormOrg(profile.organization || 'Unidade Alpha Matrix');
                                  if (prof.permissions) {
                                    setFormPermissions(displayPermissions(prof.permissions));
                                  } else {
                                    // Default permissions based on role
                                    const isAdmin = profile.role === 'admin' || profile.role === 'manager';
                                    const defaultPerms: any = {};
                                    ['Comercial', 'Engenharia', 'PCP', 'Produção', 'Almoxarifado', 'Compras', 'Qualidade', 'Controladoria', 'Financeiro', 'Manutenção', 'BI'].forEach(mod => {
                                      defaultPerms[mod] = {
                                        view: true,
                                        create: isAdmin,
                                        edit: isAdmin,
                                        delete: profile.role === 'admin',
                                        approve: profile.role === 'admin',
                                      };
                                    });
                                    setFormPermissions(defaultPerms);
                                  }
                                  setIsUserFormOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition"
                                title="Editar Usuário & Matriz"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja remover o colaborador ${profile.full_name}?`)) {
                                  handleUpdateProfile(profile.id, { status: 'inactive' });
                                    showToast('A conta foi desativada. O histórico de auditoria foi preservado.', 'success');
                                  }
                                }}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                                title="Desativar usuário"
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
            )}

            {/* FORM MODAL WITH PERMISSION MATRIX */}
            {isUserFormOpen && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
                  {/* Modal Header */}
                  <div className="p-5 bg-[#0F2A43] text-white flex items-center justify-between border-b">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#C8A435]" />
                      <div>
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-100">
                          {selectedProfileForEdit ? 'Configurar Cadastro & Permissões' : 'Cadastrar Novo Colaborador'}
                        </h3>
                        <p className="text-[10px] text-slate-300 mt-0.5">Defina os parâmetros de acesso do usuário no Matrix System</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsUserFormOpen(false)}
                      className="text-slate-300 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                    
                    {/* Basic info row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-700 uppercase block tracking-wider">Nome Completo</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2563A8] outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-700 uppercase block tracking-wider">E-mail Corporativo</label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="Ex: joao@empresa.com"
                          disabled={!!selectedProfileForEdit}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2563A8] outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        {selectedProfileForEdit && <p className="text-[9px] leading-snug text-slate-400">O e-mail de login é administrado pelo Supabase e não pode ser alterado nesta tela.</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-700 uppercase block tracking-wider">Telefone / WhatsApp do Colaborador</label>
                        <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Ex: (11) 99999-9999" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2563A8] outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-700 uppercase block tracking-wider">Setor Primário</label>
                        <select
                          value={formSector}
                          onChange={(e) => setFormSector(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2563A8] outline-none bg-white cursor-pointer font-bold"
                        >
                          <option value="Comercial">1. Comercial & CRM</option>
                          <option value="Engenharia">2. Engenharia & Projetos</option>
                          <option value="PCP">3. Planejamento PCP</option>
                          <option value="Produção">4. Produção / Usinagem</option>
                          <option value="Almoxarifado">5. Almoxarifado / Estoque</option>
                          <option value="Compras">6. Compras & Contratos</option>
                          <option value="Qualidade">7. Qualidade & NC</option>
                          <option value="Financeiro">8. Controladoria / Financeiro</option>
                          <option value="Manutenção">9. Manutenção & Engenhos</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-700 uppercase block tracking-wider">Papel Global</label>
                        <select
                          value={formRole}
                          onChange={(e) => {
                            const newRole = e.target.value as any;
                            setFormRole(newRole);
                            // Auto-adjust permissions Matrix to guide user
                            const isAd = newRole === 'admin' || newRole === 'manager';
                            const updated: any = { ...formPermissions };
                            Object.keys(updated).forEach(mod => {
                              updated[mod] = {
                                view: true,
                                create: isAd,
                                edit: isAd,
                                delete: newRole === 'admin',
                                approve: newRole === 'admin',
                              };
                            });
                            setFormPermissions(updated);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2563A8] outline-none bg-white cursor-pointer font-bold"
                        >
                          <option value="admin">Administrador (Total)</option>
                          <option value="manager">Gestor de Setor</option>
                          <option value="operator">Operador Técnico</option>
                          <option value="viewer">Convidado / Leitura</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-700 uppercase block tracking-wider">Status Inicial</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2563A8] outline-none bg-white cursor-pointer font-bold"
                        >
                          <option value="active">Ativo (Permitir Entrada)</option>
                          <option value="pending">Aguardando Ativação</option>
                          <option value="inactive">Inativo (Bloquear Entrada)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-700 uppercase block tracking-wider">Organização Autorizada</label>
                        <input
                          type="text"
                          value={formOrg}
                          onChange={(e) => setFormOrg(e.target.value)}
                          placeholder="Ex: Matriz Alpha"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2563A8] outline-none"
                        />
                      </div>
                    </div>

                    {/* GRANULAR PERMISSION MATRIX TABLE */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-[#0F2A43] uppercase tracking-wider">
                          Matriz de Permissões por Módulo do Funil
                        </h4>
                        <span className="text-[10px] text-slate-400">Marque as caixas para outorgar privilégios específicos</span>
                      </div>

                      <div className="bg-slate-50 border rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 border-b text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center">
                              <th className="p-2 text-left w-1/4">Etapa do Funil</th>
                              <th className="p-2">Visualizar</th>
                              <th className="p-2">Criar</th>
                              <th className="p-2">Editar</th>
                              <th className="p-2">Excluir</th>
                              <th className="p-2">Aprovar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-bold">
                            {['Comercial', 'Engenharia', 'PCP', 'Produção', 'Almoxarifado', 'Compras', 'Qualidade', 'Controladoria', 'Financeiro', 'Manutenção', 'BI'].map((modName) => {
                              const rights = formPermissions[modName] || { view: true, create: false, edit: false, delete: false, approve: false };
                              
                              const toggleRight = (right: 'view' | 'create' | 'edit' | 'delete' | 'approve') => {
                                setFormPermissions(prev => ({
                                  ...prev,
                                  [modName]: {
                                    ...prev[modName],
                                    [right]: !rights[right]
                                  }
                                }));
                              };

                              return (
                                <tr key={modName} className="hover:bg-slate-100/50 transition">
                                  <td className="p-2.5 text-slate-900 text-left font-extrabold">{modName}</td>
                                  <td className="p-2.5 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={rights.view} 
                                      onChange={() => toggleRight('view')} 
                                      className="h-3.5 w-3.5 rounded text-[#2563A8] border-slate-300 focus:ring-[#2563A8] cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={rights.create} 
                                      onChange={() => toggleRight('create')} 
                                      className="h-3.5 w-3.5 rounded text-[#2563A8] border-slate-300 focus:ring-[#2563A8] cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={rights.edit} 
                                      onChange={() => toggleRight('edit')} 
                                      className="h-3.5 w-3.5 rounded text-[#2563A8] border-slate-300 focus:ring-[#2563A8] cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={rights.delete} 
                                      onChange={() => toggleRight('delete')} 
                                      className="h-3.5 w-3.5 rounded text-[#2563A8] border-slate-300 focus:ring-[#2563A8] cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={rights.approve} 
                                      onChange={() => toggleRight('approve')} 
                                      className="h-3.5 w-3.5 rounded text-[#2563A8] border-slate-300 focus:ring-[#2563A8] cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => setIsUserFormOpen(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        if (!formName.trim() || !formEmail.trim()) {
                          showToast('Por favor, preencha o nome e o e-mail corporativo!', 'error');
                          return;
                        }

                        if (selectedProfileForEdit) {
                          // Editing collaborator CRUD
                          const updatedProfile = {
                            ...selectedProfileForEdit,
                            full_name: formName,
                            email: formEmail,
                            role: formRole,
                            status: formStatus,
                            organization: formOrg,
                            phone: formPhone,
                            sector: formSector,
                            permissions: normalizePermissions(formPermissions),
                            updated_at: new Date().toISOString()
                          };
                          const saved = await handleUpdateProfile(selectedProfileForEdit.id, updatedProfile);
                          if (saved) setIsUserFormOpen(false);
                        } else {
                          // Auth accounts must be created through the Supabase invitation/sign-up flow.
                          showToast('A conta deve ser criada pelo próprio usuário via cadastro. Após isso, ela aparecerá aqui para aprovação e permissões.', 'info');
                          setIsUserFormOpen(false);
                        }
                      }}
                      className="px-5 py-2 bg-[#2563A8] hover:bg-[#1A3F6F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md uppercase tracking-wider"
                    >
                      <Check className="w-4 h-4" />
                      Salvar Cadastro
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 7. GERENCIAR ORGANIZAÇÃO ADMIN SCREEN */}
        {appView === 'organizacao' && userProfile?.role === 'admin' && (
          <OrganizationAdminScreen 
            onBack={() => setAppView('home')} 
            showToast={showToast} 
          />
        )}

      </main>

      {/* PERSISTENT MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A] border-t-2 border-slate-800 flex justify-around py-2 px-3 md:hidden shadow-lg text-slate-400">
        <button
          onClick={() => setAppView('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${appView === 'home' ? 'text-white font-bold bg-slate-800/60' : 'hover:text-white'}`}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Histórico</span>
        </button>
        <button
          onClick={() => {
            handleGeralNovo();
            setAppView('editor');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${appView === 'editor' ? 'text-white font-bold bg-slate-800/60' : 'hover:text-white'}`}
        >
          <Plus className="w-4 h-4 text-[#EA580C]" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Novo</span>
        </button>
        <button
          onClick={() => setAppView('clientes')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${appView === 'clientes' ? 'text-white font-bold bg-slate-800/60' : 'hover:text-white'}`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Clientes</span>
        </button>
      </nav>

      {approvalDraft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#2d6db2]">Transição comercial → produção</p>
            <h3 className="mt-1 text-xl font-black text-slate-800">Liberar ordem de fabricação</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">A aprovação registra o orçamento, gera a OS e abre o projeto em Engenharia. Esta ação fica rastreada no banco.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-[10px] font-bold uppercase text-slate-500">Código da OS<input value={approvalProjectCode} onChange={e => setApprovalProjectCode(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none" /></label>
              <label className="grid gap-1 text-[10px] font-bold uppercase text-slate-500">Prazo de entrega<input type="date" value={approvalDueDate} onChange={e => setApprovalDueDate(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setApprovalDraft(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button><button onClick={async () => { if (!approvalProjectCode.trim() || !approvalDueDate) return showToast('Informe o código da OS e a data de entrega.', 'error'); try { const updated = {...approvalDraft, status:'approved' as const}; await syncSaveBudget(updated); await approveBudgetToProject(approvalDraft.id, approvalProjectCode.trim(), approvalDueDate, userProfile?.id); createFinancialAgreement(updated, approvalProjectCode.trim(), new Date().toISOString().split('T')[0]); setDrafts(prev => prev.map(d => d.id === approvalDraft.id ? updated : d)); setApprovalDraft(null); setAppView('projetos'); showToast(`OS ${approvalProjectCode} criada e acordos financeiros lançados.`, 'success'); } catch (error:any) { showToast(error.message || 'Não foi possível criar a ordem de fabricação.', 'error'); } }} className="rh-primary">Confirmar, gerar OS e acordos</button></div>
          </div>
        </div>
      )}

      {/* Settings Modal Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        serviceRates={internalServices}
        onSaveServiceRates={handleSaveServiceRates}
        onResetToDefaults={handleResetToDefaults}
        rawMaterials={rawMaterials}
        onSaveRawMaterials={handleSaveRawMaterials}
        machiningTypes={machiningTypes}
        standardComponents={erpStdStock}
        onSaveStandardComponents={(components) => {
          setErpStdStock(components);
          if (isSupabaseConfigured) {
            syncSaveStandardComponents(components)
              .then(() => showToast('Catálogo de componentes salvo no Supabase.', 'success'))
              .catch((error) => showToast(error?.message || 'Não foi possível salvar o catálogo de componentes.', 'error'));
          }
        }}
        onSaveMachiningTypes={(types) => {
          setMachiningTypes(types);
          localStorage.setItem('orcamolde_machining_types', JSON.stringify(types));
          showToast('Parâmetros de usinagem salvos com sucesso!');
        }}
      />

      {/* Supabase Schema Migration Guide Modal */}
      {showSchemaGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛠️</span>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-[#EA580C]">Configuração de Banco de Dados</h3>
                  <p className="text-[10px] text-slate-400">Como inicializar o seu banco de dados Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setShowSchemaGuide(false)}
                className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-orange-400">Passos para Configuração:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                  <li>Acesse o seu painel do <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline font-bold">Supabase Console</a>.</li>
                  <li>Selecione o seu projeto correspondente.</li>
                  <li>No menu lateral esquerdo, clique em <strong>SQL Editor</strong> (ícone de terminal/documento).</li>
                  <li>Clique em <strong>"New query"</strong> (ou "New Blank Query").</li>
                  <li>Cole o código SQL abaixo no editor e clique no botão <strong>"Run"</strong> no canto inferior direito.</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Script SQL de Inicialização</span>
                  <button
                    onClick={handleCopySQL}
                    className="px-3 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] overflow-auto max-h-60 text-slate-300 select-all leading-normal whitespace-pre">Use as migrações versionadas em supabase/migrations, na ordem cronológica. Elas criam a estrutura corporativa, RLS e o fluxo de produção. Não execute o script legado de demonstração.</pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSchemaGuide(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

const MIGRATION_SQL = `-- Migration: Initial Schema for Axemet CRM Tool
-- Tables: profiles, clients, budgets, materials, services, machining_types

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES Table (links with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'viewer',
  status TEXT DEFAULT 'pending',
  organization TEXT DEFAULT 'Axemet Solution LTDA',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure the columns exist if the table was pre-existing (Supabase templates workaround)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT 'Axemet Solution LTDA';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable full access for admins" ON public.profiles;

CREATE POLICY "Enable read access for all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable update for users own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable full access for admins" ON public.profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
  )
);

-- Trigger to automatically create a profile for new auth users (Case-insensitive check)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status, organization)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN LOWER(NEW.email) = 'filipesantos.ind85@gmail.com' THEN 'admin' ELSE 'viewer' END,
    CASE WHEN LOWER(NEW.email) = 'filipesantos.ind85@gmail.com' THEN 'active' ELSE 'pending' END,
    'Axemet Solution LTDA'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CLIENTS Table
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  corporate_name TEXT,
  cnpj TEXT,
  state_inscription TEXT,
  phone TEXT,
  email TEXT,
  responsible TEXT,
  cep TEXT,
  address TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all clients" ON public.clients;
DROP POLICY IF EXISTS "Enable insert for all clients" ON public.clients;
DROP POLICY IF EXISTS "Enable update for all clients" ON public.clients;
DROP POLICY IF EXISTS "Enable delete for all clients" ON public.clients;

CREATE POLICY "Enable read access for all clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all clients" ON public.clients FOR DELETE USING (true);

-- 3. MATERIALS Table (Database of Raw Materials)
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  density NUMERIC NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all materials" ON public.materials;
DROP POLICY IF EXISTS "Enable write access for all materials" ON public.materials;

CREATE POLICY "Enable read access for all materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Enable write access for all materials" ON public.materials FOR ALL USING (true);

-- 4. SERVICES Table (Database of Service Rates)
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  val_unit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all services" ON public.services;
DROP POLICY IF EXISTS "Enable write access for all services" ON public.services;

CREATE POLICY "Enable read access for all services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Enable write access for all services" ON public.services FOR ALL USING (true);

-- 5. MACHINING TYPES Table (Database of Machining Rates)
CREATE TABLE IF NOT EXISTS public.machining_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Machining Types
ALTER TABLE public.machining_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all machining_types" ON public.machining_types;
DROP POLICY IF EXISTS "Enable write access for all machining_types" ON public.machining_types;

CREATE POLICY "Enable read access for all machining_types" ON public.machining_types FOR SELECT USING (true);
CREATE POLICY "Enable write access for all machining_types" ON public.machining_types FOR ALL USING (true);

-- 6. BUDGETS Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reference TEXT,
  client_name TEXT NOT NULL,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_name TEXT,
  mold_type TEXT,
  molding_material TEXT,
  product_quantity INTEGER DEFAULT 1000,
  delivery_time TEXT,
  observations TEXT,
  status TEXT DEFAULT 'draft',
  mold_description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  mold_width NUMERIC DEFAULT 0,
  mold_length NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_value NUMERIC DEFAULT 0,
  totals JSONB NOT NULL,
  config JSONB NOT NULL,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  third_party_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  machining_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all budgets" ON public.budgets;
DROP POLICY IF EXISTS "Enable insert for all budgets" ON public.budgets;
DROP POLICY IF EXISTS "Enable update for all budgets" ON public.budgets;
DROP POLICY IF EXISTS "Enable delete for all budgets" ON public.budgets;

CREATE POLICY "Enable read access for all budgets" ON public.budgets FOR SELECT USING (true);
CREATE POLICY "Enable insert for all budgets" ON public.budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all budgets" ON public.budgets FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all budgets" ON public.budgets FOR DELETE USING (true);


-- ==========================================
-- SEED DATA (Default configurations)
-- ==========================================

-- Seed Materials (Raw Materials)
INSERT INTO public.materials (id, name, density, price_per_kg) VALUES
  ('mat_1045', 'Aço 1045', 7.85, 11.50),
  ('mat_p20', 'Aço P20', 7.85, 25.00),
  ('mat_cobre', 'Cobre', 2.25, 65.00),
  ('mat_aluminio', 'Alumínio', 2.70, 45.00),
  ('mat_h13', 'Aço H13', 7.85, 55.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  density = EXCLUDED.density,
  price_per_kg = EXCLUDED.price_per_kg;

-- Seed Services (Service Rates)
INSERT INTO public.services (id, name, unit, val_unit) VALUES
  ('srv_0', 'Projeto', 'dia', 550.00),
  ('srv_1', 'Usinagem Alumínio', 'h', 100.00),
  ('srv_2', 'Usinagem Aço', 'h', 160.00),
  ('srv_3', 'Usinagem Aço Temperado', 'h', 200.00),
  ('srv_4', 'Erosão', 'h', 75.00),
  ('srv_5', 'Matrizaria', 'dia', 550.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  val_unit = EXCLUDED.val_unit;

-- Seed Machining Types (Machining Rates)
INSERT INTO public.machining_types (id, name, hourly_rate) VALUES
  ('mt_fresa', 'Usinagem Aço', 160.0),
  ('mt_fresa_temp', 'Usinagem Aço Temperado', 200.0),
  ('mt_fresa_alum', 'Usinagem Alumínio', 100.0),
  ('mt_erosao', 'Erosão', 75.0),
  ('mt_retifica', 'Retífica', 120.0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  hourly_rate = EXCLUDED.hourly_rate;

-- Seed some default clients for immediate utility if none exist
INSERT INTO public.clients (id, name, cnpj, phone, email, city) VALUES
  ('client_1', 'Metalúrgica Aliança S/A', '98.765.432/0001-00', '(47) 3456-7890', 'suprimentos@alianca.com', 'Caxias do Sul - RS'),
  ('client_2', 'Metalúrgica Teste Ltda.', '12.345.678/0001-99', '(11) 98765-4321', 'compras@metaltes.com', 'Joinville - SC'),
  ('client_3', 'Plásticos do Brasil S.A.', '45.678.901/0001-22', '(19) 3211-5544', 'contato@plasticosbr.com', 'Sorocaba - SP')
ON CONFLICT (id) DO NOTHING;
`;
