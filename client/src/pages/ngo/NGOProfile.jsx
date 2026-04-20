import { useEffect, useState } from 'react';
import { fetchMyNgoProfile, updateNgoProfile } from '../../services/ngoAdminService';
import { uploadImageToImgBB } from '../../utils/uploadImage';
import { Camera, Save, Lock, Info } from 'lucide-react';

export default function NGOProfile() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
    phone: '',
    email: '',
    section80G: '',
    foundedYear: '',
    capacity: '',
    facilities: '',
    website: '',
  });
  const [ngoData, setNgoData] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyNgoProfile().then((ngo) => {
      if (!ngo) return;
      setNgoData(ngo);
      setForm({
        name: ngo.name || '',
        description: ngo.description || '',
        address: ngo.address || '',
        lat: ngo.lat || '',
        lng: ngo.lng || '',
        phone: ngo.phone || '',
        email: ngo.email || '',
        section80G: ngo.section80G || '',
        foundedYear: ngo.foundedYear || '',
        capacity: ngo.capacity || '',
        facilities: ngo.facilities || '',
        website: ngo.website || '',
      });
      setLogoPreview(ngo.logoUrl || null);
      setCoverPreview(ngo.coverUrl || null);
    });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '') payload.append(key, value);
      });
      if (logoFile) {
        const logoUrl = await uploadImageToImgBB(logoFile);
        payload.append('logoUrl', logoUrl);
      }
      if (coverFile) {
        const coverUrl = await uploadImageToImgBB(coverFile);
        payload.append('coverUrl', coverUrl);
      }
      await updateNgoProfile(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-5 space-y-4">
      {coverPreview ? (
        <div className="relative overflow-hidden rounded-[28px] shadow-card">
          <img src={coverPreview} alt="Cover" className="h-40 w-full object-cover" />
          <label className="absolute bottom-3 right-3 cursor-pointer flex items-center gap-1.5 rounded-xl bg-black/50 px-3 py-2 text-xs font-bold text-white">
            <Camera className="h-3.5 w-3.5" />
            Change cover
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setCoverFile(f);
              setCoverPreview(f ? URL.createObjectURL(f) : coverPreview);
            }} />
          </label>
        </div>
      ) : null}

      {/* UPI info banner — read only for NGOs */}
      {ngoData ? (
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${ngoData.upiId ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <Lock className={`h-5 w-5 shrink-0 mt-0.5 ${ngoData.upiId ? 'text-emerald-600' : 'text-amber-600'}`} />
          <div>
            <p className={`text-sm font-bold ${ngoData.upiId ? 'text-emerald-800' : 'text-amber-800'}`}>
              {ngoData.upiId ? 'UPI & QR configured ✓' : 'UPI not configured yet'}
            </p>
            {ngoData.upiId ? (
              <>
                <p className="text-xs text-emerald-700 mt-0.5">UPI ID: <span className="font-mono font-bold">{ngoData.upiId}</span></p>
                <p className="text-xs text-emerald-600 mt-1">Donors can pay using the auto-generated QR code on the donate page.</p>
              </>
            ) : (
              <p className="text-xs text-amber-700 mt-0.5">Contact the platform admin to set up your UPI ID and QR code. You cannot change this yourself.</p>
            )}
            <p className="text-[10px] text-muted mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              UPI and QR are managed by admin only for security.
            </p>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] bg-white p-5 shadow-card">
        <h1 className="text-2xl font-bold text-navy">NGO profile</h1>

        <div className="flex items-center gap-4">
          <div className="relative">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-20 w-20 rounded-[20px] object-cover border-2 border-slate-200" />
            ) : (
              <div className="h-20 w-20 rounded-[20px] bg-cream flex items-center justify-center text-3xl">🏠</div>
            )}
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setLogoFile(f);
                setLogoPreview(f ? URL.createObjectURL(f) : logoPreview);
              }} />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy">NGO Logo</p>
            <p className="text-xs text-muted mt-0.5">Square image recommended</p>
            {!coverPreview ? (
              <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-accent">
                <Camera className="h-3.5 w-3.5" />
                Upload cover photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setCoverFile(f);
                  setCoverPreview(f ? URL.createObjectURL(f) : null);
                }} />
              </label>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">Basic info</p>
          <input name="name" value={form.name} onChange={handleChange} placeholder="NGO name" className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description — tell donors about your work" rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-accent" />
          <input name="address" value={form.address} onChange={handleChange} placeholder="Full address" className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
          <div className="grid grid-cols-2 gap-3">
            <input name="lat" value={form.lat} onChange={handleChange} placeholder="Latitude" type="number" step="any" className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
            <input name="lng" value={form.lng} onChange={handleChange} placeholder="Longitude" type="number" step="any" className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
          </div>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
          <input name="website" value={form.website} onChange={handleChange} placeholder="Website URL (optional)" className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">NGO details</p>
          <input name="section80G" value={form.section80G} onChange={handleChange} placeholder="80G certificate number" className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
          <div className="grid grid-cols-2 gap-3">
            <input name="foundedYear" value={form.foundedYear} onChange={handleChange} placeholder="Founded year" type="number" className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
            <input name="capacity" value={form.capacity} onChange={handleChange} placeholder="Resident capacity" type="number" className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent" />
          </div>
          <textarea name="facilities" value={form.facilities} onChange={handleChange} placeholder="Facilities available" rows={2} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-accent" />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`min-h-12 w-full rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${saved ? 'bg-emerald-600' : 'bg-accent'}`}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}