/**
 * Market Analysis PDF Export Service
 * 
 * Generates professional PDF reports for market analysis
 * Features: Cover page, market sizing, competitive landscape, customer analysis
 */

/**
 * PDF Export Service - Market Analysis
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MarketData } from '@/core/types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

const COLORS = {
  primary: '#10b981',
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
  if (Math.abs(value) >= 1_000_000_000) {
    return `${currency} ${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (Math.abs(value) >= 1_000_000) {
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
function createCoverPage(doc: jsPDF, data: MarketData) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Background gradient effect
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, pageHeight / 2, 'F');
  
  // Title section
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.title);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Analysis Report', pageWidth / 2, 60, { align: 'center' });
  
  // Market title
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'normal');
  const marketTitle = data.meta?.title || 'Untitled Market Analysis';
  doc.text(marketTitle, pageWidth / 2, 80, { align: 'center' });
  
  // Description box
  if (data.meta?.description) {
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
  doc.text('Analysis Details', pageWidth / 2, startY + 12, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.small);
  
  const metadata = [
    `Currency: ${data.meta?.currency || 'USD'}`,
    `Base Year: ${data.meta?.base_year || new Date().getFullYear()}`,
    `Horizon: ${data.meta?.analysis_horizon_years || 'N/A'} years`,
    `Analyst: ${data.meta?.analyst || 'Not Specified'}`,
    `Generated: ${new Date().toLocaleDateString()}`,
  ];
  
  let yPos = startY + 25;
  metadata.forEach((line) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
  });
  
  // Branding footer
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'italic');
  doc.text('Powered by Bizcaseland', pageWidth / 2, pageHeight - 20, { align: 'center' });
}

/**
 * Create market sizing page
 */
