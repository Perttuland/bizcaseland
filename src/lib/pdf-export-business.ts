/**
 * Business Case PDF Export Service
 * 
 * Generates professional, C-suite ready PDF reports for business case analysis
 * Features: 
 * - Executive cover page with branding
 * - Key financial metrics dashboard (6 metrics)
 * - Annual cash flow analysis table
 * - Visual chart data representations
 * - Detailed assumptions breakdown
 * - Professional styling and layout
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BusinessData } from '@/contexts/BusinessDataContext';
import { calculateBusinessMetrics, MonthlyData } from './calculations';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  light: '#f1f5f9',
  dark: '#1e293b',
  text: '#334155',
};

const FONTS = {
  title: 24,
  heading: 16,
  subheading: 14,
  body: 10,
  small: 8,
};

/**
 * Format currency with appropriate units
 */
function formatCurrency(value: number, currency: string = 'USD'): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${currency} ${(value / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(value) >= 1_000) {
    return `${currency} ${(value / 1_000).toFixed(2)}K`;
  }
  return `${currency} ${value.toFixed(2)}`;
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Add page header
 */
function addHeader(doc: jsPDF, title: string) {
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 13);
}

/**
 * Add page footer with page numbers
 */
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(COLORS.light);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  
  doc.setTextColor(COLORS.text);
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'normal');
  
  const timestamp = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  doc.text(`Generated on ${timestamp}`, 14, pageHeight - 8);
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 40, pageHeight - 8);
}

/**
 * Create cover page
 */
function createCoverPage(doc: jsPDF, data: BusinessData) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Background gradient effect
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, pageHeight / 2, 'F');
  
  // Title section
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.title);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Case Analysis', pageWidth / 2, 60, { align: 'center' });
  
  // Project title
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'normal');
  const projectTitle = data.meta.title || 'Untitled Project';
  doc.text(projectTitle, pageWidth / 2, 80, { align: 'center' });
  
  // Description box
  if (data.meta.description) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 110, pageWidth - 40, 60, 3, 3, 'F');
    
    doc.setTextColor(COLORS.text);
    doc.setFontSize(FONTS.body);
    doc.setFont('helvetica', 'normal');
    
    const splitDescription = doc.splitTextToSize(data.meta.description, pageWidth - 50);
    doc.text(splitDescription, pageWidth / 2, 125, { align: 'center', maxWidth: pageWidth - 50 });
  }
  
  // Metadata section
  const startY = 190;
  doc.setFillColor(COLORS.light);
  doc.roundedRect(20, startY, pageWidth - 40, 60, 3, 3, 'F');
  
  doc.setTextColor(COLORS.text);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details', pageWidth / 2, startY + 12, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.small);
  
  const metadata = [
    `Business Model: ${data.meta.business_model || 'Not Specified'}`,
    `Currency: ${data.meta.currency}`,
    `Analysis Periods: ${data.meta.periods} ${data.meta.frequency}`,
    `Generated: ${new Date().toLocaleDateString()}`,
  ];
  
  let yPos = startY + 25;
  metadata.forEach((line) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  });
  
  // Branding footer
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'italic');
  doc.text('Powered by Bizcaseland', pageWidth / 2, pageHeight - 20, { align: 'center' });
}

/**
 * Aggregate monthly data into annual summaries
 */
function aggregateToAnnual(monthlyData: MonthlyData[], currency: string): any[] {
  const annualData: any[] = [];
  const monthsPerYear = 12;
  const totalYears = Math.ceil(monthlyData.length / monthsPerYear);
  
  for (let year = 0; year < totalYears; year++) {
    const startMonth = year * monthsPerYear;
    const endMonth = Math.min(startMonth + monthsPerYear, monthlyData.length);
    const yearData = monthlyData.slice(startMonth, endMonth);
    
    const annual = {
      year: `Year ${year + 1}`,
      revenue: yearData.reduce((sum, m) => sum + m.revenue, 0),
      totalOpex: yearData.reduce((sum, m) => sum + m.totalOpex, 0),
      capex: yearData.reduce((sum, m) => sum + m.capex, 0),
      netCashFlow: yearData.reduce((sum, m) => sum + m.netCashFlow, 0),
    };
    
    annualData.push(annual);
  }
  
  return annualData;
}

