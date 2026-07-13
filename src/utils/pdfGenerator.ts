/**
 * Customer-facing commercial proposal.
 * Internal composition, costs, rates, taxes and calculation details never
 * appear in this document. Those details remain inside the Axemet System.
 */
import { jsPDF } from 'jspdf';
import { BudgetDraft } from '../types';
import { getOrganizationProfile } from '../lib/organization';
import { getCommercialBudgetValue } from './calculations';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

const truncate = (value: string, limit: number) => value.length > limit ? `${value.slice(0, limit - 3)}...` : value;

export async function generateBudgetPDF(draft: BudgetDraft): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const left = 15;
  const right = 195;
  const width = right - left;
  const navy: [number, number, number] = [11, 42, 68];
  const gold: [number, number, number] = [204, 151, 39];
  const slate: [number, number, number] = [71, 85, 105];
  const light: [number, number, number] = [241, 245, 249];
  let y = 15;

  let organization: { name: string; cnpj: string; phone: string; website: string; address: string; logo_url: string } = {
    name: 'Axemet System', cnpj: '', phone: '', website: '', address: '', logo_url: '',
  };
  try {
    const profile = await getOrganizationProfile();
    if (profile) organization = {
      name: profile.name || organization.name,
      cnpj: profile.cnpj || '',
      phone: profile.phone || '',
      website: profile.website || '',
      address: profile.address || '',
      logo_url: profile.logo_url || '',
    };
  } catch (error) {
    console.warn('Não foi possível carregar a organização para a proposta.', error);
  }

  const text = (value: string, x: number, atY: number, size = 8, options?: { align?: 'left' | 'center' | 'right'; bold?: boolean; color?: [number, number, number] }) => {
    doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(options?.color || navy));
    doc.text(value, x, atY, { align: options?.align || 'left' });
  };
  const line = (atY: number, color: [number, number, number] = [203, 213, 225]) => {
    doc.setDrawColor(...color); doc.setLineWidth(0.25); doc.line(left, atY, right, atY);
  };
  const labelValue = (label: string, value: string, x: number, atY: number, labelWidth = 23, max = 58) => {
    text(label, x, atY, 7, { bold: true, color: slate });
    text(truncate(value || 'Não informado', max), x + labelWidth, atY, 7.7, { color: navy });
  };

  // Header grouped in three blocks: brand, issuer and proposal/representative.
  // The white background is intentionally optimized for print and logos.
  doc.setFillColor(255, 255, 255); doc.roundedRect(left, y, width, 35, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225); doc.roundedRect(left, y, width, 35, 2, 2, 'S');
  doc.line(left + 40, y + 3, left + 40, y + 32);
  doc.line(left + 124, y + 3, left + 124, y + 32);
  let logoRendered = false;
  if (organization.logo_url && /^data:image\/(png|jpeg|jpg);base64,/i.test(organization.logo_url)) {
    try {
      const format = /image\/(jpeg|jpg)/i.test(organization.logo_url) ? 'JPEG' : 'PNG';
      const properties = doc.getImageProperties(organization.logo_url);
      const ratio = properties.width / properties.height;
      const maxWidth = 34;
      const maxHeight = 16;
      const renderWidth = ratio >= maxWidth / maxHeight ? maxWidth : maxHeight * ratio;
      const renderHeight = ratio >= maxWidth / maxHeight ? maxWidth / ratio : maxHeight;
      doc.addImage(organization.logo_url, format, left + (40 - renderWidth) / 2, y + (35 - renderHeight) / 2, renderWidth, renderHeight);
      logoRendered = true;
    } catch (error) { console.warn('Logo não pôde ser inserido na proposta.', error); }
  }
  if (!logoRendered) {
    doc.setFillColor(...light); doc.roundedRect(left + 6, y + 8, 28, 18, 2, 2, 'F');
    text('AX', left + 20, y + 20, 12, { align: 'center', bold: true, color: navy });
  }
  const issuerX = left + 44;
  const proposalX = left + 128;
  text(truncate(organization.name.toUpperCase(), 44), issuerX, y + 8, 9, { bold: true, color: navy });
  text(truncate([organization.cnpj && `CNPJ: ${organization.cnpj}`, organization.phone && `Tel.: ${organization.phone}`].filter(Boolean).join('  |  ') || 'Dados corporativos', 61), issuerX, y + 14, 6.4, { color: slate });
  text(truncate(organization.website || '', 61), issuerX, y + 20, 6.4, { color: slate });
  text(truncate(organization.address || '', 61), issuerX, y + 26, 6.1, { color: slate });
  text('PROPOSTA COMERCIAL', proposalX, y + 7, 8.2, { bold: true, color: navy });
  text(`Nº ${draft.reference || draft.id.slice(0, 8).toUpperCase()}  •  ${new Date(draft.date || Date.now()).toLocaleDateString('pt-BR')}`, proposalX, y + 12, 6.5, { color: slate });
  text(truncate(draft.representativeName || 'Representante não informado', 38), proposalX, y + 19, 7.1, { bold: true, color: navy });
  text(truncate([draft.representativePhone, draft.representativeEmail].filter(Boolean).join('  |  '), 42), proposalX, y + 25, 6.2, { color: slate });
  y += 41;

  text('DADOS DO CLIENTE', left, y, 8.5, { bold: true, color: navy });
  line(y + 2, gold); y += 8;
  labelValue('Cliente:', draft.clientName, left, y, 13, 62);
  labelValue('Contato:', draft.contactName || '', 110, y, 13, 42);
  y += 6;
  labelValue('Referência:', draft.reference || draft.id.slice(0, 8).toUpperCase(), left, y, 16, 45);
  labelValue('Título:', draft.moldDescription || 'Não informado', 110, y, 11, 47);
  y += 6;
  const terms = draft.commercialTerms || {
    scope: '', validityDays: 10, paymentTerms: 'Conforme condição acordada na aprovação comercial',
    freightTerms: 'A definir entre as partes antes do faturamento', billingSchedule: [],
  };
  labelValue('Validade:', `${terms.validityDays || 10} dias corridos a partir da emissão`, left, y, 15, 58);
  y += 10;

  text('ITENS DA PROPOSTA', left, y, 8.5, { bold: true, color: navy });
  line(y + 2, gold); y += 6;
  doc.setFillColor(...light); doc.rect(left, y, width, 8, 'F');
  text('ITEM', left + 3, y + 5, 7, { bold: true, color: slate });
  text('DESCRIÇÃO', left + 22, y + 5, 7, { bold: true, color: slate });
  text('QTD.', right - 55, y + 5, 7, { align: 'right', bold: true, color: slate });
  text('VALOR TOTAL', right - 3, y + 5, 7, { align: 'right', bold: true, color: slate });
  y += 14;
  const product = draft.moldDescription || draft.moldType || 'Molde e ferramental sob encomenda';
  const commercialItems = draft.proposalItems && draft.proposalItems.length > 0
    ? draft.proposalItems
    : [{ id: 'default', description: product, quantity: 1, unitPrice: Math.max(0, draft.totals.finalPrice - (draft.discountValue || 0)) }];
  const negotiatedPrice = getCommercialBudgetValue(draft);
  commercialItems.forEach((item, index) => {
    text(String(index + 1).padStart(2, '0'), left + 3, y, 8, { bold: true });
    text(truncate(item.description || product, 72), left + 22, y, 8, { bold: true });
    text(String(item.quantity || 0), right - 55, y, 8, { align: 'right' });
    text(formatCurrency((item.quantity || 0) * (item.unitPrice || 0)), right - 3, y, 8.5, { align: 'right', bold: true });
    if (item.title) {
      text(truncate(`Título do ferramental: ${item.title}`, 82), left + 22, y + 3.5, 6.7, { color: slate });
      y += 8.5;
    } else {
      y += 5;
    }
  });
  const productDetails = (!draft.proposalItems || draft.proposalItems.length === 0) ? [draft.moldType && `Tipo: ${draft.moldType}`, draft.moldingMaterial && `Material injetado: ${draft.moldingMaterial}`].filter(Boolean).join('  •  ') : '';
  if (productDetails) { text(truncate(productDetails, 104), left + 22, y, 6.8, { color: slate }); y += 4; }
  line(y + 2); y += 10;

  doc.setFillColor(...navy); doc.roundedRect(112, y, 83, 18, 2, 2, 'F');
  text('VALOR GLOBAL DA PROPOSTA', 153.5, y + 6, 7.2, { align: 'center', bold: true, color: [226, 232, 240] });
  text(formatCurrency(negotiatedPrice), 153.5, y + 13.2, 14, { align: 'center', bold: true, color: [255, 255, 255] });
  text('Valores expressos em reais (R$).', left, y + 7, 7.2, { color: slate });
  text('Esta proposta apresenta exclusivamente as condições comerciais.', left, y + 12, 7.2, { color: slate });
  y += 27;

  text('ESCOPO COMERCIAL', left, y, 8.5, { bold: true, color: navy });
  line(y + 2, gold); y += 7;
  const scope = (terms.scope || `Fornecimento: ${product}.`).split(/\n+/).filter(Boolean);
  scope.forEach((item) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...navy); const lines = doc.splitTextToSize(`• ${item}`, width - 4); doc.text(lines, left + 2, y); y += lines.length * 4.1; });
  y += 4;

  text('CONDIÇÕES COMERCIAIS', left, y, 8.5, { bold: true, color: navy });
  line(y + 2, gold); y += 8;
  const conditions = [
    ['Prazo de entrega', draft.deliveryTime || 'A confirmar após aprovação técnica'],
    ['Pagamento', terms.paymentTerms || 'Conforme condição acordada na aprovação comercial'],
    ['Frete', terms.freightTerms || 'A definir entre as partes antes do faturamento'],
    ['Observações', draft.observations || 'Nenhuma observação adicional informada.'],
  ];
  conditions.forEach(([label, value]) => {
    doc.setFillColor(...light); doc.roundedRect(left, y - 4.5, 36, 7.5, 1, 1, 'F');
    text(label.toUpperCase(), left + 2, y, 6.4, { bold: true, color: slate });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...navy);
    const lines = doc.splitTextToSize(value, width - 42);
    doc.text(lines, left + 41, y);
    y += Math.max(7.5, lines.length * 3.5 + 2.5);
  });

  y = Math.max(y + 5, 255);
  line(y, [203, 213, 225]);
  text('Ao aceitar esta proposta, o cliente confirma as especificações, valores e condições comerciais aqui apresentadas.', left, y + 5, 6.6, { color: slate });
  text(`${organization.name}  •  Documento comercial`, right, y + 5, 6.6, { align: 'right', color: slate });
  text('Aceite do cliente: ____________________________________________    Data: ____/____/______', left, y + 15, 7.5, { color: navy });

  const safeClient = (draft.clientName || 'cliente').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
  doc.save(`Proposta_Comercial_${safeClient || 'cliente'}_${draft.reference || draft.id.slice(0, 6)}.pdf`);
}
