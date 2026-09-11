import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MantraWallPostCard } from '../components/MantraWallPost';
import type { MantraPostType, MantraWallPost } from '../types';

const MAX_CHARS = 300;

const POST_TYPES: { id: MantraPostType; label: string; placeholder: string }[] = [
  { id: 'affirmation', label: 'Affirmation', placeholder: 'A kind sentence you would tell a friend.' },
  { id: 'gratitude', label: 'Gratitude', placeholder: 'Something small you are thankful for today.' },
  { id: 'win', label: 'Win', placeholder: 'A small win you want to celebrate.' },
];

export const MantraWall = () => {
  const [posts, setPosts] = useState<MantraWallPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [nickname, setNickname] = useState('');
  const [postType, setPostType] = useState<MantraPostType>('affirmation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder until the transport layer (23B) and the mantra-wall service land.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPost.trim() || newPost.length > MAX_CHARS) return;
    setIsSubmitting(true);
    // TODO(23B/23D): POST /api/v1/mantra-wall/posts via the service module.
    setIsSubmitting(false);
  };

  const handleReport = (id: string) => {
    // TODO(23D): POST /api/v1/mantra-wall/posts/{id}/report.
    void id;
  };

  const activeType = POST_TYPES.find((t) => t.id === postType) ?? POST_TYPES[0];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mantra Wall</h1>
        <p className="text-sm text-gray-500 mt-1">
          Positive affirmations, gratitude, and small wins, shared by students.
        </p>
      </div>

      <Card className="bg-violet-50/50 border-violet-100 p-4 rounded-2xl shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {POST_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setPostType(type.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors border ${
                  postType === type.id
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <textarea
            className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none min-h-20"
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
            className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />

          <div className="flex justify-between items-center mt-1">
            <span className={`text-[10px] font-bold uppercase tracking-wide ${newPost.length >= MAX_CHARS ? 'text-red-600' : 'text-gray-400'}`}>
              {newPost.length} / {MAX_CHARS}
            </span>
            <Button
              type="submit"
              variant="primary"
              className="text-xs py-2 px-5 rounded-full shadow-sm"
              isLoading={isSubmitting}
              disabled={newPost.length === 0 || newPost.length > MAX_CHARS}
            >
              Share
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col pb-4">
        {isLoading ? (
          <p className="text-center text-sm text-gray-400 py-12">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-400 text-sm font-medium py-12">
            No posts yet. Be the first to share.
          </p>
        ) : (
          posts.map((post) => (
            <MantraWallPostCard key={post.id} post={post} onReport={handleReport} />
          ))
        )}
      </div>
    </div>
  );
};

