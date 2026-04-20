import { useEffect, useState } from 'react';
import { fetchAllNgos, updateNgoByAdmin } from '../../services/adminService';
import { uploadImageToImgBB } from '../../utils/uploadImage';
import { Plus, X, Image, QrCode, Copy, Check } from 'lucide-react';

const generateQRUrl = (upiId, ngoName) => {
  if (!upiId) return null;
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(ngoName)}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}&bgcolor=ffffff&color=1a1a2e&margin=10`;
};

export default function ManageNGOs() {
  const [ngos, setNgos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [copied, setCopied] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);

  const loadNgos = async () => {
    const list = await fetchAllNgos();
    setNgos(list);
  };

  useEffect(() => { loadNgos(); }, []);

  const startEdit = (ngo) => {
    setEditingId(ngo.ngoId);
    setLogoFile(null);
    setCoverFile(null);
    setGalleryFiles([]);
    setLogoPreview(ngo.logoUrl || null);
    setCoverPreview(ngo.coverUrl || null);
    setGalleryPreviews(ngo.gallery || []);
    setActiveSection('basic');
    setQrPreview(ngo.upiId ? generateQRUrl(ngo.upiId, ngo.name) : null);
    setForm({
      name: ngo.name || '',
      description: ngo.description || '',
      shortBio: ngo.shortBio || '',
      address: ngo.address || '',
      phone: ngo.phone || '',
      email: ngo.email || '',
      upiId: ngo.upiId || '',
      lat: ngo.lat || '',
      lng: ngo.lng || '',
      section80G: ngo.section80G || '',
      foundedYear: ngo.foundedYear || '',
      capacity: ngo.capacity || '',
      facilities: ngo.facilities || '',
      website: ngo.website || '',
      isActive: ngo.isActive,
    });
  };

  const handleUpiChange = (value) => {
    setForm((c) => ({ ...c, upiId: value }));
    if (value.trim()) {
      setQrPreview(generateQRUrl(value.trim(), form.name || 'NGO'));
    } else {
      setQrPreview(null);
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeGalleryItem = (index) => {
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updates = { ...form };
      if (updates.lat) updates.lat = Number(updates.lat);
      if (updates.lng) updates.lng = Number(updates.lng);

      if (logoFile) updates.logoUrl = await uploadImageToImgBB(logoFile);
      if (coverFile) updates.coverUrl = await uploadImageToImgBB(coverFile);

      if (updates.upiId) {
        updates.qrCodeUrl = generateQRUrl(updates.upiId, updates.name || form.name);
      } else {
        updates.qrCodeUrl = '';
      }

      if (galleryFiles.length > 0) {
        const uploadedGallery = await Promise.all(galleryFiles.map((f) => uploadImageToImgBB(f)));
        const existingGallery = galleryPreviews.filter((p) => p.startsWith('http'));
        updates.gallery = [...existingGallery, ...uploadedGallery];
      } else {
        updates.gallery = galleryPreviews.filter((p) => p.startsWith('http'));
      }

      await updateNgoByAdmin(editingId, updates);
      setEditingId(null);
      setForm({});
      setLogoFile(null);
      setCoverFile(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
      setQrPreview(null);
      await loadNgos();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const sections = ['basic', 'upi & qr', 'media', 'details', 'settings'];

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-5">
      <section className="rounded-[28px] bg-white p-5 shadow-card">
        <h1 className="text-2xl font-bold text-navy">Manage NGOs</h1>
        <p className="mt-2 text-sm text-muted">
          Update profiles, set UPI IDs (auto-generates QR), upload photos and manage settings.
        </p>
        <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800">🔒 Only admin can set UPI IDs</p>
          <p className="text-xs text-amber-700 mt-0.5">NGOs cannot change their UPI or QR. Enter the UPI here and a QR is auto-generated for donors.</p>
        </div>
      </section>

      {ngos.map((ngo) => (
        <div key={ngo.ngoId} className="rounded-2xl bg-white shadow-card overflow-hidden">
          {editingId === ngo.ngoId ? (
            <div>
              <div className="flex gap-1 p-3 bg-cream overflow-x-auto hide-scrollbar">
                {sections.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveSection(s)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize whitespace-nowrap ${
                      activeSection === s ? 'bg-accent text-white' : 'bg-white text-navy'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-3">

                {activeSection === 'basic' ? (
                  <>
                    <p className="text-xs font-bold text-accent uppercase tracking-wide">Basic Information</p>
                    <input value={form.name || ''} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="NGO name" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" />
                    <input value={form.shortBio || ''} onChange={(e) => setForm((c) => ({ ...c, shortBio: e.target.value }))} placeholder="Short tagline" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" />
                    <textarea value={form.description || ''} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="Full description" rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                    <input value={form.address || ''} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} placeholder="Full address" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={form.lat || ''} onChange={(e) => setForm((c) => ({ ...c, lat: e.target.value }))} placeholder="Latitude" type="number" step="any" className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm" />
                      <input value={form.lng || ''} onChange={(e) => setForm((c) => ({ ...c, lng: e.target.value }))} placeholder="Longitude" type="number" step="any" className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm" />
                    </div>
                    <input value={form.phone || ''} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} placeholder="Phone" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" />
                    <input value={form.email || ''} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="Email" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" />
                    <input value={form.website || ''} onChange={(e) => setForm((c) => ({ ...c, website: e.target.value }))} placeholder="Website URL (optional)" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" />
                  </>
                ) : null}

                {activeSection === 'upi & qr' ? (
                  <>
                    <p className="text-xs font-bold text-accent uppercase tracking-wide">UPI & QR Code</p>
                    <div className="rounded-2xl bg-accent/5 border border-accent/20 p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <QrCode className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-navy">Admin-controlled UPI</p>
                          <p className="text-xs text-muted mt-0.5">Enter the NGO's UPI ID below. A QR code is automatically generated and shown to donors. NGOs cannot change this.</p>
                        </div>
                      </div>
                      <input
                        value={form.upiId || ''}
                        onChange={(e) => handleUpiChange(e.target.value)}
                        placeholder="e.g. ngoname@upi or 9876543210@ybl or abc@okaxis"
                        className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm bg-white outline-none focus:border-accent"
                      />
                      {form.upiId ? (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <p className="text-xs font-semibold text-emerald-700">UPI set: {form.upiId}</p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(form.upiId);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="ml-auto flex items-center gap-1 text-xs text-emerald-600"
                          >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                          <p className="text-xs text-amber-700">⚠️ No UPI set — donors won't see a QR code</p>
                        </div>
                      )}
                    </div>

                    {qrPreview ? (
                      <div className="rounded-2xl border border-slate-200 p-4 text-center">
                        <p className="text-xs font-semibold text-muted mb-3">QR code preview for donors</p>
                        <img
                          src={qrPreview}
                          alt="QR Code"
                          className="mx-auto h-48 w-48 rounded-2xl"
                          onError={(e) => { e.target.src = ''; e.target.alt = 'QR generation failed'; }}
                        />
                        <p className="mt-3 text-xs text-muted">This QR code will be shown on the donate page</p>
                        <p className="text-xs font-semibold text-navy mt-1">{form.upiId}</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                        <QrCode className="h-10 w-10 text-muted mx-auto mb-2" />
                        <p className="text-sm text-muted">Enter a UPI ID above to preview the QR code</p>
                      </div>
                    )}

                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                      <p className="text-xs font-bold text-navy">UPI ID formats accepted:</p>
                      <p className="text-xs text-muted">• Phone number: <span className="font-mono">9876543210@ybl</span></p>
                      <p className="text-xs text-muted">• Name based: <span className="font-mono">ngoname@okaxis</span></p>
                      <p className="text-xs text-muted">• Custom: <span className="font-mono">abc@paytm</span></p>
                    </div>
                  </>
                ) : null}

                {activeSection === 'media' ? (
                  <>
                    <p className="text-xs font-bold text-accent uppercase tracking-wide">Photos & Media</p>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-navy">NGO Logo</p>
                      <div className="flex items-center gap-3">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-2xl object-cover border border-slate-200" />
                        ) : (
                          <div className="h-16 w-16 rounded-2xl bg-cream flex items-center justify-center text-2xl">🏠</div>
                        )}
                        <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-muted text-center">
                          {logoFile ? logoFile.name : 'Upload logo (square image)'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; setLogoFile(f); setLogoPreview(f ? URL.createObjectURL(f) : logoPreview); }} />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-navy">Cover / Banner Photo</p>
                      {coverPreview ? <img src={coverPreview} alt="Cover" className="h-32 w-full rounded-2xl object-cover" /> : null}
                      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-muted">
                        <Image className="h-4 w-4" />
                        {coverFile ? coverFile.name : 'Upload cover photo (wide image)'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; setCoverFile(f); setCoverPreview(f ? URL.createObjectURL(f) : coverPreview); }} />
                      </label>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-navy">Gallery Photos</p>
                      <p className="text-xs text-muted">Add multiple photos of the NGO, residents, activities.</p>
                      {galleryPreviews.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {galleryPreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img src={preview} alt={`Gallery ${index}`} className="h-24 w-full rounded-xl object-cover" />
                              <button type="button" onClick={() => removeGalleryItem(index)} className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-muted">
                        <Plus className="h-4 w-4" />
                        Add gallery photos (select multiple)
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
                      </label>
                    </div>
                  </>
                ) : null}

                {activeSection === 'details' ? (
                  <>
                    <p className="text-xs font-bold text-accent uppercase tracking-wide">NGO Details</p>
                    <input value={form.section80G || ''} onChange={(e) => setForm((c) => ({ ...c, section80G: e.target.value }))} placeholder="80G certificate number" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={form.foundedYear || ''} onChange={(e) => setForm((c) => ({ ...c, foundedYear: e.target.value }))} placeholder="Founded year" type="number" className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm" />
                      <input value={form.capacity || ''} onChange={(e) => setForm((c) => ({ ...c, capacity: e.target.value }))} placeholder="Resident capacity" type="number" className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm" />
                    </div>
                    <textarea value={form.facilities || ''} onChange={(e) => setForm((c) => ({ ...c, facilities: e.target.value }))} placeholder="Facilities available" rows={2} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                  </>
                ) : null}

                {activeSection === 'settings' ? (
                  <>
                    <p className="text-xs font-bold text-accent uppercase tracking-wide">NGO Settings</p>
                    <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                      <label className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-navy">Active status</p>
                          <p className="text-xs text-muted">Visible to donors on the platform</p>
                        </div>
                        <div
                          onClick={() => setForm((c) => ({ ...c, isActive: !c.isActive }))}
                          className={`relative h-6 w-12 rounded-full cursor-pointer transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-7' : 'translate-x-1'}`} />
                        </div>
                      </label>
                    </div>
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                      <p className="text-xs font-semibold text-amber-800">NGO ID</p>
                      <p className="text-xs text-amber-700 mt-1 break-all font-mono">{editingId}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1">
                      <p className="text-xs font-semibold text-navy">Stats</p>
                      {ngos.find(n => n.ngoId === editingId) ? (
                        <>
                          <p className="text-xs text-muted">Total received: ₹{ngos.find(n => n.ngoId === editingId)?.totalReceived || 0}</p>
                          <p className="text-xs text-muted">Meals served: {ngos.find(n => n.ngoId === editingId)?.mealsServed || 0}</p>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : null}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-70">
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setLogoFile(null); setCoverFile(null); setGalleryFiles([]); setGalleryPreviews([]); setQrPreview(null); }}
                    className="min-h-11 rounded-xl border border-slate-200 text-sm font-semibold text-navy"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4">
              {ngo.coverUrl ? <img src={ngo.coverUrl} alt="Cover" className="h-24 w-full rounded-2xl object-cover mb-3" /> : null}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {ngo.logoUrl ? (
                    <img src={ngo.logoUrl} alt={ngo.name} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-cream flex items-center justify-center text-lg shrink-0">🏠</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{ngo.name}</p>
                    <p className="mt-0.5 text-xs text-muted truncate">{ngo.address}</p>
                    {ngo.upiId ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="text-xs font-semibold text-emerald-600">UPI: {ngo.upiId}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-rose-400 font-semibold">⚠️ No UPI set</p>
                    )}
                    <p className={`mt-1 text-xs font-semibold ${ngo.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {ngo.isActive ? '● Active' : '○ Inactive'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {ngo.qrCodeUrl ? (
                    <img src={ngo.qrCodeUrl} alt="QR" className="h-10 w-10 rounded-lg object-contain border border-slate-100" />
                  ) : null}
                  <button type="button" onClick={() => startEdit(ngo)} className="rounded-full bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}