function createMarketSizing(doc: jsPDF, data: MarketData) {
  doc.addPage();
  addHeader(doc, data.meta?.title || 'Market Analysis');
  
  let yPos = 35;
  
  // Title
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Sizing', 14, yPos);
  yPos += 15;
  
  const currency = data.meta?.currency || 'USD';
  
  // TAM, SAM, SOM boxes
  if (data.market_sizing) {
    const { total_addressable_market, serviceable_addressable_market, serviceable_obtainable_market } = data.market_sizing;
    
    if (total_addressable_market) {
      // TAM Box
      doc.setFillColor(COLORS.primary);
      doc.roundedRect(14, yPos, doc.internal.pageSize.width - 28, 35, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'normal');
      doc.text('Total Addressable Market (TAM)', 20, yPos + 8);
      
      doc.setFontSize(FONTS.subheading);
      doc.setFont('helvetica', 'bold');
      doc.text(
        formatCurrency(total_addressable_market.base_value.value, currency),
        20,
        yPos + 18
      );
      
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Growth: ${formatPercentage(total_addressable_market.growth_rate.value)}`,
        20,
        yPos + 28
      );
      
      yPos += 45;
      
      // TAM Details
      doc.setTextColor(COLORS.text);
      doc.setFontSize(FONTS.body);
      doc.setFont('helvetica', 'bold');
      doc.text('Market Definition:', 20, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.small);
      const tamDefinition = doc.splitTextToSize(
        total_addressable_market.market_definition,
        doc.internal.pageSize.width - 45
      );
      doc.text(tamDefinition, 20, yPos);
      yPos += tamDefinition.length * 5 + 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONTS.body);
      doc.text('Rationale:', 20, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.small);
      const tamRationale = doc.splitTextToSize(
        total_addressable_market.base_value.rationale,
        doc.internal.pageSize.width - 45
      );
      doc.text(tamRationale, 20, yPos);
      yPos += tamRationale.length * 5 + 10;
    }
    
    // SAM Box
    if (serviceable_addressable_market) {
      if (yPos > 230) {
        doc.addPage();
        addHeader(doc, data.meta?.title || 'Market Analysis');
        yPos = 35;
      }
      
      const tamValue = total_addressable_market?.base_value.value || 0;
      const samValue = (tamValue * serviceable_addressable_market.percentage_of_tam.value) / 100;
      
      doc.setFillColor(COLORS.success);
      doc.roundedRect(14, yPos, doc.internal.pageSize.width - 28, 30, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'normal');
      doc.text('Serviceable Addressable Market (SAM)', 20, yPos + 8);
      
      doc.setFontSize(FONTS.subheading);
      doc.setFont('helvetica', 'bold');
      doc.text(
        formatCurrency(samValue, currency),
        20,
        yPos + 18
      );
      
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${formatPercentage(serviceable_addressable_market.percentage_of_tam.value)} of TAM`,
        20,
        yPos + 25
      );
      
      yPos += 40;
    }
    
    // SOM Box
    if (serviceable_obtainable_market) {
      if (yPos > 230) {
        doc.addPage();
        addHeader(doc, data.meta?.title || 'Market Analysis');
        yPos = 35;
      }
      
      const tamValue = total_addressable_market?.base_value.value || 0;
      const samPct = serviceable_addressable_market?.percentage_of_tam.value || 0;
      const samValue = (tamValue * samPct) / 100;
      const somValue = (samValue * serviceable_obtainable_market.percentage_of_sam.value) / 100;
      
      doc.setFillColor(COLORS.warning);
      doc.roundedRect(14, yPos, doc.internal.pageSize.width - 28, 30, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'normal');
      doc.text('Serviceable Obtainable Market (SOM)', 20, yPos + 8);
      
      doc.setFontSize(FONTS.subheading);
      doc.setFont('helvetica', 'bold');
      doc.text(
        formatCurrency(somValue, currency),
        20,
        yPos + 18
      );
      
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${formatPercentage(serviceable_obtainable_market.percentage_of_sam.value)} of SAM`,
        20,
        yPos + 25
      );
      
      yPos += 40;
    }
  }
}

/**
 * Create competitive landscape page
 */
function createCompetitiveLandscape(doc: jsPDF, data: MarketData) {
  doc.addPage();
  addHeader(doc, data.meta?.title || 'Market Analysis');
  
  let yPos = 35;
  
  // Title
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Competitive Landscape', 14, yPos);
  yPos += 15;
  
  if (data.competitive_landscape) {
    // Market Structure
    if (data.competitive_landscape.market_structure) {
      const { concentration_level, concentration_rationale, barriers_to_entry, barriers_description } = 
        data.competitive_landscape.market_structure;
      
      doc.setFontSize(FONTS.subheading);
      doc.text('Market Structure', 14, yPos);
      yPos += 10;
      
      const structureData = [
        ['Concentration Level', concentration_level],
        ['Rationale', concentration_rationale],
        ['Barriers to Entry', barriers_to_entry],
        ['Barriers Description', barriers_description],
      ];
      
      autoTable(doc, {
        startY: yPos,
        body: structureData,
        theme: 'plain',
        margin: { left: 14, right: 14 },
        styles: { fontSize: FONTS.body },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Competitors
    if (data.competitive_landscape.competitors && data.competitive_landscape.competitors.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        addHeader(doc, data.meta?.title || 'Market Analysis');
        yPos = 35;
      }
      
      doc.setFontSize(FONTS.subheading);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Competitors', 14, yPos);
      yPos += 10;
      
      const competitorData = data.competitive_landscape.competitors.map((competitor) => [
        competitor.name,
        formatPercentage(competitor.market_share.value),
        competitor.positioning,
        competitor.threat_level,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Competitor', 'Market Share', 'Positioning', 'Threat Level']],
        body: competitorData,
        theme: 'striped',
        headStyles: { fillColor: COLORS.primary },
        margin: { left: 14, right: 14 },
        styles: { fontSize: FONTS.small },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Competitive Advantages
    if (data.competitive_landscape.competitive_advantages && 
        data.competitive_landscape.competitive_advantages.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        addHeader(doc, data.meta?.title || 'Market Analysis');
        yPos = 35;
      }
      
      doc.setFontSize(FONTS.subheading);
      doc.setFont('helvetica', 'bold');
      doc.text('Competitive Advantages', 14, yPos);
      yPos += 10;
      
      const advantageData = data.competitive_landscape.competitive_advantages.map((advantage) => [
        advantage.advantage,
        advantage.sustainability,
        advantage.rationale,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Advantage', 'Sustainability', 'Rationale']],
        body: advantageData,
        theme: 'striped',
        headStyles: { fillColor: COLORS.primary },
        margin: { left: 14, right: 14 },
        styles: { fontSize: FONTS.small },
      });
    }
  }
}

/**
 * Create customer analysis page
 */
function createCustomerAnalysis(doc: jsPDF, data: MarketData) {
  doc.addPage();
  addHeader(doc, data.meta?.title || 'Market Analysis');
  
  let yPos = 35;
  
  // Title
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Analysis', 14, yPos);
  yPos += 15;
  
  const currency = data.meta?.currency || 'USD';
  
  if (data.customer_analysis?.market_segments && data.customer_analysis.market_segments.length > 0) {
    doc.setFontSize(FONTS.subheading);
    doc.text('Market Segments', 14, yPos);
    yPos += 10;
    
    const segmentData = data.customer_analysis.market_segments.map((segment) => [
      segment.name,
      formatPercentage(segment.size_percentage.value),
      formatCurrency(segment.size_value.value, currency),
      formatPercentage(segment.growth_rate.value),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Segment', 'Size %', 'Value', 'Growth Rate']],
      body: segmentData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      margin: { left: 14, right: 14 },
      styles: { fontSize: FONTS.small },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Segment details on subsequent pages
    data.customer_analysis.market_segments.forEach((segment) => {
      if (yPos > 220) {
        doc.addPage();
        addHeader(doc, data.meta?.title || 'Market Analysis');
        yPos = 35;
      }
      
      doc.setFontSize(FONTS.subheading);
      doc.setFont('helvetica', 'bold');
      doc.text(`Segment: ${segment.name}`, 14, yPos);
      yPos += 8;
      
      doc.setFontSize(FONTS.body);
      doc.setFont('helvetica', 'normal');
      
      const details = [
        `• ${segment.size_percentage.rationale}`,
        `• Growth: ${segment.growth_rate.rationale}`,
      ];
      
      details.forEach((detail) => {
        const wrapped = doc.splitTextToSize(detail, doc.internal.pageSize.width - 50);
        doc.text(wrapped, 20, yPos);
        yPos += wrapped.length * 5 + 3;
      });
      
      yPos += 5;
    });
  }
}

/**
 * Create market share page
 */
function createMarketShare(doc: jsPDF, data: MarketData) {
  if (!data.market_share) return;
  
  doc.addPage();
  addHeader(doc, data.meta?.title || 'Market Analysis');
  
  let yPos = 35;
  
  // Title
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Share Analysis', 14, yPos);
  yPos += 15;
  
  const currency = data.meta?.currency || 'USD';
  
  // Current Position
  if (data.market_share.current_position) {
    const { current_share, market_entry_date, current_revenue } = data.market_share.current_position;
    
    doc.setFontSize(FONTS.subheading);
    doc.text('Current Position', 14, yPos);
    yPos += 10;
    
    const currentData = [
      ['Current Market Share', formatPercentage(current_share.value)],
      ['Market Entry Date', market_entry_date],
      ['Current Revenue', formatCurrency(current_revenue.value, currency)],
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: currentData,
      theme: 'plain',
      margin: { left: 14, right: 14 },
      styles: { fontSize: FONTS.body },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Target Position
  if (data.market_share.target_position) {
    const { target_share, target_timeframe, penetration_strategy, key_milestones } = 
      data.market_share.target_position;
    
    if (yPos > 220) {
      doc.addPage();
      addHeader(doc, data.meta?.title || 'Market Analysis');
      yPos = 35;
    }
    
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Target Position', 14, yPos);
    yPos += 10;
    
    const targetData = [
      ['Target Market Share', formatPercentage(target_share.value)],
      ['Timeframe', `${target_timeframe.value} ${target_timeframe.unit}`],
      ['Penetration Strategy', penetration_strategy],
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: targetData,
      theme: 'plain',
      margin: { left: 14, right: 14 },
      styles: { fontSize: FONTS.body },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Key Milestones
    if (key_milestones && key_milestones.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        addHeader(doc, data.meta?.title || 'Market Analysis');
        yPos = 35;
      }
      
      doc.setFontSize(FONTS.subheading);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Milestones', 14, yPos);
      yPos += 10;
      
      const milestoneData = key_milestones.map((milestone) => [
        `Year ${milestone.year}`,
        milestone.milestone,
        formatPercentage(milestone.target_share),
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Year', 'Milestone', 'Target Share']],
        body: milestoneData,
        theme: 'striped',
        headStyles: { fillColor: COLORS.primary },
        margin: { left: 14, right: 14 },
        styles: { fontSize: FONTS.small },
      });
    }
  }
}

/**
 * Main export function
 */
export async function exportMarketAnalysisToPDF(data: MarketData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Create cover page
  createCoverPage(doc, data);
  
  // Create market sizing page
  if (data.market_sizing) {
    createMarketSizing(doc, data);
  }
  
  // Create competitive landscape page
  if (data.competitive_landscape) {
    createCompetitiveLandscape(doc, data);
  }
  
  // Create customer analysis page
  if (data.customer_analysis) {
    createCustomerAnalysis(doc, data);
  }
  
  // Create market share page
  if (data.market_share) {
    createMarketShare(doc, data);
  }
  
  // Add page numbers to all pages except cover
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, totalPages - 1);
  }
  
  // Generate filename
  const filename = `market-analysis-${(data.meta?.title || 'report').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(filename);
}