/**
 * Create executive summary page with 6 key metrics
 */
function createExecutiveSummary(doc: jsPDF, data: BusinessData, calculations: any) {
  doc.addPage();
  addHeader(doc, data.meta.title);
  
  let yPos = 35;
  const pageWidth = doc.internal.pageSize.width;
  const currency = data.meta.currency;
  const isCostSavings = data.meta.business_model === 'cost_savings';
  
  // Title
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, yPos);
  yPos += 10;
  
  // Subtitle
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.secondary);
  doc.text('Key Financial Metrics & Investment Analysis', 14, yPos);
  yPos += 15;
  
  // Six key metrics in a professional grid (3x2)
  const metrics = [
    { 
      label: isCostSavings ? 'Total Benefits (5Y)' : 'Total Revenue (5Y)',
      value: formatCurrency(calculations.totalRevenue || 0, currency),
      color: COLORS.success,
      icon: '💰'
    },
    { 
      label: 'Net Profit (5Y)', 
      value: formatCurrency(calculations.netProfit || 0, currency),
      color: (calculations.netProfit || 0) >= 0 ? COLORS.success : COLORS.danger,
      icon: '📊'
    },
    { 
      label: 'Net Present Value', 
      value: formatCurrency(calculations.npv || 0, currency),
      color: (calculations.npv || 0) >= 0 ? COLORS.success : COLORS.danger,
      icon: '🎯'
    },
    { 
      label: 'Payback Period', 
      value: calculations.paybackPeriod > 0 ? `${calculations.paybackPeriod} months` : 'N/A',
      color: COLORS.primary,
      icon: '⏱️'
    },
    { 
      label: 'Required Investment', 
      value: formatCurrency(calculations.totalInvestmentRequired || 0, currency),
      color: COLORS.warning,
      icon: '💼'
    },
    { 
      label: 'Break-Even Point', 
      value: calculations.breakEvenMonth > 0 ? `Month ${calculations.breakEvenMonth}` : 'N/A',
      color: COLORS.warning,
      icon: '⚖️'
    },
  ];
  
  const boxWidth = (pageWidth - 40) / 3 - 4;
  const boxHeight = 35;
  const spacing = 6;
  
  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const xPos = 14 + (col * (boxWidth + spacing));
    const boxYPos = yPos + (row * (boxHeight + spacing));
    
    // Draw metric box with subtle shadow effect
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(xPos + 1, boxYPos + 1, boxWidth, boxHeight, 3, 3, 'F');
    
    // Main box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(xPos, boxYPos, boxWidth, boxHeight, 3, 3, 'FD');
    doc.setDrawColor(metric.color);
    doc.setLineWidth(0.5);
    doc.roundedRect(xPos, boxYPos, boxWidth, boxHeight, 3, 3, 'S');
    
    // Icon/Indicator bar at top
    doc.setFillColor(metric.color);
    doc.rect(xPos + 3, boxYPos + 3, boxWidth - 6, 3, 'F');
    
    // Label
    doc.setTextColor(COLORS.text);
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'normal');
    const labelLines = doc.splitTextToSize(metric.label, boxWidth - 8);
    doc.text(labelLines, xPos + 4, boxYPos + 12);
    
    // Value
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(metric.color);
    const valueText = metric.value;
    // Center the value text
    const textWidth = doc.getTextWidth(valueText);
    const centeredX = xPos + (boxWidth - textWidth) / 2;
    doc.text(valueText, centeredX, boxYPos + 27);
  });
  
  yPos += (2 * (boxHeight + spacing)) + 15;
  
  // Investment Recommendation Box
  if (yPos < 220) {
    doc.setFillColor(COLORS.light);
    doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'F');
    
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Investment Recommendation', 18, yPos + 10);
    
    doc.setFontSize(FONTS.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    
    const recommendation = calculations.npv > 0 && calculations.irr > 0
      ? `✓ This project shows positive returns with an NPV of ${formatCurrency(calculations.npv, currency)} and payback in ${calculations.paybackPeriod} months.`
      : `⚠ This project requires careful consideration. Review the detailed cash flow analysis before proceeding.`;
    
    const recLines = doc.splitTextToSize(recommendation, pageWidth - 40);
    doc.text(recLines, 18, yPos + 20);
  }
}

