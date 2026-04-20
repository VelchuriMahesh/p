import { useState } from 'react';
import { doc, setDoc, collection } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../services/firebase';
import { v4 as uuidv4 } from 'uuid';

const initialForm = {
  name: '',
  adminEmail: '',
  adminPassword: '',
  address: '',
  lat: '',
  lng: '',
  phone: '',
  description: '',
};

export default function CreateNGO() {
  const [form, setForm] = useState(initialForm);
  const [createdNgo, setCreatedNgo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ngoId = uuidv4();

      const credential = await createUserWithEmailAndPassword(
        auth,
        form.adminEmail,
        form.adminPassword
      );

      const adminUid = credential.user.uid;

      await Promise.all([
        setDoc(doc(db, 'ngos', ngoId), {
          ngoId,
          name: form.name,
          description: form.description,
          adminUid,
          address: form.address,
          lat: Number(form.lat) || 0,
          lng: Number(form.lng) || 0,
          phone: form.phone,
          email: form.adminEmail,
          upiId: '',
          qrCodeUrl: '',
          logoUrl: '',
          coverUrl: '',
          section80G: '',
          isActive: true,
          totalReceived: 0,
          mealsServed: 0,
          createdAt: new Date(),
        }),
        setDoc(doc(db, 'users', adminUid), {
          uid: adminUid,
          email: form.adminEmail,
          name: `${form.name} Admin`,
          role: 'ngo_admin',
          photoURL: null,
          ngoId,
          createdAt: new Date(),
          totalDonated: 0,
          totalDeliveries: 0,
          streakDays: 0,
          lastHabitDate: null,
        }),
      ]);

      setCreatedNgo({
        ngoId,
        adminEmail: form.adminEmail,
        temporaryPassword: form.adminPassword,
        name: form.name,
      });

      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'Failed to create NGO.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-5">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] bg-white p-5 shadow-card">
        <h1 className="text-2xl font-bold text-navy">Create NGO account</h1>
        <p className="text-sm text-muted">Create a new NGO admin account directly from the platform.</p>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="NGO name"
          required
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
        />
        <input
          name="adminEmail"
          value={form.adminEmail}
          onChange={handleChange}
          placeholder="Admin email"
          type="email"
          required
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
        />
        <input
          name="adminPassword"
          value={form.adminPassword}
          onChange={handleChange}
          placeholder="Admin password (min 6 characters)"
          type="password"
          required
          minLength={6}
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address"
          required
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="lat"
            value={form.lat}
            onChange={handleChange}
            placeholder="Latitude"
            type="number"
            step="any"
            required
            className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
          />
          <input
            name="lng"
            value={form.lng}
            onChange={handleChange}
            placeholder="Longitude"
            type="number"
            step="any"
            required
            className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
          />
        </div>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone number"
          required
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description about this NGO"
          required
          className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-accent"
        />

        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="min-h-12 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-70"
        >
          {loading ? 'Creating NGO...' : 'Create NGO'}
        </button>
      </form>

      {createdNgo ? (
        <div className="rounded-[28px] bg-white p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-lg">✓</div>
            <div>
              <h2 className="text-lg font-semibold text-navy">NGO created!</h2>
              <p className="text-xs text-muted">Share these credentials securely with the NGO admin.</p>
            </div>
          </div>
          <div className="space-y-2 rounded-2xl bg-cream p-4 text-sm text-navy">
            <p><span className="font-semibold">NGO name:</span> {createdNgo.name}</p>
            <p><span className="font-semibold">Email:</span> {createdNgo.adminEmail}</p>
            <p><span className="font-semibold">Password:</span> {createdNgo.temporaryPassword}</p>
            <p><span className="font-semibold">NGO ID:</span> {createdNgo.ngoId}</p>
          </div>
          <p className="mt-3 text-xs text-muted">⚠️ Ask the NGO admin to change their password after first login.</p>
        </div>
      ) : null}
    </div>
  );
}