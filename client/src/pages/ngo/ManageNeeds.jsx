import { useEffect, useState } from 'react';
import { createNeed, deleteNeed, fetchMyNgoProfile, updateNeed } from '../../services/ngoAdminService';
import { fetchNgoNeeds } from '../../services/ngoService';

const initialForm = {
  title: '',
  description: '',
  type: 'delivery',
  urgency: 'medium',
  suggestedAmount: '',
  expiresAt: '',
};

export default function ManageNeeds() {
  const [ngo, setNgo] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadNeeds = async () => {
    const profile = await fetchMyNgoProfile();
    const list = await fetchNgoNeeds(profile.ngoId, { includeInactive: true });
    setNgo(profile);
    setNeeds(list);
  };

  useEffect(() => {
    loadNeeds();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleEdit = (need) => {
    setEditingId(need.needId);
    setForm({
      title: need.title,
      description: need.description,
      type: need.type,
      urgency: need.urgency,
      suggestedAmount: need.suggestedAmount || '',
      expiresAt: need.expiresAt?.toDate ? need.expiresAt.toDate().toISOString().slice(0, 10) : '',
      isActive: need.isActive,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (editingId) {
      await updateNeed(editingId, form);
    } else {
      await createNeed(form);
    }

    setForm(initialForm);
    setEditingId(null);
    await loadNeeds();
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-5">
      <section className="rounded-[28px] bg-white p-5 shadow-card">
        <p className="text-sm font-semibold text-accent">{ngo?.name || 'NGO'}</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Manage needs</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Need title" required className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" required className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select name="type" value={form.type} onChange={handleChange} className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm">
              <option value="delivery">Delivery</option>
              <option value="money">Money</option>
            </select>
            <select name="urgency" value={form.urgency} onChange={handleChange} className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="suggestedAmount" type="number" value={form.suggestedAmount} onChange={handleChange} placeholder="Suggested amount" className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm" />
            <input name="expiresAt" type="date" value={form.expiresAt} onChange={handleChange} className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm" />
          </div>
          <button type="submit" className="min-h-12 w-full rounded-xl bg-accent text-sm font-semibold text-white">
            {editingId ? 'Update need' : 'Add need'}
          </button>
        </form>
      </section>

      <div className="space-y-3">
        {needs.map((need) => (
          <div key={need.needId} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy">{need.title}</p>
                <p className="mt-1 text-sm text-muted">{need.description}</p>
                <p className="mt-2 text-xs text-muted">
                  {need.type} • {need.urgency} • {need.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => handleEdit(need)} className="rounded-full bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">
                  Edit
                </button>
                <button type="button" onClick={() => updateNeed(need.needId, { isActive: !need.isActive }).then(loadNeeds)} className="rounded-full bg-navy/10 px-3 py-2 text-xs font-semibold text-navy">
                  {need.isActive ? 'Pause' : 'Activate'}
                </button>
                <button type="button" onClick={() => deleteNeed(need.needId).then(loadNeeds)} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
