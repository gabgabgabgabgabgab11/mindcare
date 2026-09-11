import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface FlaggedPost {
  id: string;
  content: string;
  date: string;
  reportReason: string;
  status: 'pending' | 'reported';
}

export const AdminModeration = () => {
  // Simulating the GET /wall/moderation-queue response
  const [queue, setQueue] = useState<FlaggedPost[]>([
    {
      id: 'post_101',
      content: 'This is a test post that someone flagged because they thought it broke the rules.',
      date: 'August 31, 2026',
      reportReason: 'Inappropriate content',
      status: 'reported'
    },
    {
      id: 'post_102',
      content: 'I am feeling really lost and just need someone to talk to.',
      date: 'August 31, 2026',
      reportReason: 'Requires urgent counselor referral',
      status: 'pending'
    }
  ]);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = (id: string, action: 'approve' | 'remove') => {
    setProcessingId(id);
    
    // Simulating PATCH /wall/posts/{id}/moderate
    setTimeout(() => {
      setQueue(queue.filter(post => post.id !== id));
      setProcessingId(null);
      alert(`Post successfully ${action}d.`);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moderation Queue</h1>
        <p className="text-gray-500 mt-2">
          Review pending and reported posts from the Freedom Wall. 
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {queue.length === 0 ? (
          <Card className="text-center py-12 bg-gray-50">
            <p className="text-gray-500 font-medium">The moderation queue is currently empty.</p>
          </Card>
        ) : (
          queue.map(post => (
            <Card key={post.id} className="flex flex-col gap-4 border-l-4 border-l-yellow-400">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                    post.status === 'reported' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {post.status}
                  </span>
                  <p className="text-xs font-semibold text-gray-500 mt-2">Posted: {post.date}</p>
                </div>
                <p className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  Flag: {post.reportReason}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t pt-4">
                <Button 
                  variant="danger" 
                  isLoading={processingId === post.id}
                  onClick={() => handleAction(post.id, 'remove')}
                >
                  Remove Post
                </Button>
                <Button 
                  variant="primary" 
                  isLoading={processingId === post.id}
                  onClick={() => handleAction(post.id, 'approve')}
                >
                  Approve & Publish
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};