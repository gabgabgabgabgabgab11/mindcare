import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const cache = new Map();
function moduleUrl(path) {
  if (cache.has(path)) return cache.get(path);
  let { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  outputText = outputText.replace(/import jsPDF from 'jspdf';/, `import { jsPDF } from '${import.meta.resolve('jspdf')}';`);
  outputText = outputText.replace(/from ['"](\.[^'"]+)['"]/g, (_, specifier) => `from '${moduleUrl(resolve(dirname(path), `${specifier}.ts`))}'`);
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  cache.set(path, url);
  return url;
}
const { buildWellnessReportPdf, buildWellnessReportSections, downloadWellnessPdfReport } = await import(moduleUrl(resolve(root, 'src/utils/wellnessReport.ts')));
const { buildOperationsReportPdf } = await import(moduleUrl(resolve(root, 'src/utils/exportReport.ts')));
const { jsPDF } = await import('jspdf');
const filters = { program: 'BSIT', year_level: '2', section: '', academic_year: '2026-2027', semester: '1st', date_range: 'custom', start_date: '2026-11-01', end_date: '2026-11-25' };
const data = {
  generatedAt: '2026-11-25T12:00:00Z', filters,
  overview: { total_students: 200, assessment_count: 120, assessment_participation_rate: 60, checkin_count: 150, checkin_participation_rate: 75, journal_count: 40, journal_participation_rate: 20, follow_up_flags: 4, cohort_hidden: false, min_cohort_size: 5 },
  screening: { sample_size: 120, average_phq9: 4.25, average_gad7: 3.5, cohort_hidden: false,
    phq9_distribution: { minimal: 50, mild: 40, moderate: 20, moderately_severe: 7, severe: 3 },
    gad7_distribution: { minimal: 60, mild: 35, moderate: 20, moderately_severe: 0, severe: 5 } },
  programGroups: { groups: [{ group_name: 'BSIT', student_count: 200, assessment_count: 120, average_phq9: 4.25, average_gad7: 3.5, cohort_hidden: false }] },
  yearGroups: { groups: [{ group_name: '2', student_count: 200, assessment_count: 120, average_phq9: 4.25, average_gad7: 3.5, cohort_hidden: false }] },
  sectionGroups: null,
  trend: { trend: Array.from({ length: 65 }, (_, i) => ({ date: `2026-${String(9 + Math.floor(i / 28)).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`, assessment_count: i, average_phq9: 4.25, average_gad7: null })) },
};

test('wellness export builds a genuine multi-page PDF with correct scope and all trend rows', () => {
  const doc = buildWellnessReportPdf(data);
  const pdf = doc.output();
  assert.ok(pdf.startsWith('%PDF-'));
  assert.ok(doc.getNumberOfPages() >= 3);
  for (const value of ['BSIT', '2nd Year', '2026-11-01', '2026-11-25', '2026-11-09', 'Wellness analytics']) assert.ok(pdf.includes(value), value);
});

test('suppressed screening values and distributions never enter the PDF data', () => {
  const hidden = structuredClone(data);
  hidden.screening.cohort_hidden = true;
  hidden.screening.average_phq9 = 999.99;
  hidden.programGroups.groups[0].cohort_hidden = true;
  hidden.programGroups.groups[0].average_phq9 = 999.99;
  const sections = buildWellnessReportSections(hidden);
  assert.ok(!JSON.stringify(sections).includes('999.99'));
  assert.ok(!sections.some(section => section.title === 'PHQ-9 distribution'));
  assert.match(JSON.stringify(sections), /privacy threshold/);
});

test('PDF download uses a PDF filename and CSV button retains its own handler', () => {
  let filename;
  const saved = jsPDF.API.save;
  jsPDF.API.save = function (value) { filename = value; return this; };
  try { downloadWellnessPdfReport(data); } finally { jsPDF.API.save = saved; }
  assert.equal(filename, 'mindcare-wellness-analytics-2026-11-25.pdf');
  const source = readFileSync(resolve(root, 'src/pages/AdminAnalytics.tsx'), 'utf8');
  const file = ts.createSourceFile('AdminAnalytics.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const handlers = {};
  function visit(node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === 'button') {
      const attributes = node.attributes.properties;
      const title = attributes.find(attr => attr.name?.getText(file) === 'title')?.initializer?.text;
      const click = attributes.find(attr => attr.name?.getText(file) === 'onClick')?.initializer?.getText(file);
      if (title) handlers[title] = click;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.match(handlers['Export as CSV'], /exportCsv\(/);
  assert.match(handlers['Export as styled PDF'], /downloadWellnessPdfReport\(/);
  assert.doesNotMatch(handlers['Export as styled PDF'], /exportCsv\(/);
});

test('operations report handles empty data and long audit descriptions', () => {
  const doc = buildOperationsReportPdf({ generatedAt: data.generatedAt, kpis: { 'Active resources': 4 }, moderationTimeline: [],
    auditTimeline: [{ date: '2026-11-25', type: 'Moderation event '.repeat(250), count: 2 }], resourceSummary: [] });
  assert.ok(doc.output().startsWith('%PDF-'));
  assert.ok(doc.getNumberOfPages() >= 2);
});

// Generate deterministic synthetic reports for optional rendered layout QA.
if (process.env.MINDCARE_PDF_QA_DIR) {
  mkdirSync(process.env.MINDCARE_PDF_QA_DIR, { recursive: true });
  writeFileSync(resolve(process.env.MINDCARE_PDF_QA_DIR, 'wellness-sample.pdf'), Buffer.from(buildWellnessReportPdf(data).output('arraybuffer')));
  writeFileSync(resolve(process.env.MINDCARE_PDF_QA_DIR, 'operations-sample.pdf'), Buffer.from(buildOperationsReportPdf({ generatedAt: data.generatedAt, kpis: { 'Pending moderation': 3, 'Approved posts': 48, 'Active resources': 9 }, auditTimeline: [{ date: '2026-11-25', type: 'Moderation; resource updates; consent events', count: 23 }], moderationTimeline: [{ date: '2026-11-25', pending: 3, approved: 9, rejected: 2 }], resourceSummary: [{ category: 'Campus support resources', active: 9, inactive: 2 }] }).output('arraybuffer')));
}
