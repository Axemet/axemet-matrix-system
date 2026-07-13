/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MaterialItem {
  id: string;
  name: string;
  isAuto: boolean;
  qtd: number;
  comp: number;
  larg: number;
  esp: number;
  material: string;
  valKg: number;
  dens: number;
  total: number;
  formulaDescription?: string;
  machiningTimes?: { [machiningTypeId: string]: number };
}

export interface RawMaterial {
  id: string;
  name: string;
  density: number;
  pricePerKg: number;
}

export interface ThirdPartyItem {
  id: string;
  description: string;
  qtd: number;
  valUnit: number;
  total: number;
}

export interface InternalServiceItem {
  id: string;
  name: string;
  unit: 'dia' | 'h';
  valUnit: number;
  qtd: number;
  total: number;
}

export interface ConfigParams {
  p20Price: number;
  steel1045Price: number;
  defaultDensity: number;
  electrodeDensity: number;
  commission: number; // in %
  tax: number; // in %
  multiplier: number;
  commercialMarkup: number;
}

export interface Client {
  id: string;
  name: string; // Used as Nome Fantasia / Nome do Cliente
  corporateName?: string; // Razão Social
  cnpj?: string;
  stateInscription?: string; // IE - Inscrição Estadual
  phone?: string;
  email?: string;
  responsible?: string; // Responsável / Contato
  cep?: string;
  address?: string; // Logradouro
  number?: string; // Número
  neighborhood?: string; // Bairro
  city?: string;
  state?: string; // UF / Estado
}

export interface BudgetDraft {
  id: string;
  reference?: string;
  clientName: string;
  contactName?: string;
  moldType?: string;
  moldingMaterial?: string;
  productQuantity?: number;
  deliveryTime?: string;
  observations?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  moldDescription: string;
  date: string;
  moldWidth: number;
  moldLength: number;
  materials: MaterialItem[];
  thirdPartyItems: ThirdPartyItem[];
  internalServices: InternalServiceItem[];
  config: ConfigParams;
  discountPercent?: number;
  discountValue?: number;
  proposalItems?: ProposalItem[];
  commercialTerms?: CommercialTerms;
  representativeName?: string;
  representativePhone?: string;
  representativeEmail?: string;
  totals: {
    materialsTotal: number;
    thirdPartyTotal: number;
    internalTotal: number;
    baseCost: number;
    costWithMultiplier: number;
    totalBeforeTaxes: number;
    commissionAmount: number;
    taxAmount: number;
    finalPrice: number;
    effectiveMarkup: number;
  };
  machiningTypes?: MachiningType[];
  productionStages?: ProductionStage[];
  crmStatus?: 'lead' | 'quoting' | 'negotiating' | 'won' | 'lost' | 'production' | 'delivered';
}

export interface ProposalItem {
  id: string;
  /** Título técnico do conjunto/ferramental calculado. */
  title?: string;
  /** Tipo de molde que será apresentado ao cliente na proposta. */
  description: string;
  quantity: number;
  unitPrice: number;
  sourceTechnicalReference?: string;
}

export interface CommercialBillingEvent {
  id: string;
  description: string;
  percent: number;
  dueDays: number;
}

export interface CommercialTerms {
  scope: string;
  validityDays: number;
  paymentTerms: string;
  freightTerms: string;
  billingSchedule: CommercialBillingEvent[];
}

export interface ProductionStage {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  completionPercent: number;
  startDate?: string;
  endDate?: string;
  responsible?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  organization: string;
  sector?: string;
  phone?: string;
  permissions?: Record<string, { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean; approve?: boolean }>;
  updated_at: string;
}

export interface MachiningType {
  id: string;
  name: string;
  hourlyRate: number;
}

// --- NEW ENHANCED MATRIZARIA ERP ENTITIES (MODULES 2 TO 11) ---

export interface BOMItem {
  id: string;
  subprojectId?: string;
  name: string;
  material: string;
  source: 'internal' | 'standard';
  dimensions?: string; // Ex: "50x300x300"
  qty: number;
  weightBruto?: number;
  weightLiquido?: number;
  catalog?: 'Hasco' | 'DME' | 'Meusburger' | 'Polimold' | 'Outro';
  catalogCode?: string;
  status: 'pending' | 'ordered' | 'received' | 'machining' | 'completed';
  operations: Operation[];
}

export interface Subproject {
  id: string;
  name: string;
  description: string;
}

export interface Operation {
  id: string;
  bomItemId: string;
  name: string; // Ex: "Fresamento CNC", "Furação", "Retífica", "EDM", "Polimento"
  workCenter: string; // Machine or bench
  setupTime: number; // estimated setup in min
  cycleTime: number; // estimated cycle in min
  queueTime: number; // wait time in hours
  tools: string[];
  cncProgram?: string;
  operator?: string;
  status: 'pending' | 'in_progress' | 'completed';
  realSetupTime?: number;
  realCycleTime?: number;
  startDate?: string;
  endDate?: string;
}

