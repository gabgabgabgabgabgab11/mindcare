import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  ClipboardList,
  Heart,
  BookMarked,
  AlertTriangle,
  RefreshCw,
  Filter,
  X,
  Info,
  FileSpreadsheet,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LabelList,
} from 'recharts';
import { Card } from '../components/Card';
import { downloadWellnessPdfReport } from '../utils/wellnessReport';
import { ThemeToggle } from '../components/ThemeToggle';
import { YEAR_LEVEL_OPTIONS, yearLevelLabel } from '../constants/academicYears';
import {
  getWellnessByGroup,
  getWellnessFilterOptions,
  getWellnessOverview,
  getWellnessScreening,
  getWellnessTrend,
} from '../services/adminApi';
import type {
  GroupAnalytics,
  WellnessAnalyticsFilters,
  WellnessFilterOptions,
  WellnessOverview,
  WellnessScreening,
  WellnessTrend,
} from '../types';

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: WellnessAnalyticsFilters = {
  program: '',
  year_level: '',
  section: '',
  academic_year: '',
  semester: 'all',
  date_range: 'all',
  start_date: '',
  end_date: '',
};

const YEAR_LEVELS = YEAR_LEVEL_OPTIONS.map(option => option.value);
const SEMESTERS = [
  { value: 'all', label: 'All Semesters' },
  { value: '1st', label: '1st Semester' },
  { value: '2nd', label: '2nd Semester' },
  { value: 'summer', label: 'Summer' },
];
const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Dates' },
];

const PHQ9_SEVERITY_COLORS: Record<string, string> = {
  minimal: '#10b981',
  mild: '#84cc16',
  moderate: '#f59e0b',
  moderately_severe: '#ef4444',
  severe: '#991b1b',
};

