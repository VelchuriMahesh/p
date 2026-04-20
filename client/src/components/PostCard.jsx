import { Heart, MessageCircle, SendHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function PostCard({ post, isLiked, onLike }) {
  const navigate = useNavigate();

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[24px] bg-white shadow-card"
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <img
          src={post.ngoLogoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=300&q=80'}
          alt={post.ngoName}
          className="h-11 w-11 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{post.ngoName}</p>
          <p className="text-xs text-muted">Stories from care in action</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/ngo/${post.ngoId}`)}
          className="rounded-full bg-accent/10 px-3 py-2 text-xs font-semibold text-accent"
        >
          Donate
        </button>
      </div>

      <img src={post.mediaUrl} alt={post.caption} className="h-80 w-full object-cover" />

      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onLike} className={`flex items-center gap-2 text-sm font-semibold ${isLiked ? 'text-accent' : 'text-navy'}`}>
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            {post.likes || 0}
          </button>
          <span className="flex items-center gap-2 text-sm text-muted">
            <MessageCircle className="h-5 w-5" />
            {post.comments?.length || 0}
          </span>
        </div>

        <div>
          <p className="text-sm leading-6 text-ink">{post.caption}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/ngo/${post.ngoId}`)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy text-sm font-semibold text-white"
        >
          <SendHorizontal className="h-4 w-4" />
          View NGO
        </button>
      </div>
    </motion.article>
  );
}
