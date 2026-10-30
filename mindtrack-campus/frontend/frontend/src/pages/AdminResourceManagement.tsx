import { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '../components/Button';
import {
  createAdminResource,
  deleteAdminResource,
  listAdminResources,
  updateAdminResource,
} from '../services/adminApi';
import { adminCache } from '../services/adminCache';
import type { Resource, ResourceCreateRequest } from '../types';

const emptyForm: ResourceCreateRequest = {
  category: 'on-campus',
  title: '',
  description: '',
  url: '',
  is_active: true,
};

export const AdminResourceManagement = () => {
  const [resources, setResources] = useState<Resource[]>(adminCache.resources ?? []);
  const [form, setForm] = useState<ResourceCreateRequest>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!adminCache.resources);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAdminResources();
      adminCache.resources = data;
      setResources(data);
    } catch {
      setError('Resources could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip re-fetch on navigation if data is already cached
    if (adminCache.resources) return;

    let active = true;
    listAdminResources()
      .then((data) => {
        if (!active) return;
        adminCache.resources = data;
        setResources(data);
      })
      .catch(() => {
        if (!active) return;
        setError('Resources could not be loaded.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const startEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setForm({
      category: resource.category,
      title: resource.title,
      description: resource.description,
      url: resource.url ?? '',
      is_active: resource.is_active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: ResourceCreateRequest = {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        url: form.url?.trim() || null,
        is_active: form.is_active,
      };

      if (editingId) {
        const updated = await updateAdminResource(editingId, payload);
        setResources((prev) => {
          const next = prev.map((r) => (r.id === updated.id ? updated : r));
          adminCache.resources = next;
          return next;
        });
        setSuccess('Resource updated successfully.');
      } else {
        const created = await createAdminResource(payload);
        setResources((prev) => {
          const next = [created, ...prev];
          adminCache.resources = next;
          return next;
        });
        setSuccess('Resource published successfully.');
      }

      closeModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to save the resource. Please check inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (resource: Resource) => {
    try {
      const updated = await updateAdminResource(resource.id, {
        is_active: !resource.is_active,
      });
      setResources((prev) => {
        const next = prev.map((r) => (r.id === updated.id ? updated : r));
        adminCache.resources = next;
        return next;
      });
      setSuccess(`Resource set to ${updated.is_active ? 'Active' : 'Inactive'}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Could not change resource status.');
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (!window.confirm(`Permanently remove resource "${resource.title}"?`)) return;
    setError(null);
    try {
      await deleteAdminResource(resource.id);
      setResources((prev) => {
        const next = prev.filter((r) => r.id !== resource.id);
        adminCache.resources = next;
        return next;
      });
      setSuccess('Resource deleted.');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to delete the resource.');
    }
  };

  // Filtered resources
  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || res.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && res.is_active) ||
      (statusFilter === 'inactive' && !res.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // KPI calculations
  const totalCount = resources.length;
  const activeCount = resources.filter((r) => r.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const categories = Array.from(new Set(resources.map((r) => r.category)));

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Campus Resources</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 rounded">
              Support Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student-facing counseling, helpline, and university support resources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadResources()}
            isLoading={isLoading}
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={openCreate}
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 border-none"
          >
            <Plus className="w-4 h-4 text-white" />
            New Resource
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadResources()}
            className="font-semibold underline hover:no-underline text-red-800"
          >
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

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Resources</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Inactive</span>
          <div className="mt-1 text-2xl font-bold text-slate-400">{inactiveCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Categories</span>
          <div className="mt-1 text-2xl font-bold text-brand-600">{categories.length}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Link / Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading resources...
                  </td>
                </tr>
              ) : filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No resources match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => (
                  <tr
                    key={res.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !res.is_active ? 'bg-slate-50/40 text-slate-400' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900">{res.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {res.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-700">
                        {res.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {res.url ? (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 font-medium"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(res)}
                        className="inline-flex items-center gap-1.5 focus:outline-none"
                        title={res.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {res.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span className="text-[11px] font-semibold text-emerald-700">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(res)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Edit resource"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(res)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                          title="Delete resource"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {editingId ? 'Edit Resource' : 'Create New Resource'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Resource Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="on-campus">On-Campus Counseling & Guidance</option>
                  <option value="hotlines">Emergency Hotlines</option>
                  <option value="self-help">Self-Help & Educational</option>
                  <option value="external">External Health Services</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PUP Guidance and Counseling Office"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Office hours, location, services provided..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Resource URL or Contact Link</label>
                <input
                  type="url"
                  placeholder="https://... or tel:..."
                  value={form.url || ''}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="is_active" className="text-slate-700 font-medium cursor-pointer">
                  Publish as active immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  className="py-1.5 px-3 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  className="py-1.5 px-4 text-xs bg-slate-900 text-white hover:bg-slate-800 border-none"
                >
                  {editingId ? 'Update Resource' : 'Save & Publish'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
