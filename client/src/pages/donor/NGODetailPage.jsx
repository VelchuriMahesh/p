import { useEffect, useState } from 'react';
import { MapPin, Phone, Navigation, Heart, MessageCircle, ArrowRight, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NeedCard from '../../components/NeedCard';
import { fetchNgoById, fetchNgoNeeds, fetchNgoPosts, togglePostLike } from '../../services/ngoService';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';

export default function NGODetailPage() {
  const { ngoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('needs');
  const [ngo, setNgo] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const loadNgo = async () => {
      setLoading(true);
      try {
        const [nextNgo, nextNeeds, nextPosts] = await Promise.all([
          fetchNgoById(ngoId),
          fetchNgoNeeds(ngoId),
          fetchNgoPosts(ngoId),
        ]);
        setNgo(nextNgo);
        setNeeds(nextNeeds);
        setPosts(nextPosts);
      } finally {
        setLoading(false);
      }
    };
    loadNgo();
  }, [ngoId]);

  const handleDirections = () => {
    if (!ngo) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${ngo.lat},${ngo.lng}&travelmode=driving`,
            '_blank'
          );
        },
        () => {
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${ngo.lat},${ngo.lng}&travelmode=driving`,
            '_blank'
          );
        }
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${ngo.lat},${ngo.lng}&travelmode=driving`,
        '_blank'
      );
    }
  };

  const handleLikePost = async (post) => {
    if (!user) return;
    const alreadyLiked = post.likedBy?.includes(user.uid);
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
  };

  const hasValidLocation =
    ngo?.lat && ngo?.lng && !isNaN(Number(ngo.lat)) && !isNaN(Number(ngo.lng));

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-5">
        <div className="skeleton h-56 rounded-[28px]" />
        <div className="skeleton h-40 rounded-[24px]" />
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 text-center text-sm text-muted">
        NGO not found.
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* Post detail modal */}
      <AnimatePresence>
        {selectedPost ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
            onClick={() => setSelectedPost(null)}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <img
                  src={ngo.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=100&q=80'}
                  alt={ngo.name}
                  className="h-9 w-9 rounded-full object-cover border-2 border-white/20"
                />
                <div>
                  <p className="text-sm font-bold text-white">{ngo.name}</p>
                  <p className="text-xs text-white/50">{formatDate(selectedPost.createdAt)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedPost(null)} className="text-white/60 text-sm font-semibold">
                Close
              </button>
            </div>
            <div className="flex-1 flex items-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedPost.mediaUrl}
                alt={selectedPost.caption}
                className="w-full object-contain"
                style={{ maxHeight: '70vh' }}
              />
            </div>
            <div className="bg-black px-4 pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-3">
                <button type="button" onClick={() => handleLikePost(selectedPost)}>
                  <Heart
                    className={`h-6 w-6 ${
                      selectedPost.likedBy?.includes(user?.uid)
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-white'
                    }`}
                  />
                </button>
                <button type="button" onClick={() => {
                  const text = `${selectedPost.caption} — ${ngo.name} on Celebrate With Purpose`;
                  if (navigator.share) navigator.share({ text });
                  else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}>
                  <Share2 className="h-6 w-6 text-white" />
                </button>
              </div>
              <p className="text-sm text-white leading-5">
                <span className="font-bold mr-1">{ngo.name}</span>
                {selectedPost.caption}
              </p>
              <p className="text-xs text-white/40 mt-1">{selectedPost.likes || 0} likes</p>
              <button
                type="button"
                onClick={() => navigate(`/ngo/${ngo.ngoId}/donate`)}
                className="mt-4 w-full rounded-2xl bg-accent py-3 text-sm font-bold text-white"
              >
                ❤️ Support {ngo.name}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto max-w-md space-y-0">
        {/* Cover + profile */}
        <div className="relative">
          <div
            className="h-52 bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                ngo.coverUrl ||
                ngo.logoUrl ||
                'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'
              })`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="flex items-end gap-3">
              <img
                src={ngo.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=300&q=80'}
                alt={ngo.name}
                className="h-20 w-20 rounded-[20px] border-4 border-white object-cover shadow-xl"
              />
              <div className="pb-1">
                <h1 className="text-xl font-extrabold text-white leading-tight">{ngo.name}</h1>
                <p className="text-xs text-white/70">{ngo.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white px-4 pt-4 pb-0 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-cream p-3 text-center">
              <p className="text-lg font-extrabold text-accent">₹{ngo.totalReceived || 0}</p>
              <p className="text-[10px] text-muted">received</p>
            </div>
            <div className="rounded-2xl bg-cream p-3 text-center">
              <p className="text-lg font-extrabold text-navy">{ngo.mealsServed || 0}</p>
              <p className="text-[10px] text-muted">meals served</p>
            </div>
            <div className="rounded-2xl bg-cream p-3 text-center">
              <p className="text-lg font-extrabold text-navy">{needs.length}</p>
              <p className="text-[10px] text-muted">active needs</p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm text-muted">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {ngo.address}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              {ngo.phone}
            </p>
          </div>

          {/* Map preview */}
          {hasValidLocation ? (
            <button
              type="button"
              onClick={handleDirections}
              className="relative w-full overflow-hidden rounded-2xl border border-slate-100"
            >
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${ngo.lat},${ngo.lng}&zoom=14&size=600x200&markers=color:red%7C${ngo.lat},${ngo.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&style=feature:all|saturation:-20`}
                alt="location"
                className="h-32 w-full object-cover"
                onError={(e) => { e.target.parentElement.style.display = 'none'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
                  <Navigation className="h-4 w-4 text-accent" />
                  <span className="text-sm font-bold text-navy">Get directions</span>
                </div>
              </div>
            </button>
          ) : null}

          {/* CTA buttons */}
          <div className="grid grid-cols-2 gap-3">
            {hasValidLocation ? (
              <button
                type="button"
                onClick={handleDirections}
                className="min-h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-navy text-sm font-bold text-navy"
              >
                <Navigation className="h-4 w-4" />
                Directions
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate(`/ngo/${ngo.ngoId}/donate`)}
              className={`min-h-12 rounded-2xl bg-accent text-sm font-bold text-white ${hasValidLocation ? '' : 'col-span-2'}`}
            >
              Donate Online
            </button>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-cream p-1">
            {['needs', 'posts', 'about'].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setTab(item)}
                className={`min-h-10 rounded-xl text-sm font-bold capitalize transition-all ${
                  tab === item ? 'bg-white text-accent shadow-sm' : 'text-muted'
                }`}
              >
                {item}
                {item === 'needs' && needs.length > 0 ? (
                  <span className="ml-1 text-xs text-accent">({needs.length})</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white px-4 pb-4 space-y-4 min-h-48">
          {tab === 'needs' ? (
            <div className="space-y-3 pt-3">
              {needs.length ? (
                needs.map((need) => <NeedCard key={need.needId} need={need} ngoId={ngo.ngoId} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-muted">
                  No active needs right now.
                </div>
              )}
            </div>
          ) : null}

          {tab === 'posts' ? (
            <div className="pt-3 space-y-4">
              {ngo.gallery?.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Gallery</p>
                  <div className="grid grid-cols-3 gap-1">
                    {ngo.gallery.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedPost({ mediaUrl: url, caption: ngo.name, likes: 0, likedBy: [], createdAt: null, postId: `gallery-${index}` })}
                        className="aspect-square overflow-hidden rounded-xl"
                      >
                        <img src={url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {posts.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Posts</p>
                  <div className="grid grid-cols-3 gap-1">
                    {posts.map((post) => (
                      <button
                        key={post.postId}
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className="aspect-square overflow-hidden rounded-xl relative"
                      >
                        <img src={post.mediaUrl} alt={post.caption} className="h-full w-full object-cover" />
                        {post.likes > 0 ? (
                          <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5">
                            <Heart className="h-2.5 w-2.5 fill-white text-white" />
                            <span className="text-[9px] font-bold text-white">{post.likes}</span>
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {!ngo.gallery?.length && !posts.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-muted">
                  No photos yet.
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'about' ? (
            <div className="pt-3 space-y-4">
              {ngo.coverUrl ? (
                <img src={ngo.coverUrl} alt="About" className="w-full rounded-2xl object-cover h-40" />
              ) : null}
              <p className="text-sm leading-6 text-muted">{ngo.description}</p>
              <div className="space-y-3 rounded-2xl bg-cream p-4 text-sm">
                {ngo.foundedYear ? (
                  <p className="flex justify-between">
                    <span className="text-muted">Founded</span>
                    <span className="font-semibold text-navy">{ngo.foundedYear}</span>
                  </p>
                ) : null}
                {ngo.capacity ? (
                  <p className="flex justify-between">
                    <span className="text-muted">Resident capacity</span>
                    <span className="font-semibold text-navy">{ngo.capacity}</span>
                  </p>
                ) : null}
                <p className="flex justify-between">
                  <span className="text-muted">UPI ID</span>
                  <span className="font-semibold text-navy">{ngo.upiId || 'Not set'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted">80G</span>
                  <span className="font-semibold text-navy">{ngo.section80G || 'Pending'}</span>
                </p>
                {ngo.facilities ? (
                  <div>
                    <p className="text-muted mb-1">Facilities</p>
                    <p className="font-semibold text-navy">{ngo.facilities}</p>
                  </div>
                ) : null}
                {ngo.website ? (
                  <p className="flex justify-between">
                    <span className="text-muted">Website</span>
                    <a href={ngo.website} target="_blank" rel="noreferrer" className="font-semibold text-accent">
                      Visit →
                    </a>
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/ngo/${ngo.ngoId}/donate`)}
                  className="min-h-12 rounded-2xl bg-accent text-sm font-bold text-white"
                >
                  Donate Online
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/ngo/${ngo.ngoId}/deliver`)}
                  className="min-h-12 rounded-2xl border-2 border-navy text-sm font-bold text-navy"
                >
                  Deliver Items
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}