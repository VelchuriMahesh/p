import { useEffect, useState, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fetchRecentPosts, togglePostLike, fetchActiveNGOs } from '../../services/ngoService';
import { formatDate } from '../../utils/date';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeAnimation, setLikeAnimation] = useState({});
  const [savedPosts, setSavedPosts] = useState(new Set());
  const lastTapRef = useRef({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [allPosts, allNgos] = await Promise.all([fetchRecentPosts(), fetchActiveNGOs()]);
      setPosts(allPosts);
      setNgos(allNgos);
      setLoading(false);
    };
    load();
  }, []);

  const handleLike = useCallback(async (post) => {
    if (!user) { navigate('/login'); return; }
    const alreadyLiked = post.likedBy?.includes(user.uid);
    if (!alreadyLiked) {
      setLikeAnimation((prev) => ({ ...prev, [post.postId]: true }));
      setTimeout(() => setLikeAnimation((prev) => ({ ...prev, [post.postId]: false })), 1000);
    }
    setPosts((current) =>
      current.map((item) =>
        item.postId === post.postId
          ? {
              ...item,
              likedBy: alreadyLiked
                ? item.likedBy.filter((uid) => uid !== user.uid)
                : [...(item.likedBy || []), user.uid],
              likes: Math.max(0, (item.likes || 0) + (alreadyLiked ? -1 : 1)),
            }
          : item
      )
    );
    await togglePostLike({ postId: post.postId, userId: user.uid, alreadyLiked });
  }, [user, navigate]);

  const handleDoubleTap = (post) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[post.postId] || 0;
    if (now - lastTap < 300) {
      handleLike(post);
    }
    lastTapRef.current[post.postId] = now;
  };

  const handleSave = (postId) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const getNgo = (ngoId) => ngos.find((n) => n.ngoId === ngoId);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="mx-auto max-w-md space-y-4 px-0 py-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="skeleton h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-2 w-16 rounded" />
                </div>
              </div>
              <div className="skeleton h-80 w-full" />
              <div className="px-4 py-3 space-y-2">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-3 w-48 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell bg-white">
      {/* Stories bar */}
      <div className="sticky top-[73px] z-10 bg-white border-b border-slate-100">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3">
          {ngos.slice(0, 8).map((ngo) => (
            <button
              key={ngo.ngoId}
              type="button"
              onClick={() => navigate(`/ngo/${ngo.ngoId}`)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className="h-14 w-14 rounded-full p-0.5 bg-gradient-to-br from-accent via-orange-400 to-yellow-400">
                <img
                  src={ngo.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=100&q=80'}
                  alt={ngo.name}
                  className="h-full w-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <span className="text-[10px] font-medium text-navy w-14 truncate text-center">{ngo.name?.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md divide-y divide-slate-50">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="h-20 w-20 rounded-full bg-cream flex items-center justify-center text-4xl mb-4">📸</div>
            <p className="text-base font-semibold text-navy">No posts yet</p>
            <p className="text-sm text-muted mt-1">NGOs will share stories and updates here soon.</p>
          </div>
        ) : null}

        {posts.map((post) => {
          const ngo = getNgo(post.ngoId);
          const isLiked = post.likedBy?.includes(user?.uid);
          const isSaved = savedPosts.has(post.postId);

          return (
            <article key={post.postId} className="bg-white">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/ngo/${post.ngoId}`)}
                  className="flex items-center gap-3"
                >
                  <div className="h-9 w-9 rounded-full p-0.5 bg-gradient-to-br from-accent to-orange-400">
                    <img
                      src={post.ngoLogoUrl || ngo?.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=100&q=80'}
                      alt={post.ngoName}
                      className="h-full w-full rounded-full object-cover border-2 border-white"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-navy leading-tight">{post.ngoName}</p>
                    <p className="text-[11px] text-muted">{formatDate(post.createdAt)}</p>
                  </div>
                </button>
                <button type="button" className="p-2 text-muted">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Image with double tap */}
              <div
                className="relative bg-slate-100 cursor-pointer"
                onClick={() => handleDoubleTap(post)}
              >
                {post.mediaUrl ? (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    className="w-full object-cover"
                    style={{ maxHeight: '500px', minHeight: '300px' }}
                  />
                ) : (
                  <div className="h-80 w-full bg-gradient-to-br from-navy to-slate-700 flex items-center justify-center">
                    <p className="text-white/50 text-sm">No image</p>
                  </div>
                )}
                <AnimatePresence>
                  {likeAnimation[post.postId] ? (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 1.3, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Heart className="h-24 w-24 fill-white text-white drop-shadow-2xl" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleLike(post)}
                      className="transition-transform active:scale-90"
                    >
                      <Heart className={`h-6 w-6 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-navy'}`} />
                    </button>
                    <button type="button" className="text-navy">
                      <MessageCircle className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = `Check out ${post.ngoName} on Celebrate With Purpose!`;
                        if (navigator.share) navigator.share({ text });
                        else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="text-navy"
                    >
                      <Send className="h-6 w-6" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSave(post.postId)}
                    className="text-navy transition-transform active:scale-90"
                  >
                    <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-navy text-navy' : ''}`} />
                  </button>
                </div>

                {post.likes > 0 ? (
                  <p className="text-sm font-bold text-navy mb-1">{post.likes} {post.likes === 1 ? 'like' : 'likes'}</p>
                ) : null}

                <p className="text-sm text-navy leading-5">
                  <span className="font-bold mr-1">{post.ngoName}</span>
                  {post.caption}
                </p>

                <button
                  type="button"
                  onClick={() => navigate(`/ngo/${post.ngoId}/donate`)}
                  className="mt-3 w-full rounded-2xl bg-gradient-to-r from-accent to-orange-400 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/30"
                >
                  ❤️ Support {post.ngoName}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}