/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { BudgetDraft } from '../types';
import { getMarginPercent } from './calculations';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function generateBudgetPDF(draft: BudgetDraft): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let currentY = 15;
  const marginX = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - 2 * marginX; // 180mm

  // Helper for text alignment
  const drawText = (text: string, x: number, y: number, options?: { align?: 'left' | 'center' | 'right'; bold?: boolean }) => {
    if (options?.bold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.text(text, x, y, { align: options?.align || 'left' });
  };

  // Helper for drawing lines
  const drawLine = (y: number, color = 200) => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.2);
    doc.line(marginX, y, marginX + contentWidth, y);
  };

  // --- HEADER WITH DYNAMIC ORGANIZATION INFO ---
  let orgName = 'Axemet Solution LTDA';
  let orgCnpj = '';
  let orgPhone = '';
  let orgEmail = '';
  let orgAddress = '';
  let orgLogo = '';
  let orgLogoWidth: number | undefined;
  let orgLogoHeight: number | undefined;
  try {
    const orgData = localStorage.getItem('organization_config');
    if (orgData) {
      const parsed = JSON.parse(orgData);
      if (parsed.name) orgName = parsed.name;
      if (parsed.cnpj) orgCnpj = parsed.cnpj;
      if (parsed.phone) orgPhone = parsed.phone;
      if (parsed.email) orgEmail = parsed.email;
      if (parsed.address) orgAddress = parsed.address;
      if (parsed.logo) orgLogo = parsed.logo;
      if (parsed.logoWidth) orgLogoWidth = Number(parsed.logoWidth);
      if (parsed.logoHeight) orgLogoHeight = Number(parsed.logoHeight);
    }
  } catch (e) {
    console.error('Error reading organization config:', e);
  }

  // Left: Logo or text block
  let hasLogo = false;
  if (orgLogo && orgLogo.trim().length > 0) {
    let isSupported = false;
    let format = 'PNG';
    
    if (orgLogo.includes('image/png')) {
      format = 'PNG';
      isSupported = true;
    } else if (orgLogo.includes('image/jpeg') || orgLogo.includes('image/jpg')) {
      format = 'JPEG';
      isSupported = true;
    } else {
      const match = orgLogo.match(/^data:image\/(\w+);base64,/);
      if (match && match[1]) {
        const detectedFormat = match[1].toUpperCase();
        if (detectedFormat === 'PNG' || detectedFormat === 'JPEG' || detectedFormat === 'JPG') {
          format = detectedFormat === 'JPG' ? 'JPEG' : detectedFormat;
          isSupported = true;
        }
      }
    }

    if (isSupported) {
      try {
        let renderWidth = 35;
        let renderHeight = 16;
        
        if (orgLogoWidth && orgLogoHeight && orgLogoWidth > 0 && orgLogoHeight > 0) {
          const ar = orgLogoWidth / orgLogoHeight;
          const targetAr = 35 / 16; // ~2.1875
          if (ar > targetAr) {
            // Wider logo
            renderWidth = 35;
            renderHeight = 35 / ar;
          } else {
            // Taller logo
            renderHeight = 16;
            renderWidth = 16 * ar;
          }
        }
        
        // Vertically center the logo in the 16mm height slot
        const offsetY = currentY + (16 - renderHeight) / 2;
        
        doc.addImage(orgLogo, format, marginX, offsetY, renderWidth, renderHeight);
        hasLogo = true;
      } catch (err) {
        console.error('Failed to add logo to PDF:', err);
        hasLogo = false;
      }
    } else {
      console.warn('Organization logo format is not natively supported by jsPDF (e.g. WebP). It will render as text placeholder. Please upload PNG/JPG in organization settings.');
    }
  }
  
  if (!hasLogo) {
    // Beautiful text placeholder for organization
    doc.setFillColor(15, 23, 42); // Navy Slate
    doc.rect(marginX, currentY, 42, 16, 'F');
    doc.setFillColor(234, 88, 12); // Orange Accent
    doc.rect(marginX, currentY + 15, 42, 1, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    const shortName = orgName.length > 20 ? orgName.slice(0, 18) + '..' : orgName;
    doc.text(shortName.toUpperCase(), marginX + 21, currentY + 9.5, { align: 'center' });
  }

  // Right Side: Title & Company Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  drawText('ORÇAMENTO TÉCNICO DE MOLDE', marginX + contentWidth, currentY + 3.5, { align: 'right', bold: true });
  
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  drawText(orgName, marginX + contentWidth, currentY + 8, { align: 'right', bold: true });
  
  let detailsStr = '';
  if (orgCnpj) detailsStr += `CNPJ: ${orgCnpj} | `;
  if (orgPhone) detailsStr += `Tel: ${orgPhone} | `;
  if (orgEmail) detailsStr += `E-mail: ${orgEmail}`;
  if (detailsStr.endsWith(' | ')) detailsStr = detailsStr.slice(0, -3);
  
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  if (detailsStr) {
    drawText(detailsStr, marginX + contentWidth, currentY + 11.5, { align: 'right' });
  }
  if (orgAddress) {
    drawText(orgAddress, marginX + contentWidth, currentY + 15, { align: 'right' });
  }

  // Solid line separating header from details
  currentY += 19;
  doc.setFillColor(234, 88, 12); // Orange #EA580C
  doc.rect(marginX, currentY, contentWidth, 0.8, 'F');
  
  currentY += 5;
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(9.5);
  
  // Cliente & Molde Info Box - Extended height to 35mm for 5-row layout
  doc.setFillColor(248, 250, 252); // Soft light grey-blue #F8FAFC
  doc.rect(marginX, currentY, contentWidth, 35, 'F');
  doc.setDrawColor(226, 232, 240); // Slate-200 border
  doc.rect(marginX, currentY, contentWidth, 35, 'S');

  // Set font size to 8 for elegant compact display (prevents text overlap)
  doc.setFontSize(8);

  // Row 1
  doc.setTextColor(71, 85, 105); // slate-600
  drawText('Cliente:', marginX + 4, currentY + 5.5, { bold: true });
  doc.setTextColor(15, 23, 42); // slate-900
  const clientVal = draft.clientName || 'N/A';
  drawText(clientVal.length > 42 ? clientVal.slice(0, 39) + '...' : clientVal, marginX + 18, currentY + 5.5);

  doc.setTextColor(71, 85, 105);
  drawText('Data:', marginX + 100, currentY + 5.5, { bold: true });
  doc.setTextColor(15, 23, 42);
  drawText(new Date(draft.date).toLocaleDateString('pt-BR'), marginX + 110, currentY + 5.5);

  // Row 2
  doc.setTextColor(71, 85, 105);
  drawText('Contato / Responsável:', marginX + 4, currentY + 11.5, { bold: true });
  doc.setTextColor(15, 23, 42);
  const contactVal = draft.contactName || 'N/A';
  drawText(contactVal.length > 32 ? contactVal.slice(0, 29) + '...' : contactVal, marginX + 39, currentY + 11.5);

  doc.setTextColor(71, 85, 105);
  drawText('Referência Orç.:', marginX + 100, currentY + 11.5, { bold: true });
  doc.setTextColor(15, 23, 42);
  drawText(draft.reference || draft.id.slice(0, 8).toUpperCase(), marginX + 125, currentY + 11.5);

  // Row 3
  doc.setTextColor(71, 85, 105);
  drawText('Molde / Produto:', marginX + 4, currentY + 17.5, { bold: true });
  doc.setTextColor(15, 23, 42);
  const moldDesc = draft.moldDescription || 'N/A';
  drawText(moldDesc.length > 36 ? moldDesc.slice(0, 33) + '...' : moldDesc, marginX + 31, currentY + 17.5);

  doc.setTextColor(71, 85, 105);
  drawText('Tipo de Molde:', marginX + 100, currentY + 17.5, { bold: true });
  doc.setTextColor(15, 23, 42);
  const mType = draft.moldType || 'Injeção';
  drawText(mType.length > 36 ? mType.slice(0, 33) + '...' : mType, marginX + 123, currentY + 17.5);

  // Row 4
  doc.setTextColor(71, 85, 105);
  drawText('Material do Produto:', marginX + 4, currentY + 23.5, { bold: true });
  doc.setTextColor(15, 23, 42);
  const mMat = draft.moldingMaterial || 'N/A';
  drawText(mMat.length > 32 ? mMat.slice(0, 29) + '...' : mMat, marginX + 37, currentY + 23.5);

  doc.setTextColor(71, 85, 105);
  drawText('Prazo / Quantidade:', marginX + 100, currentY + 23.5, { bold: true });
  doc.setTextColor(15, 23, 42);
  const formattedQtd = draft.productQuantity !== undefined ? new Intl.NumberFormat('pt-BR').format(draft.productQuantity) : '1.000';
  drawText(`${draft.deliveryTime || '45 dias'} / ${formattedQtd} pçs`, marginX + 131, currentY + 23.5);

  // Row 5
  doc.setTextColor(71, 85, 105);
  drawText('Observações:', marginX + 4, currentY + 29.5, { bold: true });
  doc.setTextColor(15, 23, 42);
  const obsVal = draft.observations || 'N/A';
  drawText(obsVal.length > 105 ? obsVal.slice(0, 102) + '...' : obsVal, marginX + 25, currentY + 29.5);

  currentY += 41;

  // --- SEÇÃO 1: MATERIAIS / CHAPAS ---
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  drawText('1. Materiais e Chapas', marginX, currentY, { bold: true });
  currentY += 4;
  drawLine(currentY, 150);
  currentY += 5;

  // Materials Table Header
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  drawText('Descrição', marginX + 2, currentY, { bold: true });
  drawText('Qtd', marginX + 57, currentY, { bold: true });
  drawText('Dimensões (mm)', marginX + 66, currentY, { bold: true });
  drawText('Material', marginX + 102, currentY, { bold: true });
  drawText('Peso (kg)', marginX + 138, currentY, { bold: true, align: 'right' });
  drawText('R$/kg', marginX + 158, currentY, { bold: true, align: 'right' });
  drawText('Total', marginX + 180, currentY, { bold: true, align: 'right' });

  currentY += 3;
  drawLine(currentY, 220);
  currentY += 4;

  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  
  draft.materials.forEach((m) => {
    // Only display if quantity or total is greater than 0
    if (m.qtd > 0 && m.total > 0) {
      const weight = (m.comp * m.larg * m.esp * m.qtd * m.dens) / 1000000;
      
      drawText(m.name, marginX + 2, currentY);
      drawText(m.qtd.toString(), marginX + 57, currentY);
      drawText(`${formatNumber(m.comp, 0)}x${formatNumber(m.larg, 0)}x${formatNumber(m.esp, 0)}`, marginX + 66, currentY);
      drawText(m.material, marginX + 102, currentY);
      drawText(formatNumber(weight, 2), marginX + 138, currentY, { align: 'right' });
      drawText(formatCurrency(m.valKg), marginX + 158, currentY, { align: 'right' });
      drawText(formatCurrency(m.total), marginX + 180, currentY, { align: 'right' });
      
      currentY += 4.5;

      // Page break check
      if (currentY > 275) {
        doc.addPage();
        currentY = 15;
      }
    }
  });

  // Materials Total Row
  currentY += 1;
  drawLine(currentY, 200);
  currentY += 4;
  doc.setFontSize(9);
  drawText('Total Materiais:', marginX + 125, currentY, { bold: true, align: 'right' });
  drawText(formatCurrency(draft.totals.materialsTotal), marginX + 180, currentY, { bold: true, align: 'right' });

  currentY += 10;

  // --- SEÇÃO 2: COMPONENTES / TERCEIRIZADOS ---
  doc.setFontSize(11);
  drawText('2. Terceiros e Componentes Comprados', marginX, currentY, { bold: true });
  currentY += 4;
  drawLine(currentY, 150);
  currentY += 5;

  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  drawText('Descrição', marginX + 2, currentY, { bold: true });
  drawText('Quantidade', marginX + 100, currentY, { bold: true, align: 'center' });
  drawText('Valor Unitário', marginX + 140, currentY, { bold: true, align: 'right' });
  drawText('Total', marginX + 180, currentY, { bold: true, align: 'right' });

  currentY += 3;
  drawLine(currentY, 220);
  currentY += 4;

  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);

  let hasThirdParty = false;
  draft.thirdPartyItems.forEach((tp) => {
    if (tp.qtd > 0 && tp.total > 0) {
      hasThirdParty = true;
      drawText(tp.description, marginX + 2, currentY);
      drawText(tp.qtd.toString(), marginX + 100, currentY, { align: 'center' });
      drawText(formatCurrency(tp.valUnit), marginX + 140, currentY, { align: 'right' });
      drawText(formatCurrency(tp.total), marginX + 180, currentY, { align: 'right' });
      
      currentY += 4.5;

      if (currentY > 275) {
        doc.addPage();
        currentY = 15;
      }
    }
  });

  if (!hasThirdParty) {
    doc.setTextColor(107, 114, 128);
    drawText('Nenhum componente ou serviço terceirizado lançado.', marginX + 2, currentY);
    currentY += 4.5;
  }

  currentY += 1;
  drawLine(currentY, 200);
  currentY += 4;
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  drawText('Total Terceirizados:', marginX + 125, currentY, { bold: true, align: 'right' });
  drawText(formatCurrency(draft.totals.thirdPartyTotal), marginX + 180, currentY, { bold: true, align: 'right' });

  currentY += 10;

  // New Page or flow check for Services
  if (currentY > 210) {
    doc.addPage();
    currentY = 15;
  }

  // --- SEÇÃO 3: SERVIÇOS INTERNOS ---
  doc.setFontSize(11);
  drawText('3. Serviços Internos da Empresa', marginX, currentY, { bold: true });
  currentY += 4;
  drawLine(currentY, 150);
  currentY += 5;

  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  drawText('Serviço', marginX + 2, currentY, { bold: true });
  drawText('Unidade', marginX + 80, currentY, { bold: true });
  drawText('Quantidade', marginX + 110, currentY, { bold: true, align: 'center' });
  drawText('Valor Unit./Taxa', marginX + 145, currentY, { bold: true, align: 'right' });
  drawText('Total', marginX + 180, currentY, { bold: true, align: 'right' });

  currentY += 3;
  drawLine(currentY, 220);
  currentY += 4;

  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);

  let hasServices = false;
  draft.internalServices.forEach((s) => {
    if (s.qtd > 0 && s.total > 0) {
      hasServices = true;
      drawText(s.name, marginX + 2, currentY);
      drawText(s.unit === 'dia' ? 'Dias' : 'Horas', marginX + 80, currentY);
      drawText(formatNumber(s.qtd, 1), marginX + 110, currentY, { align: 'center' });
      drawText(`${formatCurrency(s.valUnit)}/${s.unit}`, marginX + 145, currentY, { align: 'right' });
      drawText(formatCurrency(s.total), marginX + 180, currentY, { align: 'right' });
      
      currentY += 4.5;

      if (currentY > 275) {
        doc.addPage();
        currentY = 15;
      }
    }
  });

  if (!hasServices) {
    doc.setTextColor(107, 114, 128);
    drawText('Nenhum serviço interno lançado.', marginX + 2, currentY);
    currentY += 4.5;
  }

  currentY += 1;
  drawLine(currentY, 200);
  currentY += 4;
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  drawText('Total Serviços Internos:', marginX + 125, currentY, { bold: true, align: 'right' });
  drawText(formatCurrency(draft.totals.internalTotal), marginX + 180, currentY, { bold: true, align: 'right' });

  currentY += 12;

  // New Page or box check for Summary
  if (currentY > 195) {
    doc.addPage();
    currentY = 15;
  }

  // --- SEÇÃO 4: RESUMO COMERCIAL & PREÇO FINAL ---
  doc.setFillColor(243, 244, 246); // Medium grey #F3F4F6
  doc.rect(marginX, currentY, contentWidth, 54, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(marginX, currentY, contentWidth, 54, 'S');

  doc.setFontSize(11);
  drawText('RESUMO COMERCIAL', marginX + 6, currentY + 7, { bold: true });

  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  
  const margem = getMarginPercent(draft.config);
  const comPercent = draft.config.commission;
  const taxPercent = draft.config.tax;
  const totalPercent = margem + comPercent + taxPercent;

  let markupFactor = 1;
  if (totalPercent < 100) {
    markupFactor = 1 / (1 - (totalPercent / 100));
  } else {
    markupFactor = 1 + (totalPercent / 100);
  }

  // Left Column of Summary
  drawText('Custo Total de Materiais:', marginX + 6, currentY + 14);
  drawText('Custo Total de Terceiros:', marginX + 6, currentY + 19);
  drawText('Serviços Internos (Oficina):', marginX + 6, currentY + 24);
  drawText('Custo Base Direto Total:', marginX + 6, currentY + 29, { bold: true });
  drawText(`Fator 1 (Mult. Técnico x${formatNumber(draft.config.multiplier, 2)}):`, marginX + 6, currentY + 35);
  drawText(`Fator 2 (Markup Divisor x${formatNumber(markupFactor, 2)}):`, marginX + 6, currentY + 41);
  drawText('Preço de Tabela (c/ Impostos):', marginX + 6, currentY + 47, { bold: true });

  // Right Column of Summary (Values)
  doc.setTextColor(17, 24, 39);
  drawText(formatCurrency(draft.totals.materialsTotal), marginX + 90, currentY + 14, { align: 'right' });
  drawText(formatCurrency(draft.totals.thirdPartyTotal), marginX + 90, currentY + 19, { align: 'right' });
  drawText(formatCurrency(draft.totals.internalTotal), marginX + 90, currentY + 24, { align: 'right' });
  drawText(formatCurrency(draft.totals.baseCost), marginX + 90, currentY + 29, { bold: true, align: 'right' });
  drawText(formatCurrency(draft.totals.costWithMultiplier), marginX + 90, currentY + 35, { align: 'right' });
  drawText(`x ${formatNumber(markupFactor, 2)}`, marginX + 90, currentY + 41, { align: 'right' });
  drawText(formatCurrency(draft.totals.finalPrice), marginX + 90, currentY + 47, { bold: true, align: 'right' });

  // Divider inside Box
  doc.setDrawColor(180);
  doc.line(marginX + 98, currentY + 6, marginX + 98, currentY + 48);

  // Taxes & Final Price Column (Far Right in box)
  doc.setTextColor(75, 85, 99);
  drawText(`Comissão (${formatNumber(draft.config.commission, 1)}%):`, marginX + 104, currentY + 14);
  drawText(`Impostos (${formatNumber(draft.config.tax, 1)}%):`, marginX + 104, currentY + 19);
  drawText('Markup Efetivo:', marginX + 104, currentY + 24);

  doc.setTextColor(17, 24, 39);
  drawText(formatCurrency(draft.totals.commissionAmount), marginX + 174, currentY + 14, { align: 'right' });
  drawText(formatCurrency(draft.totals.taxAmount), marginX + 174, currentY + 19, { align: 'right' });
  drawText(`${formatNumber(draft.totals.effectiveMarkup, 4)}x`, marginX + 174, currentY + 24, { align: 'right' });

  // Big Highlighted Final Price Box inside summary
  const discountVal = draft.discountValue || 0;
  const hasDiscount = discountVal > 0;
  const finalNegotiatedPrice = draft.totals.finalPrice - discountVal;

  if (hasDiscount) {
    doc.setFillColor(31, 41, 55); // Dark Charcoal
    doc.rect(marginX + 102, currentY + 31, 72, 18, 'F');
    
    doc.setTextColor(209, 213, 219);
    doc.setFontSize(7);
    drawText(`Preço de Tabela: ${formatCurrency(draft.totals.finalPrice)}`, marginX + 138, currentY + 34, { align: 'center' });
    drawText(`Desconto Comercial: ${formatCurrency(discountVal)} (${formatNumber(draft.discountPercent || 0, 1)}%)`, marginX + 138, currentY + 38, { align: 'center' });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    drawText('PREÇO FINAL NEGOCIADO', marginX + 138, currentY + 42, { align: 'center', bold: true });
    doc.setFontSize(10.5);
    drawText(formatCurrency(finalNegotiatedPrice), marginX + 138, currentY + 47, { align: 'center', bold: true });
  } else {
    doc.setFillColor(31, 41, 55); // Dark Charcoal
    doc.rect(marginX + 102, currentY + 34, 72, 14, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    drawText('PREÇO DE VENDA FINAL', marginX + 138, currentY + 38, { align: 'center', bold: true });
    doc.setFontSize(11);
    drawText(formatCurrency(draft.totals.finalPrice), marginX + 138, currentY + 44, { align: 'center', bold: true });
  }

  // --- FOOTER NOTE ---
  currentY += 66;
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  drawText('Orçamento gerado de acordo com as especificações técnicas de moldes.', marginX, currentY);
  drawText('Válido por 30 dias a partir da data de emissão.', marginX + contentWidth, currentY, { align: 'right' });

  // Save the PDF
  const filename = `Orcamento_${draft.clientName.replace(/\s+/g, '_') || 'Molde'}_${draft.id.slice(0, 5)}.pdf`;
  doc.save(filename);
}
