import { useEffect, useState } from 'react';
import {
  Filter,
  Search,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  FileCode,
  User,
} from 'lucide-react';
import { Button } from '../components/Button';
import { listAuditLogs } from '../services/adminApi';
import { adminCache } from '../services/adminCache';
import type { AuditLog } from '../types';

const KNOWN_EVENT_TYPES = [
  { value: '', label: 'All Event Types' },
  { value: 'admin_action', label: 'Admin Action' },
  { value: 'mantra_wall_moderation', label: 'Mantra Moderation' },
  { value: 'privacy_setting_changed', label: 'Privacy Changed' },
  { value: 'assessment_submission', label: 'Assessment Submission' },
  { value: 'journal_created', label: 'Journal Created' },
  { value: 'journal_deleted', label: 'Journal Deleted' },
  { value: 'login', label: 'Login' },
  { value: 'failed_authentication', label: 'Failed Authentication' },
];

export const AuditLogs = () => {
  const defaultKey = `__100`;
  const initialCached = adminCache.auditLogs && adminCache.auditLogs.key === defaultKey ? adminCache.auditLogs.logs : [];
  const [logs, setLogs] = useState<AuditLog[]>(initialCached);
  const [eventType, setEventType] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [limit, setLimit] = useState(100);
  const [isLoading, setIsLoading] = useState(!adminCache.auditLogs || adminCache.auditLogs.key !== defaultKey);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAuditLogs({
        eventType: eventType || undefined,
        actorId: actorFilter.trim() || undefined,
        limit,
      });
      const cacheKey = `${eventType}_${actorFilter.trim()}_${limit}`;
      adminCache.auditLogs = { logs: data, key: cacheKey };
      setLogs(data);
    } catch {
      setError('Audit logs could not be loaded. Please check server status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const cacheKey = `${eventType}_${actorFilter.trim()}_${limit}`;
    if (adminCache.auditLogs && adminCache.auditLogs.key === cacheKey) {
      return;
    }

    let active = true;
    listAuditLogs({
      eventType: eventType || undefined,
      actorId: actorFilter.trim() || undefined,
      limit,
    })
      .then((data) => {
        if (!active) return;
        adminCache.auditLogs = { logs: data, key: cacheKey };
        setLogs(data);
      })
      .catch(() => {
        if (!active) return;
        setError('Audit logs could not be loaded. Please check server status.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [eventType, actorFilter, limit]);

  const handleActorSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadLogs();
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'failed_authentication':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'admin_action':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'mantra_wall_moderation':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'assessment_submission':
        return 'bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 border-brand-200 dark:border-brand-800';
      case 'privacy_setting_changed':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'journal_created':
      case 'journal_deleted':
        return 'bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 border-brand-200 dark:border-brand-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Compute breakdown of current events
  const countsByType: Record<string, number> = {};
  for (const log of logs) {
    countsByType[log.event_type] = (countsByType[log.event_type] || 0) + 1;
  }

  return (
    <div className="admin-page flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">System Audit Logs</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-300" /> Immutable Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographically sealed operational audit events. Records are strictly read-only and retention-governed.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => void loadLogs()}
          isLoading={isLoading}
          className="flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-300 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs()}
            className="font-semibold underline hover:no-underline text-red-800 dark:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            <span className="font-semibold">Filter:</span>
          </div>

          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {KNOWN_EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <form onSubmit={handleActorSearch} className="relative">
            <input
              type="text"
              placeholder="Actor UUID..."
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 w-48"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Show:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value={25}>25 entries</option>
            <option value={50}>50 entries</option>
            <option value={100}>100 entries</option>
            <option value={200}>200 entries</option>
          </select>
        </div>
      </div>

      {/* Summary Distribution Strip */}
      {logs.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">Breakdown:</span>
          {Object.entries(countsByType).map(([type, count]) => (
            <span
              key={type}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getEventBadgeColor(type)}`}
            >
              {type.replace(/_/g, ' ')}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-400 font-sans">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-400 font-sans">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                          <span>{new Date(log.created_at).toISOString().replace('T', ' ').slice(0, 19)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getEventBadgeColor(
                            log.event_type
                          )}`}
                        >
                          {log.event_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                          <span>{log.actor_id ? `${log.actor_id.slice(0, 8)}...` : 'system'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-800 dark:text-slate-100 text-xs max-w-md">
                        <div>{log.description}</div>
                        {isExpanded && log.event_metadata && (
                          <div className="mt-2 p-2 bg-slate-900 text-slate-100 dark:text-slate-400 rounded text-[10px] font-mono overflow-x-auto">
                            <pre>{JSON.stringify(JSON.parse(log.event_metadata), null, 2)}</pre>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.event_metadata ? (
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-brand-600 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300"
                          >
                            <FileCode className="w-3 h-3" />
                            {isExpanded ? 'Hide' : 'Metadata'}
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-400 font-sans text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};