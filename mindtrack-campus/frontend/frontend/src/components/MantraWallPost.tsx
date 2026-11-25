import { useState } from 'react';
import { Flag, Heart, Sparkles, Trophy, UserRound } from 'lucide-react';
import type { MantraPostType, MantraWallPost as MantraWallPostModel } from '../types';

const TYPE_LABEL: Record<MantraPostType, string> = {
  affirmation: 'Affirmation',
  gratitude: 'Gratitude',
  win: 'Win',
};

const TYPE_STYLE: Record<MantraPostType, string> = {
  affirmation: 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/50',
  gratitude: 'bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/50',
  win: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50',
};

const TYPE_BADGE_STYLE: Record<MantraPostType, string> = {
  affirmation: 'bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200',
  gratitude: 'bg-teal-100/80 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200',
  win: 'bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
};

const TYPE_ICON = {
  affirmation: Heart,
  gratitude: Sparkles,
  win: Trophy,
};

interface MantraWallPostProps {
  post: MantraWallPostModel;
  onReport: (id: string) => Promise<void>;
  onHeart: (id: string, hearted: boolean) => Promise<void>;
  isReporting: boolean;
  isReported: boolean;
}

export const MantraWallPostCard = ({ post, onReport, onHeart, isReporting, isReported }: MantraWallPostProps) => {
  const style = TYPE_STYLE[post.post_type];
  const TypeIcon = TYPE_ICON[post.post_type];
  const hasSentHeart = post.has_sent_heart ?? false;
  const [isSavingHeart, setIsSavingHeart] = useState(false);
  const [heartError, setHeartError] = useState<string | null>(null);
  const handleHeart = async () => {
    if (isSavingHeart || post.moderation_status !== 'approved') return;
    setIsSavingHeart(true);
    setHeartError(null);
    try {
      await onHeart(post.id, !hasSentHeart);
    } catch {
      setHeartError('Your heart could not be saved. Please try again.');
    } finally {
      setIsSavingHeart(false);
    }
  };

  return (
    <article id={`post-${post.id}`} className={`scroll-mt-24 flex h-full flex-col gap-4 rounded-3xl border p-5 sm:p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md target:ring-2 target:ring-emerald-500 ${style}`}>
      <div className="flex justify-between items-start gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${TYPE_BADGE_STYLE[post.post_type]}`}>
          <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {TYPE_LABEL[post.post_type]}
        </span>
        {post.moderation_status === 'pending' && (
          <span className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            Pending review
          </span>
        )}
      </div>

      <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-800 dark:text-slate-200">
        {post.content}
      </p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/5 dark:border-white/10 pt-4">
        <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 shadow-sm">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="truncate">{post.nickname ?? 'Anonymous'}</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleHeart()}
            disabled={isSavingHeart || post.moderation_status !== 'approved'}
            aria-pressed={hasSentHeart}
            aria-label={hasSentHeart ? 'Remove your heart' : 'Send a heart'}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              hasSentHeart
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border-white/80 bg-white/70 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/40 dark:hover:text-rose-300'
            }`}
          >
            <Heart className={`h-4 w-4 ${hasSentHeart ? 'fill-current' : ''}`} aria-hidden="true" />
            <span>{isSavingHeart ? 'Saving…' : hasSentHeart ? 'Heart sent' : 'Send Heart'}</span>
            <span className="tabular-nums">{post.heart_count ?? 0}</span>
          </button>
          <button
            type="button"
            onClick={() => onReport(post.id)}
            disabled={isReporting || isReported}
            className="inline-flex items-center gap-1 rounded-full px-2 py-2 text-xs font-semibold text-slate-500 transition-colors hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-slate-400 dark:hover:text-rose-300 disabled:cursor-default disabled:opacity-60"
          >
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            {isReported ? 'Reported' : isReporting ? 'Reporting…' : 'Report'}
          </button>
        </div>
      </div>
      {heartError && <p role="alert" className="text-xs font-semibold text-rose-700 dark:text-rose-300">{heartError}</p>}
    </article>
  );
};