/**
 * Create annual cash flow analysis page
 */
function createAnnualCashFlowAnalysis(doc: jsPDF, data: BusinessData, calculations: any) {
  doc.addPage();
  addHeader(doc, data.meta.title);
  
  let yPos = 35;
  const currency = data.meta.currency;
  const isCostSavings = data.meta.business_model === 'cost_savings';
  
  // Title
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Annual Cash Flow Analysis', 14, yPos);
  yPos += 10;
  
  // Subtitle
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.secondary);
  doc.text('Year-by-year financial performance breakdown', 14, yPos);
  yPos += 15;
  
  // Aggregate monthly data to annual
  const annualData = aggregateToAnnual(calculations.monthlyData, currency);
  
  // Create annual summary table
  const tableData = annualData.map((year: any) => [
    year.year,
    formatCurrency(year.revenue, currency),
    formatCurrency(year.totalOpex, currency),
    formatCurrency(year.capex, currency),
    formatCurrency(year.netCashFlow, currency),
  ]);
  
  // Add totals row
  const totals = [
    'Total (5Y)',
    formatCurrency(annualData.reduce((sum, y) => sum + y.revenue, 0), currency),
    formatCurrency(annualData.reduce((sum, y) => sum + y.totalOpex, 0), currency),
    formatCurrency(annualData.reduce((sum, y) => sum + y.capex, 0), currency),
    formatCurrency(annualData.reduce((sum, y) => sum + y.netCashFlow, 0), currency),
  ];
  tableData.push(totals);
  
  autoTable(doc, {
    startY: yPos,
    head: [[
      'Period', 
      isCostSavings ? 'Benefits' : 'Revenue',
      'Operating Expenses', 
      'Capital Expenses', 
      'Net Cash Flow'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: COLORS.primary,
      fontSize: FONTS.body,
      fontStyle: 'bold',
      textColor: [255, 255, 255]
    },
    bodyStyles: {
      fontSize: FONTS.body,
    },
    footStyles: {
      fillColor: COLORS.dark,
      fontStyle: 'bold',
      fontSize: FONTS.body,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
    didParseCell: function(data) {
      // Style the totals row
      if (data.row.index === tableData.length - 1 && data.section === 'body') {
        data.cell.styles.fillColor = [37, 99, 235]; // Blue
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Key insights section
  if (yPos < 230) {
    doc.setFillColor(COLORS.light);
    doc.roundedRect(14, yPos, doc.internal.pageSize.width - 28, 40, 3, 3, 'F');
    
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Cash Flow Insights', 18, yPos + 10);
    
    doc.setFontSize(FONTS.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    
    const insights = [
      `• Cumulative net cash flow over 5 years: ${formatCurrency(calculations.netProfit, currency)}`,
      `• Average annual cash flow: ${formatCurrency(calculations.netProfit / Math.min(5, annualData.length), currency)}`,
      `• Break-even achieved: ${calculations.breakEvenMonth > 0 ? `Month ${calculations.breakEvenMonth}` : 'Not within period'}`,
      `• Peak funding requirement: ${formatCurrency(calculations.totalInvestmentRequired, currency)}`,
    ];
    
    let insightY = yPos + 20;
    insights.forEach((insight) => {
      doc.text(insight, 18, insightY);
      insightY += 7;
    });
  }
}

/**
 * Create cash flow visualization data page
 */
function createCashFlowVisualization(doc: jsPDF, data: BusinessData, calculations: any) {
  doc.addPage();
  addHeader(doc, data.meta.title);
  
  let yPos = 35;
  const currency = data.meta.currency;
  const isCostSavings = data.meta.business_model === 'cost_savings';
  
  // Title
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Cash Flow Trends & Patterns', 14, yPos);
  yPos += 10;
  
  // Subtitle
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.secondary);
  doc.text('Monthly progression of key financial metrics', 14, yPos);
  yPos += 15;
  
  // Cumulative cash flow progression - show quarterly data for readability
  const quarterlyData: any[] = [];
  for (let i = 0; i < calculations.monthlyData.length; i += 3) {
    const quarterMonths = calculations.monthlyData.slice(i, Math.min(i + 3, calculations.monthlyData.length));
    if (quarterMonths.length > 0) {
      let cumulativeCF = 0;
      for (let j = 0; j <= i; j++) {
        if (calculations.monthlyData[j]) {
          cumulativeCF += calculations.monthlyData[j].netCashFlow;
        }
      }
      
      quarterlyData.push({
        quarter: `Q${Math.floor(i / 3) + 1}`,
        revenue: quarterMonths.reduce((sum, m) => sum + m.revenue, 0),
        opex: quarterMonths.reduce((sum, m) => sum + m.totalOpex, 0),
        netCashFlow: quarterMonths.reduce((sum, m) => sum + m.netCashFlow, 0),
        cumulative: cumulativeCF,
      });
    }
  }
  
  // Limit to first 20 quarters (5 years) for readability
  const displayData = quarterlyData.slice(0, 20);
  
  const chartTableData = displayData.map((q: any) => [
    q.quarter,
    formatCurrency(q.revenue, currency),
    formatCurrency(q.opex, currency),
    formatCurrency(q.netCashFlow, currency),
    formatCurrency(q.cumulative, currency),
  ]);
  
  doc.setFontSize(FONTS.subheading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Quarterly Cash Flow Progression', 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [[
      'Quarter',
      isCostSavings ? 'Benefits' : 'Revenue',
      'Op. Expenses',
      'Net Cash Flow',
      'Cumulative CF'
    ]],
    body: chartTableData,
    theme: 'grid',
    headStyles: { 
      fillColor: COLORS.primary,
      fontSize: FONTS.small,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: FONTS.small,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
    didParseCell: function(data) {
      // Highlight negative cumulative cash flow
      if (data.column.index === 4 && data.section === 'body') {
        const value = quarterlyData[data.row.index]?.cumulative || 0;
        if (value < 0) {
          data.cell.styles.textColor = [239, 68, 68]; // Red
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // Green
        }
      }
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Cash flow analysis insights
  if (yPos < 230) {
    doc.setFillColor(COLORS.light);
    doc.roundedRect(14, yPos, doc.internal.pageSize.width - 28, 30, 3, 3, 'F');
    
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Cash Flow Analysis', 18, yPos + 10);
    
    doc.setFontSize(FONTS.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    
    const positiveMonths = calculations.monthlyData.filter((m: MonthlyData) => m.netCashFlow > 0).length;
    const negativeMonths = calculations.monthlyData.length - positiveMonths;
    
    doc.text(
      `The project shows ${positiveMonths} months with positive cash flow and ${negativeMonths} months with negative cash flow. ` +
      `Break-even is ${calculations.breakEvenMonth > 0 ? `reached at month ${calculations.breakEvenMonth}` : 'not achieved within the analysis period'}.`,
      18,
      yPos + 22,
      { maxWidth: doc.internal.pageSize.width - 36 }
    );
  }
}

/**
 * Create revenue analysis page
 */
function createRevenueAnalysis(doc: jsPDF, data: BusinessData) {
  doc.addPage();
  addHeader(doc, data.meta.title);
  
  let yPos = 35;
  
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Revenue & Volume Analysis', 14, yPos);
  yPos += 15;
  
  // Customer segments
  if (data.assumptions.customers?.segments && data.assumptions.customers.segments.length > 0) {
    doc.setFontSize(FONTS.subheading);
    doc.text('Customer Segments', 14, yPos);
    yPos += 10;
    
    const segmentData = data.assumptions.customers.segments.map((segment) => {
      const volumeData = segment.volume;
      let volumeInfo = 'N/A';
      
      if (volumeData) {
        if (volumeData.type === 'pattern') {
          volumeInfo = `${volumeData.pattern_type || 'N/A'}`;
        } else if (volumeData.type === 'time_series' && volumeData.series) {
          volumeInfo = `Time Series (${volumeData.series.length} periods)`;
        }
      }
      
      return [
        segment.label,
        volumeInfo,
        segment.rationale || 'No rationale provided',
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Segment', 'Volume Type', 'Rationale']],
      body: segmentData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      margin: { left: 14, right: 14 },
      styles: { fontSize: FONTS.small },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Pricing information
  if (data.assumptions.pricing?.avg_unit_price) {
    if (yPos > 250) {
      doc.addPage();
      addHeader(doc, data.meta.title);
      yPos = 35;
    }
    
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Pricing Strategy', 14, yPos);
    yPos += 10;
    
    const pricingData = [
      ['Average Unit Price', formatCurrency(data.assumptions.pricing.avg_unit_price.value, data.meta.currency)],
      ['Rationale', data.assumptions.pricing.avg_unit_price.rationale],
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: pricingData,
      theme: 'plain',
      margin: { left: 14, right: 14 },
      styles: { fontSize: FONTS.body },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
}

/**
 * Create cost structure page
 */
function createCostStructure(doc: jsPDF, data: BusinessData) {
  doc.addPage();
  addHeader(doc, data.meta.title);
  
  let yPos = 35;
  
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Structure', 14, yPos);
  yPos += 15;
  
  // OPEX
  if (data.assumptions.opex && data.assumptions.opex.length > 0) {
    doc.setFontSize(FONTS.subheading);
    doc.text('Operating Expenses (OPEX)', 14, yPos);
    yPos += 10;
    
    const opexData = data.assumptions.opex.map((item) => [
      item.name,
      formatCurrency(item.value.value, data.meta.currency),
      item.value.rationale,
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Item', 'Value', 'Rationale']],
      body: opexData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      margin: { left: 14, right: 14 },
      styles: { fontSize: FONTS.small },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // CAPEX
  if (data.assumptions.capex && data.assumptions.capex.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      addHeader(doc, data.meta.title);
      yPos = 35;
    }
    
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Capital Expenditure (CAPEX)', 14, yPos);
    yPos += 10;
    
    const capexData = data.assumptions.capex.map((item) => [
      item.name,
      item.timeline?.type || 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Item', 'Timeline Type']],
      body: capexData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      margin: { left: 14, right: 14 },
      styles: { fontSize: FONTS.small },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Unit Economics
  if (data.assumptions.unit_economics) {
    if (yPos > 230) {
      doc.addPage();
      addHeader(doc, data.meta.title);
      yPos = 35;
    }
    
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Unit Economics', 14, yPos);
    yPos += 10;
    
    const unitEconData: string[][] = [];
    
    if (data.assumptions.unit_economics.cogs_pct) {
      unitEconData.push([
        'Cost of Goods Sold (COGS)',
        `${data.assumptions.unit_economics.cogs_pct.value}%`,
        data.assumptions.unit_economics.cogs_pct.rationale,
      ]);
    }
    
    if (data.assumptions.unit_economics.cac) {
      unitEconData.push([
        'Customer Acquisition Cost (CAC)',
        formatCurrency(data.assumptions.unit_economics.cac.value, data.meta.currency),
        data.assumptions.unit_economics.cac.rationale,
      ]);
    }
    
    if (unitEconData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value', 'Rationale']],
        body: unitEconData,
        theme: 'striped',
        headStyles: { fillColor: COLORS.primary },
        margin: { left: 14, right: 14 },
        styles: { fontSize: FONTS.small },
      });
    }
  }
}

/**
 * Main export function - Creates a comprehensive, C-suite ready PDF report
 */
export async function exportBusinessCaseToPDF(
  data: BusinessData,
  providedCalculations?: any
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Calculate metrics if not provided
  const calculations = providedCalculations || calculateBusinessMetrics(data);
  
  // 1. Create professional cover page
  createCoverPage(doc, data);
  
  // 2. Create executive summary with 6 key metrics
  createExecutiveSummary(doc, data, calculations);
  
  // 3. Create annual cash flow analysis table
  createAnnualCashFlowAnalysis(doc, data, calculations);
  
  // 4. Create cash flow visualization (quarterly data)
  createCashFlowVisualization(doc, data, calculations);
  
  // 5. Create revenue/volume analysis
  createRevenueAnalysis(doc, data);
  
  // 6. Create cost structure breakdown
  createCostStructure(doc, data);
  
  // Add page numbers to all pages except cover
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, totalPages - 1);
  }
  
  // Generate descriptive filename
  const sanitizedTitle = data.meta.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `business-case-${sanitizedTitle}-${dateStr}.pdf`;
  
  // Save the PDF
  doc.save(filename);
}