const GAD7_SEVERITY_COLORS: Record<string, string> = {
  minimal: '#10b981',
  mild: '#84cc16',
  moderate: '#f59e0b',
  severe: '#ef4444',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function dateRangeToStartEnd(range: string): { start_date: string; end_date: string } {
  if (range === 'all' || range === 'custom' || range === 'semester') {
    return { start_date: '', end_date: '' };
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  };
}

function buildApiFilters(filters: WellnessAnalyticsFilters): Partial<WellnessAnalyticsFilters> {
  const base: Partial<WellnessAnalyticsFilters> = {};
  if (filters.program) base.program = filters.program;
  if (filters.year_level) base.year_level = filters.year_level;
  if (filters.section) base.section = filters.section;
  if (filters.academic_year) {
    base.academic_year = filters.academic_year;
    if (filters.semester && filters.semester !== 'all') base.semester = filters.semester;
  } else if (filters.date_range === 'custom') {
    if (filters.start_date) base.start_date = filters.start_date;
    if (filters.end_date) base.end_date = filters.end_date;
  } else {
    const { start_date, end_date } = dateRangeToStartEnd(filters.date_range);
    if (start_date) base.start_date = start_date;
    if (end_date) base.end_date = end_date;
  }
  return base;
}

function scopeLabel(filters: WellnessAnalyticsFilters): string {
  const parts: string[] = [];
  if (filters.program) parts.push(filters.program);
  else parts.push('Overall Campus');
  if (filters.year_level) parts.push(filters.year_level);
  if (filters.section) parts.push(filters.section);
  return parts.join(' → ');
}

function formatRate(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(1)}%`;
}

function formatAvg(value: number | null): string {
  if (value === null) return 'N/A';
  return value.toFixed(2);
}

// ── Export helpers ────────────────────────────────────────────────────────

function exportCsv(
  overview: WellnessOverview | null,
  screening: WellnessScreening | null,
  programGroups: GroupAnalytics | null,
  yearGroups: GroupAnalytics | null,
  activeFilters: WellnessAnalyticsFilters,
) {
  const lines: string[] = [];
  const now = new Date().toISOString();
  lines.push('MindCare Wellness Analytics Report');
  lines.push('Institution,Polytechnic University of the Philippines – Santa Maria Campus');
  lines.push(`Generated At,${now}`);
  lines.push(`Scope,"${scopeLabel(activeFilters)}"`);
  lines.push(`Report Type,Group summaries for administrative use`);
  lines.push('');
  lines.push('=== OVERVIEW ===');
  if (overview) {
    lines.push(`Total Students,${overview.total_students}`);
    lines.push(`Assessment Count,${overview.assessment_count}`);
    lines.push(`Students who completed a screening,${formatRate(overview.assessment_participation_rate)}`);
    lines.push(`Check-in Count,${overview.checkin_count}`);
    lines.push(`Students who checked in,${formatRate(overview.checkin_participation_rate)}`);
    lines.push(`Journal Count,${overview.journal_count}`);
    lines.push(`Students who wrote a journal entry,${formatRate(overview.journal_participation_rate)}`);
    lines.push(`Follow-up Flags,${overview.follow_up_flags}`);
  }
  lines.push('');
  lines.push('=== SCREENING AVERAGES ===');
  if (screening && !screening.cohort_hidden) {
    lines.push(`Sample Size,${screening.sample_size}`);
    lines.push(`Average PHQ-9,${formatAvg(screening.average_phq9)}`);
    lines.push(`Average GAD-7,${formatAvg(screening.average_gad7)}`);
    lines.push('');
    lines.push('PHQ-9 Distribution');
    lines.push('Band,Count');
    Object.entries(screening.phq9_distribution).forEach(([k, v]) => lines.push(`${k},${v}`));
    lines.push('');
    lines.push('GAD-7 Distribution');
    lines.push('Band,Count');
    Object.entries(screening.gad7_distribution).forEach(([k, v]) => lines.push(`${k},${v}`));
  } else {
    lines.push('Wellness scores hidden to protect student privacy (group is too small)');
  }
  lines.push('');
  lines.push('=== BY PROGRAM ===');
  lines.push('Program,Students,Assessments,Avg PHQ-9,Avg GAD-7');
  programGroups?.groups.forEach((g) =>
    lines.push(
      `"${g.group_name}",${g.student_count},${g.assessment_count},${
        g.cohort_hidden ? 'hidden' : formatAvg(g.average_phq9)
      },${g.cohort_hidden ? 'hidden' : formatAvg(g.average_gad7)}`,
    ),
  );
  lines.push('');
  lines.push('=== BY YEAR LEVEL ===');
  lines.push('Year Level,Students,Assessments,Avg PHQ-9,Avg GAD-7');
  yearGroups?.groups.forEach((g) =>
    lines.push(
      `"${g.group_name}",${g.student_count},${g.assessment_count},${
        g.cohort_hidden ? 'hidden' : formatAvg(g.average_phq9)
      },${g.cohort_hidden ? 'hidden' : formatAvg(g.average_gad7)}`,
    ),
  );

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindcare-wellness-analytics-${now.slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3" />
      <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2" />
      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-32" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="h-56 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
  onClick?: () => void;
  actionLabel?: string;
}

function KpiCard({ label, value, sub, icon, accent = 'text-brand-600 dark:text-brand-400', onClick, actionLabel }: KpiCardProps) {
  const content = <>
    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
      <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      <div className={accent}>{icon}</div>
    </div>
    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</div>
    {sub && <div className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</div>}
    {actionLabel && <div className="mt-2 text-[10px] font-bold text-brand-700 dark:text-brand-300">{actionLabel} <span aria-hidden="true">→</span></div>}
  </>;
  return (
    onClick ? <button type="button" onClick={onClick} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-1 text-left transition hover:border-brand-300 dark:hover:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40">{content}</button>
      : <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-1">{content}</div>
  );
}

function DistributionBarLabel(props: { x?: string | number; y?: string | number; width?: string | number; height?: string | number; value?: unknown; payload?: { percentage: number; count: number } }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const labelX = Number(x);
  const labelY = Number(y);
  const labelWidth = Number(width);
  const labelHeight = Number(height);
  if (!payload || labelHeight < 30 || labelWidth < 26) return null;
  return <text x={labelX + labelWidth / 2} y={labelY + labelHeight / 2 - 2} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={700}>
    <tspan x={labelX + labelWidth / 2} dy="0">{`${payload.percentage.toFixed(0)}%`}</tspan>
    <tspan x={labelX + labelWidth / 2} dy="10">{payload.count}</tspan>
  </text>;
}

function ScoreBarLabel(props: { x?: string | number; y?: string | number; width?: string | number; height?: string | number; value?: unknown }) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  if (typeof props.value !== 'string' || !props.value || height < 30) return null;
  const [percent, score] = props.value.split('|');
  return <text x={x + width / 2} y={y + height / 2 - 2} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={700}>
    <tspan x={x + width / 2} dy="0">{percent}</tspan>
    <tspan x={x + width / 2} dy="10">{score}</tspan>
  </text>;
}

interface ReadableTooltipItem {
  name?: string;
  value?: string | number;
  payload?: Record<string, unknown>;
}

function ReadableChartTooltip({ active, label, payload }: { active?: boolean; label?: string | number; payload?: ReadableTooltipItem[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-500 bg-slate-950 px-3 py-2 text-xs shadow-xl" style={{ color: '#fff' }}>
      <p className="mb-1 font-bold" style={{ color: '#fff' }}>{label}</p>
      {payload.map((item, index) => {
        const point = item.payload ?? {};
        const name = item.name ?? 'Result';
        const value = Number(item.value ?? 0);
        let detail = `${value.toFixed(1)}%`;
        if (typeof point.count === 'number') {
          detail = `${value.toFixed(1)}% · ${point.count} screenings`;
        } else if (name.includes('PHQ-9 average') && typeof point.average_phq9 === 'number') {
          detail = `${value.toFixed(1)}% of highest score · ${formatAvg(point.average_phq9)} out of 27`;
        } else if (name.includes('GAD-7 average') && typeof point.average_gad7 === 'number') {
          detail = `${value.toFixed(1)}% of highest score · ${formatAvg(point.average_gad7)} out of 21`;
        } else if (name.includes('PHQ-9') || name.includes('GAD-7')) {
          detail = formatAvg(value);
        }
        return <p key={`${name}-${index}`} className="leading-5" style={{ color: '#fff' }}>{name}: {detail}</p>;
      })}
    </div>
  );
}

function toScorePercent(score: number | null, maxScore: number) {
  return score === null ? null : Math.min(100, (score / maxScore) * 100);
}

function CohortHiddenBanner({ minSize }: { minSize: number }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30">
      <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        <span className="font-semibold block mb-0.5">Not enough students to show results</span>
        Results are hidden for groups with fewer than {minSize} students to protect
        student privacy. Choose a larger group to see them.
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export const AdminAnalytics = () => {
  // ─ State ─────────────────────────────────────────────────────────────────
  const [pendingFilters, setPendingFilters] = useState<WellnessAnalyticsFilters>(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState<WellnessAnalyticsFilters>(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState<WellnessFilterOptions>({
    programs: [],
    year_levels: YEAR_LEVELS,
    sections: [],
    academic_years: [],
  });

  const [overview, setOverview] = useState<WellnessOverview | null>(null);
  const [screening, setScreening] = useState<WellnessScreening | null>(null);
  const [programGroups, setProgramGroups] = useState<GroupAnalytics | null>(null);
  const [yearGroups, setYearGroups] = useState<GroupAnalytics | null>(null);
  const [sectionGroups, setSectionGroups] = useState<GroupAnalytics | null>(null);
  const [trend, setTrend] = useState<WellnessTrend | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomDates, setShowCustomDates] = useState(false);

  // ─ Fetch filter options ──────────────────────────────────────────────────
  useEffect(() => {
    getWellnessFilterOptions(
      pendingFilters.program || undefined,
      pendingFilters.year_level || undefined,
    )
      .then((opts) =>
        setFilterOptions((prev) => ({
          ...prev,
          programs: opts.programs,
          sections: opts.sections,
          academic_years: opts.academic_years,
        })),
      )
      .catch(() => {});
  }, [pendingFilters.program, pendingFilters.year_level]);

  // ─ Fetch analytics data ──────────────────────────────────────────────────
  const loadAnalytics = useCallback(async (filters: WellnessAnalyticsFilters) => {
    setIsLoading(true);
    setError(null);
    const f = buildApiFilters(filters);
    try {
      const [ov, sc, pg, yg, sg, tr] = await Promise.all([
        getWellnessOverview(f),
        getWellnessScreening(f),
        getWellnessByGroup('program', f),
        getWellnessByGroup('year_level', f),
        filters.program && filters.year_level
          ? getWellnessByGroup('section', f)
          : Promise.resolve({ groups: [] }),
        getWellnessTrend(f),
      ]);
      setOverview(ov);
      setScreening(sc);
      setProgramGroups(pg);
      setYearGroups(yg);
      setSectionGroups(sg);
      setTrend(tr);
    } catch {
      setError('Unable to load analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(activeFilters);
  }, [activeFilters, loadAnalytics]);

  // ─ Filter handlers ────────────────────────────────────────────────────────
  const handleApplyFilters = () => {
    setActiveFilters({ ...pendingFilters });
    if (pendingFilters.section) {
      window.setTimeout(() => scrollToAnalytics('section-comparison'), 0);
    }
  };

  const handleReset = () => {
    setPendingFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
    setShowCustomDates(false);
  };

  const updatePending = (key: keyof WellnessAnalyticsFilters, value: string) => {
    setPendingFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Clear dependent filters
      if (key === 'program') next.section = '';
      if (key === 'year_level') next.section = '';
      if (key === 'academic_year' && value) {
        next.date_range = 'all';
        next.start_date = '';
        next.end_date = '';
      }
      if (key === 'semester' && value !== 'all' && next.academic_year) {
        next.date_range = 'all';
        next.start_date = '';
        next.end_date = '';
      }
      if (key === 'date_range') {
        setShowCustomDates(value === 'custom');
        next.start_date = '';
        next.end_date = '';
        if (value !== 'all') {
          next.academic_year = '';
          next.semester = 'all';
        }
      }
      return next;
    });
  };

  const scrollToAnalytics = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ─ Chart data ─────────────────────────────────────────────────────────────
  const phq9DistData = screening?.phq9_distribution
    ? Object.entries(screening.phq9_distribution)
        .filter(([, v]) => v > 0)
        .map(([band, count]) => ({
          band: band.replace(/_/g, ' '),
          count,
          percentage: screening.sample_size > 0 ? (count / screening.sample_size) * 100 : 0,
          fill: PHQ9_SEVERITY_COLORS[band] ?? '#94a3b8',
        }))
    : [];

  const gad7DistData = screening?.gad7_distribution
    ? Object.entries(screening.gad7_distribution)
        .filter(([band, v]) => band !== 'moderately_severe' && v > 0)
        .map(([band, count]) => ({
          band: band.replace(/_/g, ' '),
          count,
          percentage: screening.sample_size > 0 ? (count / screening.sample_size) * 100 : 0,
          fill: GAD7_SEVERITY_COLORS[band] ?? '#94a3b8',
        }))
    : [];

  const programChartData = programGroups?.groups.filter((group) => !group.cohort_hidden).map((group) => {
    const phqPercent = toScorePercent(group.average_phq9, 27);
    const gadPercent = toScorePercent(group.average_gad7, 21);
    return {
      ...group,
      phq_percentage: phqPercent,
      gad_percentage: gadPercent,
      phq_label: phqPercent === null || group.average_phq9 === null ? '' : `${phqPercent.toFixed(0)}%|${group.average_phq9.toFixed(1).replace(/\.0$/, '')}/27`,
      gad_label: gadPercent === null || group.average_gad7 === null ? '' : `${gadPercent.toFixed(0)}%|${group.average_gad7.toFixed(1).replace(/\.0$/, '')}/21`,
    };
  }) ?? [];
  const yearChartData = yearGroups?.groups.filter((group) => !group.cohort_hidden).map((group) => {
    const phqPercent = toScorePercent(group.average_phq9, 27);
    const gadPercent = toScorePercent(group.average_gad7, 21);
    return {
      ...group,
      phq_percentage: phqPercent,
      gad_percentage: gadPercent,
      phq_label: phqPercent === null || group.average_phq9 === null ? '' : `${phqPercent.toFixed(0)}%|${group.average_phq9.toFixed(1).replace(/\.0$/, '')}/27`,
      gad_label: gadPercent === null || group.average_gad7 === null ? '' : `${gadPercent.toFixed(0)}%|${group.average_gad7.toFixed(1).replace(/\.0$/, '')}/21`,
    };
  }) ?? [];

  const trendData = trend?.trend.slice(-60) ?? [];

  // ─ Render ─────────────────────────────────────────────────────────────────
  const hasSection = !!(activeFilters.program && activeFilters.year_level);
  const showSectionComparison = hasSection && !!activeFilters.section;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Student Wellness Summary
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded border border-brand-100 dark:border-brand-800/60">
              Group totals only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            A view of student activity and screening results by group. No individual student details are shown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV export */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={isLoading || !overview || !!error}
              onClick={() => exportCsv(overview, screening, programGroups, yearGroups, activeFilters)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
              title="Export as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>CSV</span>
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              disabled={isLoading || !overview || !!error}
              onClick={() => downloadWellnessPdfReport({ generatedAt: new Date().toISOString(), overview, screening, programGroups, yearGroups, sectionGroups, trend, filters: activeFilters })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
              title="Export as styled PDF"
            >
              <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>PDF Report</span>
            </button>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => void loadAnalytics(activeFilters)}
            disabled={isLoading}
            className="inline-flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-600 dark:text-brand-400' : ''}`} />
          </button>

          <ThemeToggle variant="icon" className="p-2 rounded-lg" />
        </div>
      </div>

      {/* ── Current Scope Badge ── */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-medium">Viewing:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {scopeLabel(activeFilters)
            .split(' → ')
            .map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/50 rounded-full text-[11px] font-semibold">
                  {part}
                </span>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400" />}
              </span>
            ))}
        </div>
        {activeFilters.academic_year && (
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[11px]">
            {activeFilters.academic_year}
            {activeFilters.semester !== 'all' ? ` · ${activeFilters.semester} Sem` : ''}
          </span>
        )}
      </div>

      {/* ── Filter Panel ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Academic Year */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Academic Year</label>
            <select
              value={pendingFilters.academic_year}
              onChange={(e) => updatePending('academic_year', e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Years</option>
              {filterOptions.academic_years.map((ay) => (
                <option key={ay} value={ay}>{ay}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Semester</label>
            <select
              value={pendingFilters.semester}
              onChange={(e) => updatePending('semester', e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {SEMESTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Program */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Program</label>
            <select
              value={pendingFilters.program}
              onChange={(e) => updatePending('program', e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Programs</option>
              {filterOptions.programs.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Year Level */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Year Level</label>
            <select
              value={pendingFilters.year_level}
              onChange={(e) => updatePending('year_level', e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Years</option>
              {[...new Set([...YEAR_LEVELS, ...filterOptions.year_levels])].map((y) => <option key={y} value={y}>{yearLevelLabel(y)}</option>)}
            </select>
          </div>

          {/* Period: use either academic year/semester or calendar dates. */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Recent period</label>
            <select
              value={pendingFilters.date_range}
              onChange={(e) => updatePending('date_range', e.target.value)}
              disabled={!!pendingFilters.academic_year}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {DATE_RANGES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {pendingFilters.program && pendingFilters.year_level && <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Section</label>
            <select
              value={pendingFilters.section}
              onChange={(e) => updatePending('section', e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Sections</option>
              {filterOptions.sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>}
        </div>

        {/* Custom date inputs */}
        {showCustomDates && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Start Date</label>
              <input
                type="date"
                value={pendingFilters.start_date}
                onChange={(e) => updatePending('start_date', e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">End Date</label>
              <input
                type="date"
                value={pendingFilters.end_date}
                onChange={(e) => updatePending('end_date', e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="px-4 py-1.5 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadAnalytics(activeFilters)}
            className="font-semibold underline hover:no-underline text-red-800 dark:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Overview KPI Strip ── */}
      <div>
        <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Overview
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : overview && overview.total_students === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
            No analytics available for the selected filters and date range.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Total Students"
              value={overview?.total_students ?? '—'}
              sub="Students in this reporting scope"
              icon={<Users className="w-4 h-4" />}
              accent="text-brand-600 dark:text-brand-400"
            />
            <KpiCard
              label="Screenings"
              value={overview?.assessment_count ?? '—'}
              sub={`${formatRate(overview?.assessment_participation_rate ?? null)} of students · screening mix below`}
              icon={<ClipboardList className="w-4 h-4" />}
              accent="text-emerald-600 dark:text-emerald-400"
              onClick={() => scrollToAnalytics('screening-distribution')}
              actionLabel="View screening results"
            />
            <KpiCard
              label="Check-ins"
              value={overview?.checkin_count ?? '—'}
              sub={`${formatRate(overview?.checkin_participation_rate ?? null)} of students recorded a check-in`}
              icon={<Heart className="w-4 h-4" />}
              accent="text-rose-500 dark:text-rose-400"
              onClick={() => scrollToAnalytics('wellness-trends')}
              actionLabel="Review activity trend"
            />
            <KpiCard
              label="Journal Entries"
              value={overview?.journal_count ?? '—'}
              sub={`${formatRate(overview?.journal_participation_rate ?? null)} of students wrote an entry`}
              icon={<BookMarked className="w-4 h-4" />}
              accent="text-brand-600 dark:text-brand-400"
              onClick={() => scrollToAnalytics('wellness-trends')}
              actionLabel="Review activity trend"
            />
            <KpiCard
              label="Follow-up Needed"
              value={overview?.follow_up_flags ?? '—'}
              sub="Group total; follow your campus support process"
              icon={<AlertTriangle className="w-4 h-4" />}
              accent="text-amber-500 dark:text-amber-400"
            />
          </div>
        )}
      </div>

      {/* ── Screening Score Overview ── */}
      <div id="screening-distribution" className="scroll-mt-6">
        <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Screening Score Overview
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : screening?.cohort_hidden ? (
          <CohortHiddenBanner minSize={overview?.min_cohort_size ?? 5} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PHQ-9 Average */}
            <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Average PHQ-9 Score
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Average score across completed screenings; not a diagnosis
                  </p>
                </div>
              </div>
              <div className="text-4xl font-black text-brand-600 dark:text-brand-400 mb-1">
                {formatAvg(screening?.average_phq9 ?? null)}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                {screening?.sample_size ?? 0} completed screenings · bars show the share and number in each score range
              </div>

              {phq9DistData.length > 0 && (
                <div className="mt-4 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phq9DistData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid stroke="#334155" opacity={0.15} vertical={false} />
                      <XAxis dataKey="band" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}%`} />
                      <Tooltip
                        content={<ReadableChartTooltip />}
                      />
                      <Bar dataKey="percentage" name="Students (% of completed assessments)" radius={[4, 4, 0, 0]}>
                        {phq9DistData.map((entry, index) => (
                          <rect key={index} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="percentage" content={DistributionBarLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* GAD-7 Average */}
            <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Average GAD-7 Score
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Average score across completed screenings; not a diagnosis
                  </p>
                </div>
              </div>
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                {formatAvg(screening?.average_gad7 ?? null)}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                {screening?.sample_size ?? 0} completed screenings · bars show the share and number in each score range
              </div>

              {gad7DistData.length > 0 && (
                <div className="mt-4 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gad7DistData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid stroke="#334155" opacity={0.15} vertical={false} />
                      <XAxis dataKey="band" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}%`} />
                      <Tooltip
                        content={<ReadableChartTooltip />}
                      />
                      <Bar dataKey="percentage" name="Students (% of completed assessments)" radius={[4, 4, 0, 0]}>
                        {gad7DistData.map((entry, index) => (
                          <rect key={index} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="percentage" content={DistributionBarLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* ── Metrics by Group ── */}
      <div id="group-comparisons" className="scroll-mt-6">
        <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Compare Student Groups
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Program */}
          <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Average Screening Scores by Program
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Bars show each group’s average as a share of the highest possible score, with the score shown inside. These results do not rank programs.
            </p>
            {isLoading ? (
              <SkeletonChart />
            ) : !programGroups || programGroups.groups.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No program data available.
              </div>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={programChartData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#334155" opacity={0.15} vertical={false} />
                      <XAxis dataKey="group_name" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}%`} />
                      <Tooltip
                        content={<ReadableChartTooltip />}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="phq_percentage" name="PHQ-9 average" fill="#306c64" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="phq_label" content={ScoreBarLabel} />
                      </Bar>
                      <Bar dataKey="gad_percentage" name="GAD-7 average" fill="#10b981" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="gad_label" content={ScoreBarLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-2 text-left font-semibold">Program</th>
                        <th className="py-2 text-right font-semibold">Students</th>
                        <th className="py-2 text-right font-semibold">Assessments</th>
                        <th className="py-2 text-right font-semibold">PHQ-9 avg. /27</th>
                        <th className="py-2 text-right font-semibold">GAD-7 avg. /21</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {programGroups.groups.map((g) => (
                        <tr key={g.group_name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{g.group_name}</td>
                          <td className="py-2 text-right text-slate-600 dark:text-slate-400">{g.student_count}</td>
                          <td className="py-2 text-right text-slate-600 dark:text-slate-400">{g.assessment_count}</td>
                          <td className="py-2 text-right font-mono">{g.cohort_hidden ? <span className="text-amber-500 text-[10px]">Private</span> : formatAvg(g.average_phq9)}</td>
                          <td className="py-2 text-right font-mono">{g.cohort_hidden ? <span className="text-amber-500 text-[10px]">Private</span> : formatAvg(g.average_gad7)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {programGroups.groups.some((g) => g.cohort_hidden) && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
                      * Group has fewer than {overview?.min_cohort_size ?? 5} students — scores withheld for privacy.
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>

          {/* By Year Level */}
          <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Average Screening Scores by Year Level
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Bars show each group’s average as a share of the highest possible score, with the score shown inside. These results do not rank year levels.
            </p>
            {isLoading ? (
              <SkeletonChart />
            ) : !yearGroups || yearGroups.groups.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No year-level data available.
              </div>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={yearChartData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#334155" opacity={0.15} vertical={false} />
                      <XAxis dataKey="group_name" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}%`} />
                      <Tooltip
                        content={<ReadableChartTooltip />}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="phq_percentage" name="PHQ-9 average" fill="#306c64" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="phq_label" content={ScoreBarLabel} />
                      </Bar>
                      <Bar dataKey="gad_percentage" name="GAD-7 average" fill="#10b981" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="gad_label" content={ScoreBarLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-2 text-left font-semibold">Year Level</th>
                        <th className="py-2 text-right font-semibold">Students</th>
                        <th className="py-2 text-right font-semibold">PHQ-9 avg. (out of 27)</th>
                        <th className="py-2 text-right font-semibold">GAD-7 avg. (out of 21)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {yearGroups.groups.map((g) => (
                        <tr key={g.group_name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{g.group_name}</td>
                          <td className="py-2 text-right text-slate-600 dark:text-slate-400">{g.student_count}</td>
                          <td className="py-2 text-right font-mono">{g.cohort_hidden ? <span className="text-amber-500 text-[10px]">Private</span> : formatAvg(g.average_phq9)}</td>
                          <td className="py-2 text-right font-mono">{g.cohort_hidden ? <span className="text-amber-500 text-[10px]">Private</span> : formatAvg(g.average_gad7)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* By Section — only shown when program + year are selected */}
        {showSectionComparison && (
          <Card id="section-comparison" className="mt-4 scroll-mt-6 p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Average Screening Scores by Section
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Section comparison for {activeFilters.program} · {activeFilters.year_level}
            </p>
            {isLoading ? (
              <SkeletonChart />
            ) : !sectionGroups || sectionGroups.groups.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-xs text-slate-400">
                No section data available for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-2 text-left font-semibold">Section</th>
                      <th className="py-2 text-right font-semibold">Students</th>
                      <th className="py-2 text-right font-semibold">Assessments</th>
                      <th className="py-2 text-right font-semibold">Avg PHQ-9</th>
                      <th className="py-2 text-right font-semibold">Avg GAD-7</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {sectionGroups.groups.map((g) => (
                      <tr key={g.group_name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{g.group_name}</td>
                        <td className="py-2 text-right text-slate-600 dark:text-slate-400">{g.student_count}</td>
                        <td className="py-2 text-right text-slate-600 dark:text-slate-400">{g.assessment_count}</td>
                        <td className="py-2 text-right font-mono">{g.cohort_hidden ? <span className="text-amber-500 text-[10px]">Private</span> : formatAvg(g.average_phq9)}</td>
                        <td className="py-2 text-right font-mono">{g.cohort_hidden ? <span className="text-amber-500 text-[10px]">Private</span> : formatAvg(g.average_gad7)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sectionGroups.groups.some((g) => g.cohort_hidden) && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
                    * Group has fewer than {overview?.min_cohort_size ?? 5} students — scores withheld for privacy.
                  </p>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ── Historical Trends ── */}
      <div id="wellness-trends" className="scroll-mt-6">
        <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Wellness Trends
        </h2>
        <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Average Screening Scores Over Time
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
            Observed data only — no predictive forecasting.
          </p>
          {isLoading ? (
            <SkeletonChart />
          ) : trendData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No trend data available for the selected date range.
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#334155" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={true}
                  />
                  <Tooltip
                    content={<ReadableChartTooltip />}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="average_phq9"
                    name="Avg PHQ-9"
                    stroke="#306c64"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="average_gad7"
                    name="Avg GAD-7"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ── Results and Privacy ── */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-800 dark:text-white">About these results: </span>
          These group summaries are not diagnoses and do not describe any one student’s mental health. Student names, IDs, scores, journal
          contents, and wellness records are never displayed on this page. Groups with fewer than{' '}
          {overview?.min_cohort_size ?? 5} students have their wellness averages withheld to protect student
          privacy. Use these results to understand participation and plan general campus support, not to assess an individual student.
        </div>
      </div>
    </div>
  );
};
