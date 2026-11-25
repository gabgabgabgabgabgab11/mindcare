import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Archive,
  Eye,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  listAdminPosts,
  listGroupedReports,
  moderateMantraPost,
  bulkModerateMantraPosts,
} from '../services/adminApi';
import { adminCache } from '../services/adminCache';
import type { AdminGroupedReportItem, MantraWallPost, ModerationStatus } from '../types';

type TabId = 'review' | 'reported' | 'archived' | 'all';

export const AdminModeration = () => {
  // Review queue (posts with status 'review')
  const [reviewPosts, setReviewPosts] = useState<MantraWallPost[]>([]);
  // Grouped reports
  const [groupedReports, setGroupedReports] = useState<AdminGroupedReportItem[]>([]);
  // Archived posts
  const [archivedPosts, setArchivedPosts] = useState<MantraWallPost[]>([]);
  // All posts (for 'All' tab)
  const [allPosts, setAllPosts] = useState<MantraWallPost[]>([]);

  const [activeTab, setActiveTab] = useState<TabId>('review');
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [allStatusFilter, setAllStatusFilter] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reviewRes, reportsRes, archivedRes, allRes] = await Promise.all([
        listAdminPosts('review'),
        listGroupedReports(false, 'reports_count'),
        listAdminPosts('archived'),
        listAdminPosts(),
      ]);
      setReviewPosts(reviewRes);
      setGroupedReports(reportsRes);
      setArchivedPosts(archivedRes);
      setAllPosts(allRes);
      adminCache.reports = null; // invalidate old cache
    } catch {
      setError('Moderation data could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Actions ----

  const handleModerate = async (postId: string, newStatus: ModerationStatus) => {
    setProcessingIds((p) => new Set(p).add(postId));
    setError(null);
    setSuccess(null);
    try {
      await moderateMantraPost(postId, newStatus);
      setSuccess(`Post set to "${newStatus}".`);
      setTimeout(() => setSuccess(null), 3000);
      void loadData();
    } catch {
      setError('Failed to update post status.');
    } finally {
      setProcessingIds((p) => {
        const next = new Set(p);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleBulkModerate = async (newStatus: ModerationStatus) => {
    if (selectedIds.size === 0) return;
    setError(null);
    setSuccess(null);
    try {
      await bulkModerateMantraPosts(Array.from(selectedIds), newStatus);
      setSuccess(`${selectedIds.size} post(s) set to "${newStatus}".`);
      setSelectedIds(new Set());
      setTimeout(() => setSuccess(null), 3000);
      void loadData();
    } catch {
      setError('Bulk action failed.');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  };

  // ---- Tab counts ----

  const counts: Record<TabId, number> = {
    review: reviewPosts.length,
    reported: groupedReports.length,
    archived: archivedPosts.length,
    all: allPosts.length,
  };

  const tabConfig: { id: TabId; label: string; color: string }[] = [
    { id: 'review', label: 'Review Queue', color: 'amber' },
    { id: 'reported', label: 'Reported', color: 'rose' },
    { id: 'archived', label: 'Archived', color: 'slate' },
    { id: 'all', label: 'All Posts', color: 'brand' },
  ];

  // Filter all-posts by status
  const filteredAllPosts = allStatusFilter
    ? allPosts.filter((p) => p.moderation_status === allStatusFilter)
    : allPosts;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mantra Wall Moderation</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 rounded">
              Auto-Filter Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Posts are automatically filtered by NLP. Review flagged posts, reported content, and archived items.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => void loadData()}
          isLoading={isLoading}
          className="flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => void loadData()} className="font-semibold underline hover:no-underline text-red-800">
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 border border-slate-200 shadow-none bg-white animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-28 mb-3" />
              <div className="h-14 bg-slate-100 rounded-lg" />
            </Card>
          ))}
        </div>
      )}

      {/* ============ REVIEW QUEUE TAB ============ */}
      {!isLoading && activeTab === 'review' && (
        <div className="flex flex-col gap-3">
          {/* Bulk action bar */}
          {reviewPosts.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => selectAll(reviewPosts.map((p) => p.id))}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                {reviewPosts.every((p) => selectedIds.has(p.id)) ? 'Deselect All' : 'Select All'}
              </button>
              {selectedIds.size > 0 && (
                <>
                  <span className="text-xs text-slate-400">|</span>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => void handleBulkModerate('approved')}
                    className="text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700 border-none"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Approve ({selectedIds.size})
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleBulkModerate('rejected')}
                    className="text-xs py-1 px-3 text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject ({selectedIds.size})
                  </Button>
                </>
              )}
            </div>
          )}

          {reviewPosts.length === 0 ? (
            <Card className="py-16 text-center border-dashed border-slate-300 bg-white">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-900 text-sm">Review queue is clear</p>
              <p className="mt-1 text-xs text-slate-500">
                No posts need manual review right now. The auto-filter is handling the rest.
              </p>
            </Card>
          ) : (
            reviewPosts.map((post) => (
              <Card
                key={post.id}
                className={`p-5 border shadow-none transition-all ${
                  selectedIds.has(post.id) ? 'border-brand-400 bg-brand-50/30' : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="mt-1 w-4 h-4 accent-brand-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                            Review
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium capitalize">
                            {post.post_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(post.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs font-medium text-slate-800 leading-relaxed mt-2">
                        "{post.content}"
                      </div>

                      {post.filter_reason && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Search className="w-3 h-3" />
                          <span className="italic">{post.filter_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="secondary"
                      isLoading={processingIds.has(post.id)}
                      disabled={processingIds.has(post.id)}
                      onClick={() => void handleModerate(post.id, 'rejected')}
                      className="flex items-center gap-1 py-1.5 px-3 text-xs text-rose-700 border border-rose-200 bg-white hover:bg-rose-50"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      isLoading={processingIds.has(post.id)}
                      disabled={processingIds.has(post.id)}
                      onClick={() => void handleModerate(post.id, 'approved')}
                      className="flex items-center gap-1 py-1.5 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 border-none"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ============ REPORTED TAB ============ */}
      {!isLoading && activeTab === 'reported' && (
        <div className="flex flex-col gap-3">
          {/* Bulk action bar */}
          {groupedReports.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => selectAll(groupedReports.map((r) => r.post_id))}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                {groupedReports.every((r) => selectedIds.has(r.post_id)) ? 'Deselect All' : 'Select All'}
              </button>
              {selectedIds.size > 0 && (
                <>
                  <span className="text-xs text-slate-400">|</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleBulkModerate('approved')}
                    className="text-xs py-1 px-3 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Keep ({selectedIds.size})
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleBulkModerate('archived')}
                    className="text-xs py-1 px-3 text-slate-700 border-slate-300 hover:bg-slate-50"
                  >
                    <Archive className="w-3.5 h-3.5 mr-1" />
                    Archive ({selectedIds.size})
                  </Button>
                </>
              )}
            </div>
          )}

          {groupedReports.length === 0 ? (
            <Card className="py-16 text-center border-dashed border-slate-300 bg-white">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-900 text-sm">No reported posts</p>
              <p className="mt-1 text-xs text-slate-500">All reports have been resolved.</p>
            </Card>
          ) : (
            groupedReports.map((report) => {
              const isExpanded = expandedReportId === report.post_id;
              return (
                <Card
                  key={report.post_id}
                  className={`p-5 border shadow-none transition-all ${
                    selectedIds.has(report.post_id)
                      ? 'border-brand-400 bg-brand-50/30'
                      : 'border-rose-200 bg-rose-50/10'
                  }`}
                >
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(report.post_id)}
                        onChange={() => toggleSelect(report.post_id)}
                        className="mt-1 w-4 h-4 accent-brand-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                report.post_moderation_status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {report.post_moderation_status}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium capitalize">
                              {report.post_type}
                            </span>
                            <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-bold border border-rose-200">
                              <ShieldAlert className="w-3 h-3" />
                              {report.report_count} report{report.report_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(report.latest_report_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs font-medium text-slate-800 leading-relaxed mt-2">
                          "{report.post_content}"
                        </div>

                        {/* Expandable report reasons */}
                        {report.reasons.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedReportId(isExpanded ? null : report.post_id)}
                            className="mt-2 flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-medium"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isExpanded ? 'Hide reasons' : `View ${report.reasons.length} reason(s)`}
                          </button>
                        )}
                        {isExpanded && report.reasons.length > 0 && (
                          <div className="mt-2 pl-4 border-l-2 border-rose-200 space-y-1">
                            {report.reasons.map((reason, i) => (
                              <p key={i} className="text-[11px] text-rose-700">
                                • {reason}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="secondary"
                        isLoading={processingIds.has(report.post_id)}
                        disabled={processingIds.has(report.post_id)}
                        onClick={() => void handleModerate(report.post_id, 'archived')}
                        className="flex items-center gap-1 py-1.5 px-3 text-xs text-slate-700 border border-slate-300 bg-white hover:bg-slate-50"
                      >
                        <Archive className="w-3.5 h-3.5 text-slate-500" />
                        Archive
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        isLoading={processingIds.has(report.post_id)}
                        disabled={processingIds.has(report.post_id)}
                        onClick={() => void handleModerate(report.post_id, 'approved')}
                        className="flex items-center gap-1 py-1.5 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 border-none"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        Keep Visible
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ============ ARCHIVED TAB ============ */}
      {!isLoading && activeTab === 'archived' && (
        <div className="flex flex-col gap-3">
          {archivedPosts.length === 0 ? (
            <Card className="py-16 text-center border-dashed border-slate-300 bg-white">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 mx-auto mb-3 flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-900 text-sm">No archived posts</p>
              <p className="mt-1 text-xs text-slate-500">Posts that were hidden after report review will appear here.</p>
            </Card>
          ) : (
            archivedPosts.map((post) => (
              <Card key={post.id} className="p-5 border border-slate-200 bg-slate-50/60 shadow-none opacity-80">
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                        Archived
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium capitalize">
                        {post.post_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(post.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-white/50 p-4 text-xs font-medium text-slate-600 leading-relaxed">
                    "{post.content}"
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="primary"
                      isLoading={processingIds.has(post.id)}
                      disabled={processingIds.has(post.id)}
                      onClick={() => void handleModerate(post.id, 'approved')}
                      className="flex items-center gap-1 py-1.5 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 border-none"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      Restore to Wall
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ============ ALL POSTS TAB ============ */}
      {!isLoading && activeTab === 'all' && (
        <div className="flex flex-col gap-3">
          {/* Status filter dropdown */}
          <div className="flex items-center gap-2 pb-2">
            <label className="text-xs font-medium text-slate-500">Filter by status:</label>
            <select
              value={allStatusFilter}
              onChange={(e) => setAllStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">All statuses</option>
              <option value="approved">Approved</option>
              <option value="review">Review</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
              <option value="pending">Pending (legacy)</option>
              <option value="flagged">Flagged (legacy)</option>
            </select>
            <span className="text-xs text-slate-400">{filteredAllPosts.length} post(s)</span>
          </div>

          {filteredAllPosts.length === 0 ? (
            <Card className="py-16 text-center border-dashed border-slate-300 bg-white">
              <p className="font-semibold text-slate-900 text-sm">No posts found</p>
              <p className="mt-1 text-xs text-slate-500">
                {allStatusFilter ? `No posts with status "${allStatusFilter}".` : 'No posts on the Mantra Wall yet.'}
              </p>
            </Card>
          ) : (
            filteredAllPosts.map((post) => (
              <Card key={post.id} className="p-5 border border-slate-200 shadow-none bg-white">
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          post.moderation_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : post.moderation_status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : post.moderation_status === 'review'
                            ? 'bg-amber-100 text-amber-800'
                            : post.moderation_status === 'archived'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {post.moderation_status}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium capitalize">
                        {post.post_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(post.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs font-medium text-slate-800 leading-relaxed">
                    "{post.content}"
                  </div>

                  {post.filter_reason && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Search className="w-3 h-3" />
                      <span className="italic">{post.filter_reason}</span>
                    </div>
                  )}
                  {post.moderation_status === 'rejected' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500">Reviewed this post? Approving it will publish it to the student wall.</p>
                      <Button type="button" disabled={processingIds.has(post.id)} isLoading={processingIds.has(post.id)} onClick={() => void handleModerate(post.id, 'approved')} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />Approve rejected post
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
