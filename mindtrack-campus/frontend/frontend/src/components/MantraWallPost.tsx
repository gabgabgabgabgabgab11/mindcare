import { Heart, Flag } from 'lucide-react';
import type { MantraPostType, MantraWallPost as MantraWallPostModel } from '../types';

const TYPE_LABEL: Record<MantraPostType, string> = {
  affirmation: 'Affirmation',
  gratitude: 'Gratitude',
  win: 'Win',
};

const TYPE_STYLE: Record<MantraPostType, string> = {
  affirmation: 'bg-violet-50 border-violet-100 text-violet-900',
  gratitude: 'bg-amber-50 border-amber-100 text-amber-900',
  win: 'bg-teal-50 border-teal-100 text-teal-900',
};

interface MantraWallPostProps {
  post: MantraWallPostModel;
  onReport: (id: string) => void;
}

export const MantraWallPostCard = ({ post, onReport }: MantraWallPostProps) => {
  const style = TYPE_STYLE[post.post_type];

  return (
    <article className={`flex flex-col gap-3 p-5 mb-4 shadow-sm border rounded-2xl ${style}`}>
      <div className="flex justify-between items-start gap-3">
        <span className="inline-flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          <Heart className="w-3.5 h-3.5" aria-hidden="true" />
          {TYPE_LABEL[post.post_type]}
        </span>
        {post.moderation_status === 'pending' && (
          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            Pending review
          </span>
        )}
      </div>

      <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap font-medium">
        {post.content}
      </p>

      <div className="flex justify-between items-center mt-2 pt-3 border-t border-black/5">
        <span className="text-xs font-semibold opacity-60">
          {post.nickname ?? 'Anonymous'}
        </span>
        <button
          type="button"
          onClick={() => onReport(post.id)}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-40 hover:opacity-100 hover:text-red-600 transition-all"
        >
          <Flag className="w-3 h-3" aria-hidden="true" />
          Report
        </button>
      </div>
    </article>
  );
};

