import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Trophy, PenLine, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MantraWallPostCard } from '../components/MantraWallPost';
import { CompanionHeader } from '../components/CompanionHeader';
import { createMantraWallPost, listMantraWallPosts, reportMantraWallPost, setMantraWallHeart } from '../services/studentApi';
import type { MantraPostType, MantraWallPost } from '../types';

const MAX_CHARS = 300;

const POST_TYPES: { id: MantraPostType; label: string; placeholder: string }[] = [
  { id: 'affirmation', label: 'Affirmation', placeholder: 'A kind sentence you would tell a friend.' },
  { id: 'gratitude', label: 'Gratitude', placeholder: 'Something small you are thankful for today.' },
  { id: 'win', label: 'Win', placeholder: 'A small win you want to celebrate.' },
];

const POST_TYPE_ICON = {
  affirmation: Heart,
  gratitude: Sparkles,
  win: Trophy,
};

type SubmitFeedback = {
  type: 'approved' | 'review' | 'rejected';
  message: string;
} | null;

export const MantraWall = () => {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const scrolledTo = useRef('');
  const [posts, setPosts] = useState<MantraWallPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [nickname, setNickname] = useState('');
  const [postType, setPostType] = useState<MantraPostType>('affirmation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<SubmitFeedback>(null);

  useEffect(() => {
    listMantraWallPosts()
      .then(setPosts)
      .catch(() => setError('Posts could not be loaded.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!hash) { scrolledTo.current = ''; return; }
    if (scrolledTo.current === hash || !/^#post-[0-9a-f-]{36}$/i.test(hash)) return;
    const target = document.getElementById(hash.slice(1));
    if (target) {
      target.scrollIntoView({ block: 'center' });
      scrolledTo.current = hash;
    }
  }, [hash, posts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPost.trim() || newPost.length > MAX_CHARS) return;
    setIsSubmitting(true);
    setError(null);
    setSubmitFeedback(null);
    try {
      const post = await createMantraWallPost({
        post_type: postType,
        content: newPost.trim(),
        nickname: nickname.trim() || null,
      });
      setPosts((current) => [post, ...current]);
      setNewPost('');
      setNickname('');

      // Status-aware feedback
      if (post.moderation_status === 'approved') {
        setSubmitFeedback({
          type: 'approved',
          message: 'Your post is live! 🎉 Thank you for sharing positivity.',
        });
      } else if (post.moderation_status === 'review') {
        setSubmitFeedback({
          type: 'review',
          message: 'Your post is under review and will appear on the wall shortly once reviewed.',
        });
      } else if (post.moderation_status === 'rejected') {
        setSubmitFeedback({
          type: 'rejected',
          message:
            "Your post couldn't be published because it didn't match our positive-content guidelines. " +
            "If you're going through a tough time, please visit our Resources page for support.",
        });
      }

      setTimeout(() => setSubmitFeedback(null), 8000);
    } catch {
      setError('Your post could not be shared. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHeart = async (id: string, hearted: boolean) => {
    const updated = await setMantraWallHeart(id, hearted);
    setPosts(current => current.map(post => post.id === id ? { ...post, ...updated } : post));
  };

  const handleReport = async (id: string) => {
    setReportingPostId(id);
    setReportSuccess(null);
    setError(null);
    try {
      await reportMantraWallPost(id);
      setReportedPostIds((current) => new Set(current).add(id));
      setReportSuccess('Your report was submitted for review.');
    } catch {
      setError('This post could not be reported. Please try again.');
    } finally {
      setReportingPostId(null);
    }
  };

  const activeType = POST_TYPES.find((t) => t.id === postType) ?? POST_TYPES[0];

  return (
    <div className="flex flex-col gap-7 sm:gap-8 pb-5">
      <CompanionHeader
        title="Freedom Wall"
        description="Positive affirmations, gratitude, and small wins, shared by students."
        speechBubbleClassName="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl p-4 sm:p-5"
      />

      <Card data-tour="freedom-compose" className="overflow-hidden bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 p-5 sm:p-6 rounded-3xl shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              <PenLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Write a Note</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Share a little encouragement, gratitude, or a win with the community.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map((type) => {
              const Icon = POST_TYPE_ICON[type.id];
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setPostType(type.id)}
                  aria-pressed={postType === type.id}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    postType === type.id
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-800 dark:hover:text-emerald-200'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {type.label}
                </button>
              );
            })}
          </div>

          <textarea
            className="w-full min-h-36 resize-y rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-3.5 text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"
            placeholder={activeType.placeholder}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            maxLength={MAX_CHARS}
          />

          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            placeholder="Display name (optional)"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"
          />

          <div className="flex items-center justify-between gap-4 pt-1">
            <span className={`text-xs font-semibold tabular-nums ${newPost.length >= MAX_CHARS ? 'text-rose-600 dark:text-rose-400' : newPost.length >= MAX_CHARS - 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {newPost.length} / {MAX_CHARS}
            </span>
            <Button
              type="submit"
              variant="primary"
              className="text-sm font-bold py-2.5 px-6 rounded-xl shadow-sm shadow-emerald-900/10 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-none cursor-pointer"
              isLoading={isSubmitting}
              disabled={newPost.length === 0 || newPost.length > MAX_CHARS}
            >
              Share
            </Button>
          </div>
        </form>
      </Card>

      {/* Submission feedback banner */}
      {submitFeedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2 ${
            submitFeedback.type === 'approved'
              ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : submitFeedback.type === 'review'
              ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
              : 'border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>
            {submitFeedback.type === 'approved' && '✅ '}
            {submitFeedback.type === 'review' && '🔍 '}
            {submitFeedback.type === 'rejected' && '⚠️ '}
            {submitFeedback.message}
          </span>
          {submitFeedback.type === 'rejected' && (
            <button
              type="button"
              onClick={() => navigate('/resources')}
              className="ml-auto text-xs font-bold underline hover:no-underline shrink-0"
            >
              View Resources →
            </button>
          )}
        </div>
      )}

      <section className="flex flex-col gap-4 pb-4" aria-labelledby="freedom-feed-heading">
        {error && <p className="mb-4 text-sm font-bold text-red-600 dark:text-red-400">{error}</p>}
        {reportSuccess && <p className="mb-4 text-sm font-bold text-green-700 dark:text-emerald-300">{reportSuccess}</p>}
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="freedom-feed-heading" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Shared with care</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A few kind words can make someone’s day feel lighter.</p>
          </div>
          {!isLoading && posts.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Student community
            </span>
          )}
        </div>
        {isLoading ? (
          <p data-tour="freedom-feed" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-sm text-slate-400 dark:text-slate-400 py-16">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div data-tour="freedom-feed" className="rounded-3xl border border-dashed border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 px-6 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-300 shadow-sm">
              <Heart className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">A little kindness starts here</p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">No notes have been shared yet. Leave the first affirmation, gratitude, or small win.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map((post, index) => (
              <div key={post.id} data-tour={index === 0 ? 'freedom-feed' : undefined} className="min-w-0">
              <MantraWallPostCard
                post={post}
                onReport={handleReport}
                onHeart={handleHeart}
                isReporting={reportingPostId === post.id}
                isReported={reportedPostIds.has(post.id)}
              />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
