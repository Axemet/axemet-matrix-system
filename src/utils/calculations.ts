/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaterialItem, ThirdPartyItem, InternalServiceItem, ConfigParams, BudgetDraft, RawMaterial } from '../types';

export function calculatePlateWeight(
  comp: number,
  larg: number,
  esp: number,
  qtd: number,
  dens: number
): number {
  if (comp < 0 || larg < 0 || esp < 0 || qtd < 0 || dens < 0) return 0;
  // Weight (kg) = (Comp * Larg * Esp * Qtd * Dens) / 1,000,000
  return (comp * larg * esp * qtd * dens) / 1000000;
}

export function calculatePlateCost(
  comp: number,
  larg: number,
  esp: number,
  qtd: number,
  dens: number,
  valKg: number
): number {
  const weight = calculatePlateWeight(comp, larg, esp, qtd, dens);
  return weight * valKg;
}

function findMaterialSpecs(
  materialName: string,
  rawMaterials: RawMaterial[],
  fallbackPrice: number,
  fallbackDensity: number
): { pricePerKg: number; density: number } {
  if (!rawMaterials || rawMaterials.length === 0) {
    return { pricePerKg: fallbackPrice, density: fallbackDensity };
  }
  const norm = materialName.toLowerCase().trim();
  // Exact or fuzzy search
  const found = rawMaterials.find(
    (rm) =>
      rm.name.toLowerCase().trim() === norm ||
      rm.name.toLowerCase().includes(norm) ||
      norm.includes(rm.name.toLowerCase())
  );
  if (found) {
    return { pricePerKg: found.pricePerKg, density: found.density };
  }
  return { pricePerKg: fallbackPrice, density: fallbackDensity };
}

/**
 * Generates the default set of material plates based on mold dimensions.
 */
