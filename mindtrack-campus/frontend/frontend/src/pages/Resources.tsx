import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Globe2,
  HeartHandshake,
  LayoutGrid,
  Mail,
  MapPin,
  Pause,
  Phone,
  PhoneCall,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Wind,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../components/Card';
import { CompanionHeader } from '../components/CompanionHeader';
import { listResources } from '../services/studentApi';
import type { Resource } from '../types';

type ResourceCategory = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

const BASE_CATEGORIES: ResourceCategory[] = [
  { id: 'on-campus', label: 'On Campus', Icon: Building2 },
  { id: 'hotline', label: 'Hotline', Icon: PhoneCall },
  { id: 'self-help', label: 'Self Help', Icon: Wind },
  { id: 'external', label: 'External', Icon: Globe2 },
];

const CATEGORY_VISUALS: Record<string, { Icon: LucideIcon; icon: string; badge: string; action: string }> = {
  'on-campus': {
    Icon: Building2,
    icon: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    badge: 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
    action: 'bg-teal-50 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:hover:bg-teal-900/60',
  },
  hotline: {
    Icon: PhoneCall,
    icon: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    badge: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    action: 'bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-200 dark:hover:bg-rose-900/60',
  },
  'self-help': {
    Icon: Wind,
    icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    badge: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    action: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 dark:hover:bg-emerald-900/60',
  },
  external: {
    Icon: Globe2,
    icon: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    badge: 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    action: 'bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-200 dark:hover:bg-sky-900/60',
  },
  guides: {
    Icon: BookOpen,
    icon: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    badge: 'bg-violet-50 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
    action: 'bg-violet-50 text-violet-800 hover:bg-violet-100 dark:bg-violet-950/60 dark:text-violet-200 dark:hover:bg-violet-900/60',
  },
};

const DEFAULT_VISUAL = CATEGORY_VISUALS.guides;

function normalizeCategory(category: string): string {
  const normalized = category.trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (['on-campus', 'oncampus', 'campus'].includes(normalized)) return 'on-campus';
  if (['hotline', 'hotlines', 'emergency-hotline', 'emergency-hotlines'].includes(normalized)) return 'hotline';
  if (['self-help', 'self-help-and-educational', 'self-care', 'selfcare'].includes(normalized)) return 'self-help';
  if (['guide', 'guides'].includes(normalized)) return 'guides';
  return normalized || 'guides';
}

function labelForCategory(category: string): string {
  const known = [...BASE_CATEGORIES, { id: 'guides', label: 'Guides', Icon: BookOpen }].find((item) => item.id === category);
  return known?.label ?? category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeWebUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function isBreathingResource(resource: Resource): boolean {
  const category = normalizeCategory(resource.category);
  const text = `${resource.title} ${resource.description}`.toLowerCase();
  const mentionsBreathing = /breath|breathing|inhale|exhale/.test(text);
  const isSelfCareCategory = category === 'self-help' || category === 'guides';
  return isSelfCareCategory && (mentionsBreathing || (category === 'self-help' && resource.description.trim().length <= 36));
}

export const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    listResources()
      .then((data) => {
        if (isCurrent) {
          setResources(data);
          setError(null);
        }
      })
      .catch(() => {
        if (isCurrent) setError('Resources could not be loaded. Please try again in a moment.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const categories = useMemo(() => {
    const additional = [...new Set(resources.map((resource) => normalizeCategory(resource.category)))]
      .filter((category) => category !== 'all' && !BASE_CATEGORIES.some((known) => known.id === category) && category !== 'guides')
      .sort()
      .map((id) => ({ id, label: labelForCategory(id), Icon: BookOpen }));
    return [...BASE_CATEGORIES, ...(resources.some((resource) => normalizeCategory(resource.category) === 'guides') ? [{ id: 'guides', label: 'Guides', Icon: BookOpen }] : []), ...additional];
  }, [resources]);

  const searchFilteredResources = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return resources;
    return resources.filter((resource) =>
      `${resource.title} ${resource.description} ${labelForCategory(normalizeCategory(resource.category))}`
        .toLowerCase()
        .includes(search),
    );
  }, [query, resources]);

  const filteredResources = useMemo(
    () => activeCategory === 'all'
      ? searchFilteredResources
      : searchFilteredResources.filter((resource) => normalizeCategory(resource.category) === activeCategory),
    [activeCategory, searchFilteredResources],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: searchFilteredResources.length };
    for (const resource of searchFilteredResources) {
      const category = normalizeCategory(resource.category);
      counts[category] = (counts[category] ?? 0) + 1;
    }
    return counts;
  }, [searchFilteredResources]);

  const resetFilters = () => {
    setQuery('');
    setActiveCategory('all');
  };

  const copyContact = async (key: string, value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      setCopiedContact(key);
      window.setTimeout(() => setCopiedContact((current) => current === key ? null : current), 1800);
    } catch {
      setCopiedContact(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <CompanionHeader
        title="Wellness Resources"
        description="Support, self-care ideas, and campus resources for your well-being. Take what helps, at your own pace."
      />

      <Card data-tour="resources-search" className="rounded-3xl border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <label htmlFor="resource-search" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Find a resource
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <input
            id="resource-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources"
            aria-label="Search resources"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-slate-800"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Browse by category</p>
            <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
              {isLoading ? 'Loading resources...' : `${filteredResources.length} ${filteredResources.length === 1 ? 'resource' : 'resources'} found`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Resource categories">
            <CategoryFilter
              id="all"
              label="All"
              Icon={LayoutGrid}
              count={categoryCounts.all ?? 0}
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            />
            {categories.map(({ id, label, Icon }) => (
              <CategoryFilter
                key={id}
                id={id}
                label={label}
                Icon={Icon}
                count={categoryCounts[id] ?? 0}
                active={activeCategory === id}
                onClick={() => setActiveCategory(id)}
              />
            ))}
          </div>
        </div>
      </Card>

      <QuickSupportStrip copiedContact={copiedContact} onCopy={copyContact} />

      {error && (
        <div data-tour="resources-list" role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="min-h-20">
        {isLoading && (
          <Card data-tour="resources-list" className="rounded-3xl border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading resources...
          </Card>
        )}
        {!isLoading && !error && filteredResources.length === 0 && (
          <Card data-tour="resources-list" className="rounded-3xl border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              <HeartHandshake className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-bold text-slate-900 dark:text-white">No resources match those filters</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a different search or browse all available support.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
            >
              Reset Filters
            </button>
          </Card>
        )}
        {!isLoading && !error && filteredResources.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredResources.map((resource, index) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                index={index}
                onOpen={() => setActiveResource(resource)}
              />
            ))}
          </div>
        )}
      </div>

      {activeResource && <ResourceDetailsModal resource={activeResource} onClose={() => setActiveResource(null)} />}
    </div>
  );
};

