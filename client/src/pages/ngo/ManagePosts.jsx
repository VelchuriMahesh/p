import { useEffect, useState, useRef } from 'react';
import { Camera, Heart, MessageCircle, Trash2, Plus, Image, Type, MapPin } from 'lucide-react';
import { createPost, deletePost, fetchMyNgoProfile } from '../../services/ngoAdminService';
import { fetchNgoPosts } from '../../services/ngoService';
import { formatDate } from '../../utils/date';
import { motion } from 'framer-motion';

export default function ManagePosts() {
  const [ngo, setNgo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const fileRef = useRef(null);

  const loadPosts = async () => {
    const profile = await fetchMyNgoProfile();
    const list = await fetchNgoPosts(profile.ngoId);
    setNgo(profile);
    setPosts(list);
  };

  useEffect(() => { loadPosts(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) { alert('Please select an image'); return; }
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('caption', caption);
      payload.append('file', file);
      await createPost(payload);
      setCaption('');
      setFile(null);
      setPreview(null);
      setShowCreate(false);
      await loadPosts();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell bg-white">
      {/* Header */}
      <div className="sticky top-[73px] z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-semibold">{ngo?.name}</p>
          <h1 className="text-lg font-bold text-navy">Posts</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          New post
        </button>
      </div>

      {/* Create post modal */}
      {showCreate ? (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full bg-white rounded-t-[32px] p-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-navy">Create post</h2>
              <button type="button" onClick={() => { setShowCreate(false); setFile(null); setPreview(null); setCaption(''); }} className="text-muted text-sm">Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className="relative overflow-hidden rounded-2xl bg-cream cursor-pointer"
                style={{ minHeight: '200px' }}
                onClick={() => !preview && fileRef.current?.click()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full object-cover rounded-2xl" style={{ maxHeight: '300px' }} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                      className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                      <Camera className="h-6 w-6 text-accent" />
                    </div>
                    <p className="text-sm font-semibold text-navy">Tap to upload photo</p>
                    <p className="text-xs text-muted">JPG, PNG or WebP</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    setPreview(f ? URL.createObjectURL(f) : null);
                  }}
                />
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
                <img
                  src={ngo?.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=100&q=80'}
                  alt={ngo?.name}
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                />
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption... Share a story from your home that will inspire donors."
                  rows={3}
                  required
                  className="flex-1 text-sm text-navy outline-none resize-none placeholder:text-muted"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full min-h-12 rounded-2xl bg-accent text-sm font-bold text-white disabled:opacity-50"
              >
                {loading ? 'Uploading & publishing...' : 'Share post'}
              </button>
            </form>
          </motion.div>
        </div>
      ) : null}

      {/* Post detail modal */}
      {activePost ? (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setActivePost(null)}>
          <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <img
                src={ngo?.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=100&q=80'}
                alt={ngo?.name}
                className="h-9 w-9 rounded-full object-cover border-2 border-white/20"
              />
              <div>
                <p className="text-sm font-bold text-white">{ngo?.name}</p>
                <p className="text-xs text-white/50">{formatDate(activePost.createdAt)}</p>
              </div>
            </div>
            <button type="button" onClick={() => setActivePost(null)} className="text-white/60 text-sm">Close</button>
          </div>
          <div className="flex-1 flex items-center" onClick={(e) => e.stopPropagation()}>
            <img src={activePost.mediaUrl} alt={activePost.caption} className="w-full object-contain" style={{ maxHeight: '70vh' }} />
          </div>
          <div className="bg-black px-4 py-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-3">
              <Heart className="h-6 w-6 text-white" />
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm text-white">
              <span className="font-bold mr-1">{ngo?.name}</span>
              {activePost.caption}
            </p>
            <p className="text-xs text-white/40 mt-1">{activePost.likes || 0} likes</p>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Delete this post?')) {
                  await deletePost(activePost.postId);
                  setActivePost(null);
                  await loadPosts();
                }
              }}
              className="mt-4 w-full rounded-2xl border border-rose-500 py-2.5 text-sm font-bold text-rose-500"
            >
              Delete post
            </button>
          </div>
        </div>
      ) : null}

      {/* Grid view */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="h-20 w-20 rounded-full bg-cream flex items-center justify-center text-4xl mb-4">📸</div>
          <p className="text-base font-semibold text-navy">No posts yet</p>
          <p className="text-sm text-muted mt-1">Share stories from your home to inspire donors.</p>
          <button type="button" onClick={() => setShowCreate(true)} className="mt-5 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white">
            Create first post
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {posts.map((post) => (
              <button
                key={post.postId}
                type="button"
                onClick={() => setActivePost(post)}
                className="relative aspect-square overflow-hidden bg-slate-100"
              >
                {post.mediaUrl ? (
                  <img src={post.mediaUrl} alt={post.caption} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-navy/10 flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex items-center gap-3 text-white">
                    <span className="flex items-center gap-1 text-sm font-bold">
                      <Heart className="h-4 w-4 fill-white" /> {post.likes || 0}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="h-20" />
        </>
      )}
    </div>
  );
}