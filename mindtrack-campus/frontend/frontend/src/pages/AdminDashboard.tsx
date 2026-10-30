import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  BookOpen,
  ScrollText,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Info,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '../components/Card';
import { ThemeToggle } from '../components/ThemeToggle';
import { downloadCsvReport, downloadPdfReport, type OverviewReportData } from '../utils/exportReport';
import { adminCache } from '../services/adminCache';
import {
  getAuditTimeline,
  getModerationTimeline,
  getOverviewKPIs,
  listAuditLogs,
  listModerationReports,
} from '../services/adminApi';
import type {
  AdminMantraWallReportItem,
  AuditLog,
  AuditTimelineEntry,
  ModerationTimelineEntry,
  OverviewKPIs,
} from '../types';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<OverviewKPIs | null>(adminCache.overview?.kpis ?? null);
  const [auditTimeline, setAuditTimeline] = useState<AuditTimelineEntry[]>(adminCache.overview?.auditTimeline ?? []);
  const [moderationTimeline, setModerationTimeline] = useState<ModerationTimelineEntry[]>(
    adminCache.overview?.moderationTimeline ?? []
  );
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>(adminCache.overview?.recentLogs ?? []);
  const [recentReports, setRecentReports] = useState<AdminMantraWallReportItem[]>(
    adminCache.overview?.recentReports ?? []
  );
  const [isLoading, setIsLoading] = useState(!adminCache.overview);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(
    adminCache.overview?.lastRefreshed ?? new Date()
  );

  const handleDownload = (format: 'csv' | 'pdf') => {
    if (!kpis) return;
    const data: OverviewReportData = {
      generatedAt: new Date().toISOString(),
      kpis: {
        'Pending Moderation': kpis.pending_moderation_count,
        'Approved Posts': kpis.approved_posts_count,
        'Active Resources': kpis.active_resources_count,
        'Audit Events (7d)': kpis.audit_events_7d_count,
        'Open Reports': kpis.unresolved_reports_count,
      },
      auditTimeline: auditTimeline.map((item) => ({
        date: item.date,
        count: item.count,
        type: Object.keys(item.by_type || {}).join('; ') || 'system',
      })),
      moderationTimeline: moderationTimeline.map((item) => ({
        date: item.date,
        pending: item.pending,
        approved: item.approved,
        rejected: item.rejected,
      })),
      resourceSummary: [
        {
          category: 'Campus Support Resources',
          active: kpis.active_resources_count,
          inactive: 0,
        },
      ],
    };

    if (format === 'csv') {
      downloadCsvReport(data);
    } else {
      downloadPdfReport(data);
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [kpiRes, auditRes, modRes, logsRes, reportsRes] = await Promise.all([
        getOverviewKPIs(),
        getAuditTimeline(30),
        getModerationTimeline(30),
        listAuditLogs({ limit: 10 }),
        listModerationReports(),
      ]);

      const now = new Date();
      adminCache.overview = {
        kpis: kpiRes,
        auditTimeline: auditRes.timeline || [],
        moderationTimeline: modRes.timeline || [],
        recentLogs: logsRes || [],
        recentReports: reportsRes || [],
        lastRefreshed: now,
      };

      setKpis(kpiRes);
      setAuditTimeline(auditRes.timeline || []);
      setModerationTimeline(modRes.timeline || []);
      setRecentLogs(logsRes || []);
      setRecentReports(reportsRes || []);
      setLastRefreshed(now);
    } catch {
      setError('Operational analytics could not be loaded. Please check service connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If data was already fetched in this session, do not re-fetch when navigating between tabs
    if (adminCache.overview) {
      return;
    }

    let active = true;
    Promise.all([
      getOverviewKPIs(),
      getAuditTimeline(30),
      getModerationTimeline(30),
      listAuditLogs({ limit: 10 }),
      listModerationReports(),
    ])
      .then(([kpiRes, auditRes, modRes, logsRes, reportsRes]) => {
        if (!active) return;
        const now = new Date();
        adminCache.overview = {
          kpis: kpiRes,
          auditTimeline: auditRes.timeline || [],
          moderationTimeline: modRes.timeline || [],
          recentLogs: logsRes || [],
          recentReports: reportsRes || [],
          lastRefreshed: now,
        };
        setKpis(kpiRes);
        setAuditTimeline(auditRes.timeline || []);
        setModerationTimeline(modRes.timeline || []);
        setRecentLogs(logsRes || []);
        setRecentReports(reportsRes || []);
        setLastRefreshed(now);
      })
      .catch(() => {
        if (!active) return;
        setError('Operational analytics could not be loaded. Please check service connectivity.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Compute distribution of audit events by type across timeline
  const auditTypeData = (() => {
    const counts: Record<string, number> = {};
    for (const entry of auditTimeline) {
      if (entry.by_type) {
        for (const [type, cnt] of Object.entries(entry.by_type)) {
          counts[type] = (counts[type] || 0) + cnt;
        }
      }
    }
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, ' '),
      count,
    }));
  })();

  // Format Mantra post type distribution
  const postTypeData = kpis?.mantra_post_type_distribution
    ? Object.entries(kpis.mantra_post_type_distribution).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
      }))
    : [
        { type: 'Affirmation', count: 0 },
        { type: 'Gratitude', count: 0 },
        { type: 'Win', count: 0 },
      ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Operations Overview</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded border border-brand-100 dark:border-brand-800/60">
              Live Console
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time aggregate platform metrics and activity feeds. Last refreshed at{' '}
            {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Download Control */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={isLoading || !kpis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
              title="Export report in CSV format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>CSV</span>
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={isLoading || !kpis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
              title="Export report in styled PDF format"
            >
              <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>PDF Report</span>
            </button>
          </div>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={isLoading}
            className="inline-flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Refresh dashboard data"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-600 dark:text-brand-400' : ''}`} />
          </button>

          {/* Theme Toggle (Dashboard Toolbar) */}
          <ThemeToggle variant="icon" className="p-2 rounded-lg" />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="font-semibold underline hover:no-underline text-red-800 dark:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Tiles Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Needs Review (renamed from Pending Moderation) */}
        <div
          onClick={() => navigate('/admin/moderation')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-colors shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Needs Review</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? '—' : kpis?.pending_moderation_count ?? 0}
          </div>
          <div className="mt-1 flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Auto-flagged for review <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        {/* 2. Approved Posts */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Approved Posts</span>
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? '—' : kpis?.approved_posts_count ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Live on Mantra Wall</div>
        </div>

        {/* 3. Active Resources */}
        <div
          onClick={() => navigate('/admin/resources')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 transition-colors shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Resources</span>
            <BookOpen className="w-4 h-4 text-brand-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? '—' : kpis?.active_resources_count ?? 0}
          </div>
          <div className="mt-1 flex items-center text-[10px] text-brand-600 dark:text-brand-400 font-medium">
            Campus resources <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        {/* 4. Audit Events (7d) */}
        <div
          onClick={() => navigate('/admin/audit-logs')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Audit Events (7d)</span>
            <ScrollText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? '—' : kpis?.audit_events_7d_count ?? 0}
          </div>
          <div className="mt-1 flex items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            System activity <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        {/* 5. Unresolved Reports */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Open Reports</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? '—' : kpis?.unresolved_reports_count ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">Pending post reports</div>
        </div>
      </div>

      {/* Analytics Charts (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Audit Event Volume (30 Days) */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Audit Event Volume (30 Days)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Aggregate daily security and access log counts</p>
            </div>
          </div>

          <div className="h-60 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
                Loading timeline...
              </div>
            ) : auditTimeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No audit event records available for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={auditTimeline} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(val: string) => val.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '6px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Total Events"
                    stroke="#306c64"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#306c64' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 2: Moderation Throughput Timeline */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Moderation Throughput (30 Days)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Daily breakdown: pending, approved, and rejected</p>
            </div>
          </div>

          <div className="h-60 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
                Loading throughput...
              </div>
            ) : moderationTimeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No moderation submissions recorded in the last 30 days.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moderationTimeline} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(val: string) => val.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '6px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={25}
                    wrapperStyle={{ fontSize: '10px' }}
                  />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" stackId="a" />
                  <Bar dataKey="review" name="Review" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="rejected" name="Rejected" fill="#ef4444" stackId="a" />
                  <Bar dataKey="archived" name="Archived" fill="#94a3b8" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 3: Mantra Wall Post Types */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Mantra Wall Distribution
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Approved posts categorized by publication type</p>
            </div>
          </div>

          <div className="h-60 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
                Loading post types...
              </div>
            ) : postTypeData.every((d) => d.count === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No approved posts on the Mantra Wall yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postTypeData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '6px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" name="Approved Posts" fill="#306c64" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 4: Audit Events by Type */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Events by Action Type
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Trailing 30-day aggregate event breakdown</p>
            </div>
          </div>

          <div className="h-60 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
                Loading event types...
              </div>
            ) : auditTypeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No typed events found in current audit window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={auditTypeData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid stroke="#334155" opacity={0.2} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="type"
                    type="category"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '6px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" name="Count" fill="#5ba399" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Wellness Aggregates Status Notice (Hard Constraints 1 & 6) */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-800 dark:text-white">Wellness Aggregates Status: </span>
          Per architectural guidelines (ADR-006) and clinical confidentiality guidelines, individual student wellness
          scores are never exposed or computed. Aggregate cohort reporting will activate once cohort consent and section
          data collection have been validated by institutional oversight.
        </div>
      </div>

      {/* Recent Activity Feed (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Audit Events */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Audit Trail (Latest 10)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/audit-logs')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-0.5"
            >
              All Logs <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading activity...</div>
            ) : recentLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No recent audit events recorded.</div>
            ) : (
              recentLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300">
                        {log.event_type}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{log.description}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Actor: {log.actor_id ? `${log.actor_id.slice(0, 8)}...` : 'System'}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Moderation Activity */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Reported Items
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/moderation')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-0.5"
            >
              Moderation Queue <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading reports...</div>
            ) : recentReports.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No moderation reports pending.</div>
            ) : (
              recentReports.slice(0, 5).map((report) => (
                <div key={report.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          report.post_moderation_status === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : report.post_moderation_status === 'rejected'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {report.post_moderation_status}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate font-medium italic">
                        "{report.post_content}"
                      </span>
                    </div>
                    {report.reason && (
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Report reason: {report.reason}</div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