export function generateDefaultMaterials(
  moldWidth: number,
  moldLength: number,
  config: ConfigParams,
  rawMaterials: RawMaterial[]
): MaterialItem[] {
  const w = moldWidth;
  const l = moldLength;

  const p20Specs = findMaterialSpecs('Aço P20', rawMaterials, config.p20Price, config.defaultDensity);
  const steel1045Specs = findMaterialSpecs('Aço 1045', rawMaterials, config.steel1045Price, config.defaultDensity);
  const copperSpecs = findMaterialSpecs('Cobre', rawMaterials, 65.0, config.electrodeDensity);

  return [
    {
      id: 'p1',
      name: 'P1',
      isAuto: true,
      qtd: 1,
      comp: l + 5,
      larg: w + 5,
      esp: 50, // default thickness, manual choice
      material: 'Aço P20',
      valKg: p20Specs.pricePerKg,
      dens: p20Specs.density,
      total: 0,
      formulaDescription: 'L + 5 x W + 5 (manual / P20)',
    },
    {
      id: 'p2',
      name: 'P2',
      isAuto: true,
      qtd: 1,
      comp: l + 5,
      larg: w + 5,
      esp: 37, // default thickness, manual choice
      material: 'Aço 1045',
      valKg: steel1045Specs.pricePerKg,
      dens: steel1045Specs.density,
      total: 0,
      formulaDescription: 'L + 5 x W + 5 (manual / 1045)',
    },
    {
      id: 'pbi_pbs',
      name: 'PBI / PBS',
      isAuto: true,
      qtd: 2,
      comp: l + 5 + 50, // +50 for ears (orelhas) and +5 for gap
      larg: w + 5,
      esp: 25,
      material: 'Aço 1045',
      valKg: steel1045Specs.pricePerKg,
      dens: steel1045Specs.density,
      total: 0,
      formulaDescription: 'Comp: L + 5 + 50 (orelhas) | Larg: W + 5',
    },
    {
      id: 'esp',
      name: 'ESP (Espaçador)',
      isAuto: true,
      qtd: 2,
      comp: l + 5,
      larg: 50, // standard width 50mm
      esp: 100, // standard thickness 100mm
      material: 'Aço 1045',
      valKg: steel1045Specs.pricePerKg,
      dens: steel1045Specs.density,
      total: 0,
      formulaDescription: 'Comp: L + 5 | Larg: 50mm (padrão) | Esp: 100mm',
    },
    {
      id: 'ps',
      name: 'PS (Placa Base)',
      isAuto: true,
      qtd: 1,
      comp: l + 5,
      larg: w + 5, // plate width (W+5)
      esp: 31, // standard thickness 31mm
      material: 'Aço 1045',
      valKg: steel1045Specs.pricePerKg,
      dens: steel1045Specs.density,
      total: 0,
      formulaDescription: 'Comp: L + 5 | Larg: W + 5 | Esp: 31mm',
    },
    {
      id: 'ch_ext',
      name: 'CH EXT (Chapa Extratora)',
      isAuto: true,
      qtd: 2,
      comp: l + 5,
      larg: Math.max(0, w + 5 - 100), // descontar 100 mm da larg do molde/placa (W + 5 - 100)
      esp: 16, // standard thickness 16mm
      material: 'Aço 1045',
      valKg: steel1045Specs.pricePerKg,
      dens: steel1045Specs.density,
      total: 0,
      formulaDescription: 'Comp: L + 5 | Larg: (W + 5) - 100 | Esp: 16mm',
    },
    {
      id: 'posticos',
      name: 'Postiços',
      isAuto: false,
      qtd: 0,
      comp: 0,
      larg: 0,
      esp: 0,
      material: 'Aço P20',
      valKg: p20Specs.pricePerKg,
      dens: p20Specs.density,
      total: 0,
      formulaDescription: 'Opcional, manual',
    },
    {
      id: 'gavetas',
      name: 'Gavetas',
      isAuto: false,
      qtd: 0,
      comp: 0,
      larg: 0,
      esp: 0,
      material: 'Aço P20',
      valKg: p20Specs.pricePerKg,
      dens: p20Specs.density,
      total: 0,
      formulaDescription: 'Opcional, manual',
    },
    {
      id: 'cunhas_reguas',
      name: 'Cunhas / Réguas',
      isAuto: false,
      qtd: 0,
      comp: 0,
      larg: 0,
      esp: 0,
      material: 'Aço 1045',
      valKg: steel1045Specs.pricePerKg,
      dens: steel1045Specs.density,
      total: 0,
      formulaDescription: 'Opcional, manual',
    },
    {
      id: 'eletrodos',
      name: 'Eletrodos',
      isAuto: false,
      qtd: 0,
      comp: 0,
      larg: 0,
      esp: 0,
      material: 'Cobre',
      valKg: copperSpecs.pricePerKg,
      dens: copperSpecs.density,
      total: 0,
      formulaDescription: 'Opcional, densidade 2.25',
    },
  ];
}

/**
 * Generates a clean set of material plates with all values initialized to 0.
 */
export function generateZeroMaterials(
  config: ConfigParams,
  rawMaterials: RawMaterial[]
): MaterialItem[] {
  const defaultMaterials = generateDefaultMaterials(0, 0, config, rawMaterials);
  return defaultMaterials.map((m) => ({
    ...m,
    qtd: 0,
    comp: 0,
    larg: 0,
    esp: 0,
    total: 0,
  }));
}

/**
 * Updates automatic plate dimensions when mold width/length change.
 * It respects which plates are isAuto.
 */
export function updateAutomaticPlates(
  moldWidth: number,
  moldLength: number,
  materials: MaterialItem[],
  config: ConfigParams,
  rawMaterials: RawMaterial[]
): MaterialItem[] {
  const w = moldWidth;
  const l = moldLength;

  return materials.map((item) => {
    // Find the latest price and density from rawMaterials using findMaterialSpecs helper
    const specs = findMaterialSpecs(item.material, rawMaterials, item.valKg, item.dens);
    const valKg = specs.pricePerKg;
    const dens = specs.density;

    if (!item.isAuto) {
      // Manual item, keep values but recalculate total with potentially updated dens/valKg from rawMaterials
      const total = calculatePlateCost(item.comp, item.larg, item.esp, item.qtd, dens, valKg);
      return { ...item, dens, valKg, total };
    }

    let comp = item.comp;
    let larg = item.larg;

    if (w === 0 && l === 0) {
      comp = 0;
      larg = 0;
    } else {
      switch (item.id) {
        case 'p1':
          comp = l > 0 ? l + 5 : 0;
          larg = w > 0 ? w + 5 : 0;
          break;
        case 'p2':
          comp = l > 0 ? l + 5 : 0;
          larg = w > 0 ? w + 5 : 0;
          break;
        case 'pbi_pbs':
          comp = l > 0 ? l + 5 + 50 : 0;
          larg = w > 0 ? w + 5 : 0;
          break;
        case 'esp':
          comp = l > 0 ? l + 5 : 0;
          larg = w > 0 ? 50 : 0;
          break;
        case 'ps':
          comp = l > 0 ? l + 5 : 0;
          larg = w > 0 ? w + 5 : 0;
          break;
        case 'ch_ext':
          comp = l > 0 ? l + 5 : 0;
          larg = w > 0 ? Math.max(0, w + 5 - 100) : 0;
          break;
      }
    }

    const total = calculatePlateCost(comp, larg, item.esp, item.qtd, dens, valKg);

    return {
      ...item,
      comp,
      larg,
      valKg,
      dens,
      total,
    };
  });
}

