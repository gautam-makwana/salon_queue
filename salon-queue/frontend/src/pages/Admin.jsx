// src/pages/Admin.jsx
// Screen 7: /admin — Owner settings and daily stats.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';

const BARBERS = ['Ravi', 'Amit', 'Imran'];

function ServiceForm({ initial, onSave, onCancel, t, loading }) {
  const [form, setForm] = useState(initial || { nameEn: '', nameGu: '', durationMin: '', price: '', enabled: true });
  const [err, setErr] = useState(null);

  function validate() {
    if (!form.nameEn.trim()) return 'English name is required.';
    if (!form.nameGu.trim()) return 'Gujarati name is required.';
    if (!form.durationMin || Number(form.durationMin) <= 0) return 'Duration must be a positive number.';
    if (form.price === '' || Number(form.price) < 0) return 'Price must be 0 or greater.';
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const error = validate();
    if (error) { setErr(error); return; }
    onSave({ ...form, durationMin: Number(form.durationMin), price: Number(form.price) });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      {err && <p className="text-red-300 text-sm">{err}</p>}
      {[
        { label: t.admin.nameEn, key: 'nameEn', type: 'text' },
        { label: t.admin.nameGu, key: 'nameGu', type: 'text' },
        { label: t.admin.duration, key: 'durationMin', type: 'number', min: 1 },
        { label: t.admin.price, key: 'price', type: 'number', min: 0 },
      ].map(({ label, key, type, min }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-charcoal-300 mb-1">{label}</label>
          <input className="input text-sm py-2" type={type} min={min}
            value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">{t.cancel}</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? <Spinner size="sm" /> : t.save}
        </button>
      </div>
    </form>
  );
}

export default function Admin() {
  const { t } = useLang();
  const { logout } = useAuth();
  const api = useApi();
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers]   = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState({});
  const [toast, setToast]       = useState(null);
  const [svcModal, setSvcModal] = useState(null); // null | 'add' | serviceObj

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const fetchAll = useCallback(async () => {
    try {
      const [st, svcs, bbs, sett] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/services/all'),
        api.get('/api/barbers'),
        api.get('/api/admin/settings'),
      ]);
      setStats(st); setServices(svcs); setBarbers(bbs); setSettings(sett);
    } catch (e) {
      if (e.status === 401 || e.status === 403) { logout(); navigate('/login'); }
    } finally { setLoading(false); }
  }, [api, logout, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function doAction(key, fn, successMsg) {
    setBusy(p => ({ ...p, [key]: true }));
    try { await fn(); await fetchAll(); showToast(successMsg || t.admin.saveSuccess); }
    catch (e) { showToast(e.message || t.admin.saveError, false); }
    finally { setBusy(p => ({ ...p, [key]: false })); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-secondary text-sm px-3 py-2 min-h-[36px]">
          {t.admin.signOut}
        </button>
      </Header>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
        {toast && (
          <div className={`card text-sm ${toast.ok ? 'text-green-300 border border-green-700/40' : 'text-red-300 border border-red-700/40'}`}>
            {toast.msg}
          </div>
        )}

        {/* Daily Stats */}
        <section className="card">
          <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-4">{t.admin.dailyStats}</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-black text-gold">{stats?.completedCount ?? 0}</p>
              <p className="text-xs text-charcoal-400 mt-1">{t.admin.completed}</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">
                {stats?.averageWaitMin != null ? `${stats.averageWaitMin}m` : t.admin.noAvgWait}
              </p>
              <p className="text-xs text-charcoal-400 mt-1">{t.admin.avgWait}</p>
            </div>
            <div>
              <p className="text-3xl font-black text-red-400">{stats?.noShowCount ?? 0}</p>
              <p className="text-xs text-charcoal-400 mt-1">{t.admin.noShows}</p>
            </div>
          </div>
        </section>

        {/* Queue Control */}
        <section className="card">
          <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-4">{t.admin.queueControl}</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">
                {settings?.onlineQueueOpen ? t.admin.queueOpen : t.admin.queueClosed}
              </p>
              <p className="text-xs text-charcoal-400">
                {t.admin.scheduledClose} {settings?.closingTime} · {t.admin.cutoffNote}
              </p>
            </div>
            <button
              disabled={busy.queueToggle || (!settings?.onlineQueueOpen && !settings?.canReopenQueue)}
              onClick={() => doAction('queueToggle', () =>
                api.put('/api/admin/settings', { onlineQueueOpen: !settings.onlineQueueOpen })
              )}
              className={settings?.onlineQueueOpen ? 'btn-danger' : 'btn-primary'}
            >
              {busy.queueToggle ? <Spinner size="sm" /> : settings?.onlineQueueOpen ? t.admin.queueClosed : t.admin.queueOpen}
            </button>
          </div>
          {!settings?.canReopenQueue && !settings?.onlineQueueOpen && (
            <p className="text-amber-400 text-xs mt-2">{t.admin.reopenBlocked}</p>
          )}
        </section>

        {/* Barber Roster */}
        <section className="card">
          <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-4">{t.admin.barberRoster}</h2>
          <div className="space-y-3">
            {barbers.map((b) => (
              <div key={b.name} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{b.name}</p>
                  <p className={`text-xs ${b.onDuty ? 'text-green-400' : 'text-charcoal-400'}`}>
                    {b.onDuty ? t.admin.onDuty : t.admin.offDuty}
                  </p>
                </div>
                <button
                  disabled={busy[`duty-${b.name}`]}
                  onClick={() => doAction(`duty-${b.name}`, () =>
                    api.put(`/api/admin/barbers/${b.name}/duty`)
                  )}
                  className={b.onDuty ? 'btn-secondary text-sm px-4 py-2 min-h-[36px]' : 'btn-primary text-sm px-4 py-2 min-h-[36px]'}
                >
                  {busy[`duty-${b.name}`] ? <Spinner size="sm" /> : b.onDuty ? t.admin.offDuty : t.admin.onDuty}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider">{t.admin.services}</h2>
            <button onClick={() => setSvcModal('add')} className="btn-primary text-sm px-3 py-2 min-h-[36px]">
              + {t.admin.addService}
            </button>
          </div>

          {services.length === 0 ? (
            <p className="text-charcoal-400 text-sm">{t.admin.noServices}</p>
          ) : (
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${s.enabled ? 'border-charcoal-600' : 'border-charcoal-700 opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white">{s.nameEn} / {s.nameGu}</p>
                    <p className="text-xs text-charcoal-400">{s.durationMin}m · ₹{s.price}</p>
                  </div>
                  <span className={`badge text-xs ${s.enabled ? 'bg-green-900/60 text-green-300 border border-green-600/40' : 'bg-charcoal-600 text-charcoal-400 border border-charcoal-500'}`}>
                    {s.enabled ? t.admin.enabled : t.admin.disabled}
                  </span>
                  <button onClick={() => setSvcModal(s)} className="btn-secondary text-xs px-3 py-1 min-h-[32px]">{t.admin.edit}</button>
                  <button
                    disabled={busy[`toggle-${s.id}`]}
                    onClick={() => doAction(`toggle-${s.id}`, () => api.patch(`/api/services/${s.id}/toggle`))}
                    className="btn-secondary text-xs px-3 py-1 min-h-[32px]"
                  >
                    {s.enabled ? t.admin.disable : t.admin.enable}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Service modal */}
      <Modal
        open={!!svcModal}
        onClose={() => setSvcModal(null)}
        title={svcModal === 'add' ? t.admin.addService : t.admin.editService}
      >
        <ServiceForm
          initial={svcModal !== 'add' ? svcModal : null}
          loading={busy.svcSave}
          t={t}
          onCancel={() => setSvcModal(null)}
          onSave={(data) => doAction('svcSave',
            () => svcModal === 'add'
              ? api.post('/api/services', data)
              : api.put(`/api/services/${svcModal.id}`, data),
            t.admin.saveSuccess
          ).then(() => setSvcModal(null))}
        />
      </Modal>
    </div>
  );
}