export interface Revision {
  id: string;
  version: string; // Ex: "R01", "R02"
  author: string;
  date: string;
  description: string;
  reason: string;
}

export interface ProjectCosts {
  orçado: number;
  real: number;
  detalhado: {
    materials: number;
    normalizados: number;
    horasMaquina: number;
    maoDeObra: number;
    terceiros: number;
    refugo: number;
  };
}

export interface ProjectDoc {
  id: string;
  name: string;
  type: '2D' | '3D' | 'cert' | 'meas';
  url: string;
  date: string;
}

export interface MatrixProject {
  id: string; // Matches BudgetDraft.id when approved
  reference: string;
  clientName: string;
  moldDescription: string;
  moldType: string;
  moldingMaterial: string;
  productQuantity: number;
  deliveryTime: string;
  status: 'planning' | 'production' | 'tryout' | 'delivered' | 'warranty' | 'completed';
  date: string;
  moldWidth: number;
  moldLength: number;
  subprojects: Subproject[];
  bom: BOMItem[];
  revisions: Revision[];
  costs: ProjectCosts;
  documents: ProjectDoc[];
}

// --- MODULE 4: MATERIALS AND STOCK ---

export interface RawMaterialStock {
  id: string;
  type: string; // Ex: "P20", "H13", "1045", "4140"
  dimensions: string; // "Espessura x Largura x Comprimento"
  weight: number; // in Kg
  batch: string; // Corrida / Lote do Fornecedor
  certificateUrl?: string; // Link/nome de arquivo do certificado de qualidade
  status: 'available' | 'reserved' | 'consumed';
  reservedForProjId?: string;
  qualityDureza?: string; // Ex: "32-35 HRC"
}

export interface StandardComponentStock {
  id: string;
  catalog: 'Hasco' | 'DME' | 'Meusburger' | 'Polimold' | 'Outro';
  code: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
}

export interface CuttingTool {
  id: string;
  name: string; // Ex: "Fresa de Topo Metal Duro Ø12"
  lifeHours: number; // estimated life span in hours
  usedHours: number;
  status: 'active' | 'warning' | 'expired';
}

// --- MODULE 6: QUALITY & DIMENSIONAL CONTROL ---

export interface QualityInspection {
  id: string;
  projectId: string;
  projectName: string;
  bomItemId: string;
  bomItemName: string;
  operatorName: string;
  date: string;
  dimensionsMeasured: {
    quotaName: string; // Ex: "Furo H7 Ø12"
    nominal: number;
    real: number;
    deviation: number;
    status: 'ok' | 'fail';
  }[];
  overallStatus: 'approved' | 'rejected' | 'rework';
  cmmReportUrl?: string;
  nonConformanceId?: string;
}

export interface NonConformance {
  id: string;
  projectId: string;
  projectName: string;
  bomItemId: string;
  bomItemName: string;
  classification: 'refugo' | 'retrabalho' | 'desvio_aceito';
  rootCause5Whys: string[]; // 5 porquês
  ishikawa: {
    method: string;
    machine: string;
    material: string;
    manpower: string;
    measurement: string;
    environment: string;
  };
  actionPlan: string;
  responsible: string;
  deadline: string;
  cost: number;
  status: 'open' | 'closed';
}

// --- MODULE 8: FINANCE & BILLING ---

export interface BillingMilestone {
  id: string;
  projectId: string;
  projectName: string;
  description: string; // Ex: "Assinatura Contrato", "Aprovação Try-out", "Entrega do Molde"
  percent: number;
  value: number;
  dueDate: string;
  status: 'pending' | 'billed' | 'paid';
}

export interface CashTransaction {
  id: string;
  projectId: string;
  projectName: string;
  type: 'receita' | 'despesa';
  category: 'material' | 'normalizado' | 'terceiro' | 'mão_de_obra' | 'energia' | 'cliente_faturamento' | 'outros';
  description: string;
  value: number;
  date: string;
  status: 'paid' | 'pending';
}

// --- MODULE 9: PROCUREMENT & PURCHASES ---

export interface PurchaseRequest {
  id: string;
  projectId: string;
  projectName: string;
  bomItemId?: string;
  itemType: 'materia_prima' | 'normalizado' | 'ferramenta' | 'servico_terceiro';
  description: string;
  qty: number;
  supplier?: string;
  quotedPrice?: number;
  status: 'pending_quote' | 'quoted' | 'approved' | 'ordered' | 'received';
  certificateUrl?: string;
}

// --- MODULE 10: MAINTENANCE & POST-DELIVERY ---

export interface MaintenanceLog {
  id: string;
  projectId: string;
  projectName: string;
  cycles: number; // accumulated cycles at maintenance
  type: 'preventative' | 'corrective';
  description: string;
  partsReplaced: string[];
  cost: number;
  date: string;
  responsible: string;
  isWarranty: boolean;
  status: 'open' | 'completed';
}