export function getMarginPercent(config: ConfigParams): number {
  const val = config.commercialMarkup !== undefined ? config.commercialMarkup : 30.0;
  // If it's a multiplier factor (e.g. 1.30), convert it to percentage (30%)
  if (val > 1.0 && val <= 2.5) {
    return Math.round((val - 1) * 100);
  }
  return val;
}

/**
 * Single source of truth for a proposal's commercial value.
 * A consolidated proposal is priced by its calculated technical items; a legacy
 * one-item draft falls back to its technical price less the negotiated discount.
 */
export function getCommercialBudgetValue(budget: Pick<BudgetDraft, 'proposalItems' | 'totals' | 'discountValue'>): number {
  const consolidated = (budget.proposalItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  return consolidated > 0
    ? consolidated
    : Math.max(0, (budget.totals?.finalPrice || 0) - (budget.discountValue || 0));
}

/**
 * Recalculates all totals based on the provided items and parameters.
 */
export function calculateTotals(
  materials: MaterialItem[],
  thirdPartyItems: ThirdPartyItem[],
  internalServices: InternalServiceItem[],
  config: ConfigParams
): BudgetDraft['totals'] {
  const materialsTotal = materials.reduce((acc, item) => acc + (item.total || 0), 0);
  const thirdPartyTotal = thirdPartyItems.reduce((acc, item) => acc + (item.total || 0), 0);
  const internalTotal = internalServices.reduce((acc, item) => acc + (item.total || 0), 0);

  const baseCost = materialsTotal + thirdPartyTotal + internalTotal;

  // First Factor: Technical Multiplier applied ONLY to Materials/Plates and Third-party items
  const subtotalSubjectToMultiplier = materialsTotal + thirdPartyTotal;
  const costWithMultiplier = (subtotalSubjectToMultiplier * config.multiplier) + internalTotal;

  // Pricing divisor: Selling Price with margin, taxes and commissions
  const margem = getMarginPercent(config);
  const comPercent = config.commission;
  const taxPercent = config.tax;
  const totalPercent = margem + comPercent + taxPercent;

  let markupFactor = 1;
  if (totalPercent < 100) {
    markupFactor = 1 / (1 - (totalPercent / 100));
  } else {
    // Fallback if tax + comm + margin >= 100%
    markupFactor = 1 + (totalPercent / 100);
  }

  // Final Price = Custo Técnico (costWithMultiplier) * Markup Factor (markupFactor)
  const finalPrice = costWithMultiplier * markupFactor;

  // Commissions and taxes are calculated directly on the selling price
  const commissionAmount = finalPrice * (comPercent / 100);
  const taxAmount = finalPrice * (taxPercent / 100);

  // Keep variables mapped for UI backwards compatibility:
  const totalBeforeTaxes = costWithMultiplier; // Base Custo Técnico before markup

  const overallCost = materialsTotal + thirdPartyTotal + internalTotal;
  const effectiveMarkup = overallCost > 0 ? finalPrice / overallCost : 0;

  return {
    materialsTotal,
    thirdPartyTotal,
    internalTotal,
    baseCost,
    costWithMultiplier,
    totalBeforeTaxes,
    commissionAmount,
    taxAmount,
    finalPrice,
    effectiveMarkup,
  };
}
