/**
 * Customer-facing commercial proposal.
 * Internal composition, costs, rates, taxes and calculation details never
 * appear in this document. Those details remain inside the Axemet System.
 */
import { jsPDF } from 'jspdf';
import { BudgetDraft } from '../types';
import { getOrganizationProfile } from '../lib/organization';

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

  let organization: { name: string; cnpj: string; phone: string; email: string; address: string; logo_url: string } = {
    name: 'Axemet System', cnpj: '', phone: '', email: '', address: '', logo_url: '' as string | null,
  };
  try {
    const profile = await getOrganizationProfile();
    if (profile) organization = {
      name: profile.name || organization.name,
      cnpj: profile.cnpj || '',
      phone: profile.phone || '',
      email: profile.email || '',
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

  // Header: official company identity and proposal reference.
  doc.setFillColor(...navy); doc.roundedRect(left, y, width, 27, 2, 2, 'F');
  let logoRendered = false;
  if (organization.logo_url && /^data:image\/(png|jpeg|jpg);base64,/i.test(organization.logo_url)) {
    try {
      const format = /image\/(jpeg|jpg)/i.test(organization.logo_url) ? 'JPEG' : 'PNG';
      doc.addImage(organization.logo_url, format, left + 5, y + 5, 31, 17);
      logoRendered = true;
    } catch (error) { console.warn('Logo não pôde ser inserido na proposta.', error); }
  }
  if (!logoRendered) {
    doc.setFillColor(255, 255, 255); doc.roundedRect(left + 5, y + 5, 31, 17, 2, 2, 'F');
    text('AX', left + 20.5, y + 16, 13, { align: 'center', bold: true, color: navy });
  }
  text(organization.name.toUpperCase(), left + 42, y + 9, 10.5, { bold: true, color: [255, 255, 255] });
  const contactLines = [organization.cnpj && `CNPJ: ${organization.cnpj}`, organization.phone && `Tel.: ${organization.phone}`, organization.email].filter(Boolean).join('  |  ');
  text(truncate(contactLines || 'Dados comerciais da empresa', 80), left + 42, y + 14, 6.8, { color: [226, 232, 240] });
  text(truncate(organization.address || '', 90), left + 42, y + 18.5, 6.6, { color: [226, 232, 240] });
  text('PROPOSTA COMERCIAL', right - 5, y + 9, 10, { align: 'right', bold: true, color: [255, 255, 255] });
  text(`Nº ${draft.reference || draft.id.slice(0, 8).toUpperCase()}`, right - 5, y + 15, 7.4, { align: 'right', color: [226, 232, 240] });
  text(`Emissão: ${new Date(draft.date || Date.now()).toLocaleDateString('pt-BR')}`, right - 5, y + 19.5, 6.8, { align: 'right', color: [226, 232, 240] });
  y += 34;

  text('DADOS DO CLIENTE', left, y, 8.5, { bold: true, color: navy });
  line(y + 2, gold); y += 8;
  labelValue('Cliente:', draft.clientName, left, y, 18, 62);
  labelValue('Contato:', draft.contactName || '', 110, y, 18, 42);
  y += 6;
  labelValue('Referência:', draft.reference || draft.id.slice(0, 8).toUpperCase(), left, y, 22, 45);
  labelValue('Validade:', '10 dias corridos a partir da emissão', 110, y, 20, 44);
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
  text('01', left + 3, y, 8, { bold: true });
  text(truncate(product, 72), left + 22, y, 8, { bold: true });
  text('1', right - 55, y, 8, { align: 'right' });
  const negotiatedPrice = Math.max(0, draft.totals.finalPrice - (draft.discountValue || 0));
  text(formatCurrency(negotiatedPrice), right - 3, y, 8.5, { align: 'right', bold: true });
  y += 5;
  const productDetails = [draft.moldType && `Tipo: ${draft.moldType}`, draft.moldingMaterial && `Material injetado: ${draft.moldingMaterial}`].filter(Boolean).join('  •  ');
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
  const scope = [
    `Fornecimento: ${product}.`,
    'Inclui desenvolvimento e fabricação conforme as especificações aprovadas pelo cliente.',
    'Alterações de escopo, revisões ou itens não previstos serão avaliados e formalizados previamente.',
  ];
  scope.forEach((item) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...navy); const lines = doc.splitTextToSize(`• ${item}`, width - 4); doc.text(lines, left + 2, y); y += lines.length * 4.1; });
  y += 4;

  text('CONDIÇÕES COMERCIAIS', left, y, 8.5, { bold: true, color: navy });
  line(y + 2, gold); y += 8;
  const conditions = [
    ['Prazo de entrega', draft.deliveryTime || 'A confirmar após aprovação técnica'],
    ['Pagamento', 'Conforme condição acordada na aprovação comercial'],
    ['Frete', 'A definir entre as partes antes do faturamento'],
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
