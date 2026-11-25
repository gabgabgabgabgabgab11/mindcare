import { buildBrandedReportPdf } from './brandedReportPdf';

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

export function buildOperationsReportPdf(data: OverviewReportData) {
  return buildBrandedReportPdf('Operations overview', data.generatedAt, [
    { title: 'Key operational indicators', headers: ['Metric', 'Value'], rows: Object.entries(data.kpis) },
    { title: 'Moderation activity', headers: ['Date', 'Pending', 'Approved', 'Rejected', 'Total'],
      rows: data.moderationTimeline.map(row => [row.date, row.pending, row.approved, row.rejected, row.pending + row.approved + row.rejected]) },
    { title: 'Audit activity', headers: ['Date', 'Event types', 'Count'],
      rows: data.auditTimeline.map(row => [row.date, row.type || 'System event', row.count]) },
    { title: 'Resource directory', headers: ['Category', 'Active', 'Inactive'],
      rows: data.resourceSummary.map(row => [row.category, row.active, row.inactive]) },
  ]);
}

export function downloadPdfReport(data: OverviewReportData) {
  buildOperationsReportPdf(data).save(`mindcare-operations-report-${data.generatedAt.slice(0, 10)}.pdf`);
}