function CategoryFilter({
  id,
  label,
  Icon,
  count,
  active,
  onClick,
}: {
  id: string;
  label: string;
  Icon: LucideIcon;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 ${active
        ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm dark:border-emerald-700 dark:bg-emerald-700'
        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-200'
      }`}
      data-category={id}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
        {count}
      </span>
    </button>
  );
}

function ResourceCard({ resource, index, onOpen }: { resource: Resource; index: number; onOpen: () => void }) {
  const category = normalizeCategory(resource.category);
  const visual = CATEGORY_VISUALS[category] ?? DEFAULT_VISUAL;
  const { Icon } = visual;
  const externalUrl = safeWebUrl(resource.url);
  const needsInAppDetails = !externalUrl || isBreathingResource(resource);

  return (
    <Card
      data-tour={index === 0 ? 'resources-list' : undefined}
      className="group flex h-full flex-col rounded-3xl border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.icon}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${visual.badge}`}>
            {labelForCategory(category)}
          </span>
        </div>
        <Sparkles className="h-4 w-4 shrink-0 text-emerald-400/70 dark:text-emerald-500/70" aria-hidden="true" />
      </div>

      <div className="mt-5 flex-1">
        <h2 className="text-lg font-extrabold leading-snug text-slate-900 dark:text-white">{resource.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{resource.description}</p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        {needsInAppDetails ? (
          <button
            type="button"
            onClick={onOpen}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 ${visual.action}`}
          >
            Open Resource
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        ) : (
          <a
            href={externalUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 ${visual.action}`}
          >
            Open Resource
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </Card>
  );
}

function QuickSupportStrip({ copiedContact, onCopy }: { copiedContact: string | null; onCopy: (key: string, value: string) => void }) {
  return (
    <Card className="overflow-hidden rounded-3xl border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-950 dark:bg-slate-900 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-extrabold text-slate-900 dark:text-white">Quick support, close at hand</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">You deserve support. Reach out to campus services or a national crisis line whenever you need to talk.</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-950 dark:bg-teal-950/25">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-teal-800 dark:text-teal-300">PUP Santa Maria | Campus support</p>
          <h3 className="mt-1 font-bold text-slate-900 dark:text-white">OSS Guidance &amp; Counseling</h3>
          <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden="true" />
            PUP Santa Maria Campus, Student Affairs Office
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Mail className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden="true" />
            <a href="mailto:santamaria@pup.edu.ph" className="font-semibold text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-950 dark:text-teal-200 dark:hover:text-white">santamaria@pup.edu.ph</a>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="mailto:santamaria@pup.edu.ph" className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/25">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email OSS
            </a>
            <CopyButton value="santamaria@pup.edu.ph" label="Copy email" copied={copiedContact === 'campus-email'} onClick={() => onCopy('campus-email', 'santamaria@pup.edu.ph')} />
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 dark:border-rose-950 dark:bg-rose-950/25">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-rose-800 dark:text-rose-300">National Center for Mental Health</p>
          <h3 className="mt-1 font-bold text-slate-900 dark:text-white">24/7 Crisis Hotline</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">Call 1553 nationwide or 0917-899-8727 from a mobile phone.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="tel:1553" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/25">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" /> Call 1553
            </a>
            <CopyButton value="1553" label="Copy 1553" copied={copiedContact === 'ncmh-1553'} onClick={() => onCopy('ncmh-1553', '1553')} />
            <a href="tel:09178998727" aria-label="Call NCMH mobile line 0917-899-8727" className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white/80 px-3 py-2 text-xs font-bold text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20 dark:border-rose-900 dark:bg-slate-900/60 dark:text-rose-200 dark:hover:bg-rose-950/70">
              <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" /> 0917-899-8727
            </a>
            <CopyButton value="0917-899-8727" label="Copy mobile number" copied={copiedContact === 'ncmh-mobile'} onClick={() => onCopy('ncmh-mobile', '0917-899-8727')} />
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        If you are in immediate danger, contact local emergency services.
      </p>
    </Card>
  );
}

function CopyButton({ value, label, copied, onClick }: { value: string; label: string; copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? `${value} copied` : label}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function ResourceDetailsModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const category = normalizeCategory(resource.category);
  const visual = CATEGORY_VISUALS[category] ?? DEFAULT_VISUAL;
  const { Icon } = visual;
  const externalUrl = safeWebUrl(resource.url);
  const breathing = isBreathingResource(resource);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-modal-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${visual.icon}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className={`inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${visual.badge}`}>{labelForCategory(category)}</p>
              <h2 id="resource-modal-title" className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">{resource.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close resource details"
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{resource.description}</p>
          {breathing && <BoxBreathingExercise />}
          {!breathing && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-4 text-sm leading-relaxed text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
              <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
              <p>Use this resource in whatever way feels helpful. If you need personal guidance, the campus support and crisis contacts are available on this page.</p>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          {externalUrl && (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25">
              Open source resource <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

const BREATHING_PHASES = [
  { label: 'Inhale', instruction: 'Breathe in gently through your nose', scale: 'scale-110' },
  { label: 'Hold', instruction: 'Pause softly, without straining', scale: 'scale-110' },
  { label: 'Exhale', instruction: 'Breathe out slowly', scale: 'scale-90' },
  { label: 'Hold', instruction: 'Rest before the next breath', scale: 'scale-90' },
] as const;

function BoxBreathingExercise() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const phaseDuration = 4;
  const cycleDuration = BREATHING_PHASES.length * phaseDuration;
  const phaseIndex = Math.floor((elapsedSeconds % cycleDuration) / phaseDuration);
  const secondsLeft = phaseDuration - (elapsedSeconds % phaseDuration);
  const phase = BREATHING_PHASES[phaseIndex];

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => setElapsedSeconds((elapsed) => elapsed + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  return (
    <div className="mt-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/70 p-5 text-center dark:border-emerald-950 dark:from-emerald-950/50 dark:to-slate-800 sm:p-6">
      <div className="mx-auto flex max-w-sm items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
        <Wind className="h-4 w-4" aria-hidden="true" /> Box breathing | 4 seconds each
      </div>
      <div className="relative mx-auto my-7 flex h-40 w-40 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border border-emerald-300/60 dark:border-emerald-700/70" />
        <span className={`absolute inset-3 rounded-full bg-gradient-to-br from-emerald-300/70 to-teal-300/70 shadow-lg shadow-emerald-900/10 transition-transform duration-[3800ms] ease-in-out motion-reduce:transition-none dark:from-emerald-700/70 dark:to-teal-800/70 ${phase.scale}`} />
        <span className="relative text-3xl font-extrabold tabular-nums text-emerald-950 dark:text-emerald-50">{secondsLeft}</span>
      </div>
      <p className="text-xl font-extrabold text-slate-900 dark:text-white" aria-live="polite">{phase.label}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{phase.instruction}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Move through inhale, hold, exhale, and rest. Stop or return to your natural breathing at any time.</p>
      <div className="mt-5 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setIsRunning((running) => !running)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
        >
          {isRunning ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {isRunning ? 'Pause exercise' : elapsedSeconds > 0 ? 'Resume exercise' : 'Start exercise'}
        </button>
        <button
          type="button"
          onClick={() => { setIsRunning(false); setElapsedSeconds(0); }}
          aria-label="Reset breathing exercise"
          className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white/80 p-2.5 text-emerald-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:border-emerald-900 dark:bg-slate-900/70 dark:text-emerald-200 dark:hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
