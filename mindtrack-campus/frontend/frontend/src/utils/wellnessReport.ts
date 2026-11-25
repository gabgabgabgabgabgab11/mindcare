import type { GroupAnalytics, WellnessAnalyticsFilters, WellnessOverview, WellnessScreening, WellnessTrend } from '../types';
import { buildBrandedReportPdf, type ReportSection } from './brandedReportPdf';
import { yearLevelLabel } from '../constants/academicYears';

export interface WellnessReportData {
  generatedAt: string;
  filters: WellnessAnalyticsFilters;
  overview: WellnessOverview | null;
  screening: WellnessScreening | null;
  programGroups: GroupAnalytics | null;
  yearGroups: GroupAnalytics | null;
  sectionGroups: GroupAnalytics | null;
  trend: WellnessTrend | null;
}
const average = (value: number | null) => value === null ? 'N/A' : value.toFixed(2);
const rate = (value: number | null) => value === null ? 'N/A' : `${value.toFixed(1)}%`;

export function buildWellnessReportSections(data: WellnessReportData): ReportSection[] {
  const { filters: f, overview: o, screening: s } = data;
  const sections: ReportSection[] = [{
    title: 'Report scope', headers: ['Filter', 'Applied value'], rows: [
      ['Program', f.program || 'Overall campus'], ['Year level', f.year_level ? yearLevelLabel(f.year_level) : 'All years'],
      ['Section', f.section || 'All sections'], ['Academic year', f.academic_year || 'All academic years'],
      ['Semester', f.semester || 'all'], ['Date range', f.date_range],
      ...(f.date_range === 'custom' ? [['Start date', f.start_date], ['End date', f.end_date]] : []),
    ],
  }, {
    title: 'Campus participation', headers: ['Metric', 'Value'], rows: o ? [
      ['Students', o.total_students], ['Assessments', o.assessment_count], ['Assessment participation', rate(o.assessment_participation_rate)],
      ['Mood check-ins', o.checkin_count], ['Check-in participation', rate(o.checkin_participation_rate)],
      ['Journal entries', o.journal_count], ['Journal participation', rate(o.journal_participation_rate)], ['Follow-up flags', o.follow_up_flags],
    ] : [],
  }];
  sections.push({ title: 'Screening summaries', headers: ['Metric', 'Value'],
    note: s?.cohort_hidden ? 'Screening values withheld because the cohort is below the privacy threshold.' : 'Scores are aggregate screening summaries, not individual diagnoses.',
    rows: s?.cohort_hidden ? [['Screening values', 'Hidden']] : s ? [['Sample size', s.sample_size], ['Average PHQ-9', average(s.average_phq9)], ['Average GAD-7', average(s.average_gad7)]] : [],
  });
  if (s && !s.cohort_hidden) {
    for (const [title, distribution] of [['PHQ-9 distribution', s.phq9_distribution], ['GAD-7 distribution', s.gad7_distribution]] as const) {
      sections.push({ title, headers: ['Band', 'Count'], rows: Object.entries(distribution)
        .filter(([band]) => title !== 'GAD-7 distribution' || band !== 'moderately_severe')
        .map(([band, count]) => [band.replace(/_/g, ' '), count]) });
    }
  }
  for (const [title, groups] of [['By program', data.programGroups], ['By year level', data.yearGroups], ['By section', data.sectionGroups]] as const) {
    if (!groups) continue;
    sections.push({ title, headers: ['Group', 'Students', 'Assessments', 'Avg PHQ-9', 'Avg GAD-7'],
      note: 'Hidden values preserve the backend cohort privacy threshold.',
      rows: groups.groups.map(group => [title === 'By year level' ? yearLevelLabel(group.group_name) : group.group_name, group.student_count, group.assessment_count,
        group.cohort_hidden ? 'Hidden' : average(group.average_phq9), group.cohort_hidden ? 'Hidden' : average(group.average_gad7)]),
    });
  }
  if (data.trend) sections.push({ title: 'Wellness trend', headers: ['Date', 'Assessments', 'Avg PHQ-9', 'Avg GAD-7'],
    note: 'Unavailable or withheld trend averages remain N/A.',
    rows: data.trend.trend.map(point => [point.date, point.assessment_count, average(point.average_phq9), average(point.average_gad7)]),
  });
  return sections;
}

export function buildWellnessReportPdf(data: WellnessReportData) {
  return buildBrandedReportPdf('Wellness analytics', data.generatedAt, buildWellnessReportSections(data));
}

export function downloadWellnessPdfReport(data: WellnessReportData) {
  buildWellnessReportPdf(data).save(`mindcare-wellness-analytics-${data.generatedAt.slice(0, 10)}.pdf`);
}
