/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigParams, ThirdPartyItem, InternalServiceItem, RawMaterial } from './types';

export const DEFAULT_RAW_MATERIALS: RawMaterial[] = [
  { id: 'mat_1045', name: 'Aço 1045', density: 7.85, pricePerKg: 11.50 },
  { id: 'mat_p20', name: 'Aço P20', density: 7.85, pricePerKg: 25.00 },
  { id: 'mat_cobre', name: 'Cobre', density: 2.25, pricePerKg: 65.00 },
  { id: 'mat_aluminio', name: 'Alumínio', density: 2.70, pricePerKg: 45.00 },
  { id: 'mat_h13', name: 'Aço H13', density: 7.85, pricePerKg: 55.00 },
];

export const DEFAULT_CONFIG: ConfigParams = {
  p20Price: 25.0,
  steel1045Price: 11.5,
  defaultDensity: 7.85,
  electrodeDensity: 2.25,
  commission: 5.0, // 5%
  tax: 10.0, // 10%
  multiplier: 1.5,
  commercialMarkup: 1.30,
};

export const DEFAULT_THIRD_PARTY_ITEMS: Omit<ThirdPartyItem, 'id' | 'total'>[] = [
  { description: 'Porta molde', qtd: 0, valUnit: 0 },
  { description: 'Anel / bico', qtd: 0, valUnit: 0 },
  { description: 'Colunas', qtd: 0, valUnit: 0 },
  { description: 'Insumos padrão', qtd: 0, valUnit: 0 },
  { description: 'Extrações pç', qtd: 0, valUnit: 0 },
  { description: 'Insumos gaveta', qtd: 0, valUnit: 0 },
  { description: 'Tryout', qtd: 0, valUnit: 0 },
  { description: 'Torno', qtd: 0, valUnit: 0 },
  { description: 'Fresa', qtd: 0, valUnit: 0 },
  { description: 'Erosão fio', qtd: 0, valUnit: 0 },
  { description: 'Laser', qtd: 0, valUnit: 0 },
  { description: 'Retífica', qtd: 0, valUnit: 0 },
  { description: 'Textura', qtd: 0, valUnit: 0 },
  { description: 'Nitretação', qtd: 0, valUnit: 0 },
  { description: 'Polimento', qtd: 0, valUnit: 0 },
  { description: 'Projeto terceirizado', qtd: 0, valUnit: 0 },
  { description: 'Frete', qtd: 0, valUnit: 0 },
  { description: 'Câmara quente', qtd: 0, valUnit: 0 },
  { description: 'Pistão', qtd: 0, valUnit: 0 },
];

export const DEFAULT_INTERNAL_SERVICES: Omit<InternalServiceItem, 'id' | 'total'>[] = [
  { name: 'Projeto', unit: 'dia', valUnit: 550.0, qtd: 0 },
  { name: 'Usinagem Alumínio', unit: 'h', valUnit: 100.0, qtd: 0 },
  { name: 'Usinagem Aço', unit: 'h', valUnit: 160.0, qtd: 0 },
  { name: 'Usinagem Aço Temperado', unit: 'h', valUnit: 200.0, qtd: 0 },
  { name: 'Erosão', unit: 'h', valUnit: 75.0, qtd: 0 },
  { name: 'Matrizaria', unit: 'dia', valUnit: 550.0, qtd: 0 },
];
