import jsPDF from 'jspdf';

export interface OverviewReportData {
  generatedAt: string;
  kpis: Record<string, number | string>;
  auditTimeline: { date: string; count: number; type?: string }[];
  moderationTimeline: { date: string; pending: number; approved: number; rejected: number }[];
  resourceSummary: { category: string; active: number; inactive: number }[];
}

function toCsv(data: OverviewReportData): string {
  const lines: string[] = [];
  lines.push('MindCare Operations & Analytics Report');
  lines.push(`Institution,Polytechnic University of the Philippines - Santa Maria Campus`);
  lines.push(`Generated At,${data.generatedAt}`);
  lines.push(`Classification,Internal Operations & Administrative Use`);
  lines.push('');
  lines.push('=== KEY PERFORMANCE METRICS ===');
  lines.push('Metric,Value');
  Object.entries(data.kpis).forEach(([key, value]) => lines.push(`"${key}",${value}`));
  lines.push('');
  lines.push('=== MODERATION TIMELINE (LAST 30 DAYS) ===');
  lines.push('Date,Pending,Approved,Rejected,Total Processed');
  data.moderationTimeline.forEach((row) =>
    lines.push(`${row.date},${row.pending},${row.approved},${row.rejected},${row.pending + row.approved + row.rejected}`)
  );
  lines.push('');
  lines.push('=== AUDIT EVENT TIMELINE ===');
  lines.push('Date,Event Type,Total Count');
  data.auditTimeline.forEach((row) => lines.push(`${row.date},"${row.type || 'System Event'}",${row.count}`));
  lines.push('');
  lines.push('=== CAMPUS RESOURCE DIRECTORY ===');
  lines.push('Category,Active Resources,Inactive Resources');
  data.resourceSummary.forEach((row) => lines.push(`"${row.category}",${row.active},${row.inactive}`));
  return lines.join('\n');
}

export function downloadCsvReport(data: OverviewReportData) {
  const csv = toCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindcare-operations-report-${data.generatedAt.slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPdfReport(data: OverviewReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // 1. Top Decorative Brand Accent Bar
  doc.setFillColor(48, 108, 100); // MindCare brand 600
  doc.rect(0, 0, pageWidth, 5, 'F');
  y = 15;

  // 2. Institutional Header & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(48, 108, 100); // MindCare brand
  doc.text('POLYTECHNIC UNIVERSITY OF THE PHILIPPINES • SANTA MARIA CAMPUS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('MindCare Operations & Analytics Report', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  const dateStr = new Date(data.generatedAt).toLocaleString([], {
    dateStyle: 'long',
    timeStyle: 'medium',
  });
  doc.text(`Generated: ${dateStr}  |  Classification: Confidential / Administrative Use`, margin, y);
  y += 4;

  // Divider Line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 7;

  // 3. Key Metrics Summary Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('KEY OPERATIONAL INDICATORS', margin, y);
  y += 4;

  // Render 5 KPI Cards in a row
  const kpiEntries = Object.entries(data.kpis);
  const cardGap = 2.5;
  const cardWidth = (contentWidth - cardGap * (kpiEntries.length - 1)) / kpiEntries.length;
  const cardHeight = 17;

  kpiEntries.forEach(([label, value], i) => {
    const x = margin + i * (cardWidth + cardGap);

    // Card background & border
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const splitLabel = doc.splitTextToSize(label.toUpperCase(), cardWidth - 3);
    doc.text(splitLabel[0] || label, x + 2, y + 4.5);

    // Metric Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(48, 108, 100); // MindCare brand 600
    doc.text(String(value), x + 2, y + 13);
  });

  y += cardHeight + 8;

  // 4. Moderation Queue Activity Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('MODERATION THROUGHPUT SUMMARY (TRAILING DAYS)', margin, y);
  y += 4;

  // Table Column Headers
  const colDateWidth = 35;
  const colPendingWidth = 35;
  const colApprovedWidth = 35;
  const colRejectedWidth = 35;

  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(margin, y, contentWidth, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Date', margin + 3, y + 4.2);
  doc.text('Pending Submissions', margin + colDateWidth + 3, y + 4.2);
  doc.text('Approved Posts', margin + colDateWidth + colPendingWidth + 3, y + 4.2);
  doc.text('Rejected Posts', margin + colDateWidth + colPendingWidth + colApprovedWidth + 3, y + 4.2);
  doc.text('Daily Total', margin + colDateWidth + colPendingWidth + colApprovedWidth + colRejectedWidth + 3, y + 4.2);
  y += 6;

  // Data rows (show latest up to 7 entries)
  const modRows = data.moderationTimeline.slice(-7);
  if (modRows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No moderation events recorded in the current logging window.', margin + 3, y + 5);
    y += 8;
  } else {
    modRows.forEach((row, idx) => {
      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(row.date, margin + 3, y + 4);
      doc.text(String(row.pending), margin + colDateWidth + 3, y + 4);
      doc.text(String(row.approved), margin + colDateWidth + colPendingWidth + 3, y + 4);
      doc.text(String(row.rejected), margin + colDateWidth + colPendingWidth + colApprovedWidth + 3, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(
        String(row.pending + row.approved + row.rejected),
        margin + colDateWidth + colPendingWidth + colApprovedWidth + colRejectedWidth + 3,
        y + 4
      );
      y += 5.5;
    });
  }

  y += 6;

  // 5. Audit Activity Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('AUDIT EVENT VOLUME (TRAILING DAYS)', margin, y);
  y += 4;

  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(margin, y, contentWidth, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Date', margin + 3, y + 4.2);
  doc.text('Recorded Event Actions', margin + 45 + 3, y + 4.2);
  doc.text('Aggregate Events', margin + contentWidth - 30, y + 4.2);
  y += 6;

  const auditRows = data.auditTimeline.slice(-7);
  if (auditRows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No audit events registered in the current window.', margin + 3, y + 5);
    y += 8;
  } else {
    auditRows.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(row.date, margin + 3, y + 4);
      doc.text(row.type || 'System Action', margin + 45 + 3, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(String(row.count), margin + contentWidth - 25, y + 4);
      y += 5.5;
    });
  }

  y += 6;

  // 6. Institutional Compliance & Privacy Box
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DATA PRIVACY & CLINICAL ETHICS NOTICE (RA 10173 / ADR-006):', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const privacyNotice =
    'This report contains aggregate operational platform counts only. Individual student responses, assessment answers, mood journal contents, and numeric mental health scores are strictly omitted in compliance with student privacy regulations and psychological confidentiality agreements.';
  const splitNotice = doc.splitTextToSize(privacyNotice, contentWidth - 6);
  doc.text(splitNotice, margin + 3, y + 8.5);

  // 7. Page Footer
  const footerY = pageHeight - 10;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 2, margin + contentWidth, footerY - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('MindCare Student Mental Health Support System • PUP Santa Maria Campus', margin, footerY + 2);
  doc.text('Official Operations Export', margin + contentWidth - 35, footerY + 2);

  doc.save(`mindcare-operations-report-${data.generatedAt.slice(0, 10)}.pdf`);
}
