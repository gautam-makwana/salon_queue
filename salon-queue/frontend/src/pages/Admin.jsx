// src/pages/Admin.jsx
// Screen 7: /admin — Owner salon management dashboard & floor analytics

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import {
  BarChart3, Settings2, Plus, Edit3, Power, Scissors,
  Users, Clock, AlertTriangle, CheckCircle2, Moon, Sparkles, X
} from 'lucide-react';

const BARBERS = ['Ravi', 'Amit', 'Imran'];

function ServiceForm({ initial, onSave, onCancel, t, loading }) {
  const [form, setForm] = useState(
    initial || { nameEn: '', nameGu: '', durationMin: '', price: '', enabled: true }
  );
  const [err, setErr] = useState(null);

  function validate() {
    if (!form.nameEn.trim()) return 'English name is required.';
    if (!form.nameGu.trim()) return 'Gujarati name is required.';
    if (!form.durationMin || Number(form.durationMin) <= 0) return 'Duration must be a positive number of minutes.';
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {err && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          {err}
        </div>
      )}

      {[
        { label: t.admin.nameEn, key: 'nameEn', type: 'text', placeholder: 'e.g. Haircut' },
        { label: t.admin.nameGu, key: 'nameGu', type: 'text', placeholder: 'e.g. હેરકટ' },
        { label: t.admin.duration, key: 'durationMin', type: 'number', min: 1, placeholder: '30' },
        { label: t.admin.price, key: 'price', type: 'number', min: 0, placeholder: '150' },
      ].map(({ label, key, type, min, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1">
            {label}
          </label>
          <input
            className="input text-sm py-2.5"
            type={type}
            min={min}
            placeholder={placeholder}
            value={form[key]}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          />
        </div>
      ))}

      <div className="flex gap-3 pt-3">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          {t.cancel}
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 font-bold">
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
    setTimeout(() => setToast(null), 3500);
  }

  const fetchAll = useCallback(async () => {
    try {
      const [st, svcs, bbs, sett] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/services/all'),
        api.get('/api/barbers'),
        api.get('/api/admin/settings'),
      ]);
      setStats(st);
      setServices(svcs);
      setBarbers(bbs);
      setSettings(sett);
    } catch (e) {
      if (e.status === 401 || e.status === 403) { logout(); navigate('/login'); }
    } finally {
      setLoading(false);
    }
  }, [api, logout, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function doAction(key, fn, successMsg) {
    setBusy((p) => ({ ...p, [key]: true }));
    try {
      await fn();
      await fetchAll();
      showToast(successMsg || t.admin.saveSuccess);
    } catch (e) {
      showToast(e.message || t.admin.saveError, false);
    } finally {
      setBusy((p) => ({ ...p, [key]: false }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-softblack-muted font-medium">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {toast && (
          <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-subtle ${
            toast.ok ? 'bg-pista-light text-deepgreen border border-pista' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Dashboard Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-softblack tracking-tight font-display">
            {t.admin.title}
          </h1>
          <p className="text-xs text-softblack-muted mt-0.5">
            Real-time salon operations, services catalog and stylist shift controls
          </p>
        </div>

        {/* Daily Floor Metrics Cards */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-softblack uppercase tracking-wider">
            {t.admin.dailyStats} ({stats?.date})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-softblack-border/80 shadow-subtle">
              <div className="flex items-center gap-2 text-xs font-bold text-deepgreen mb-2">
                <CheckCircle2 className="w-4 h-4 text-deepgreen" />
                <span>{t.admin.completed}</span>
              </div>
              <p className="text-4xl font-black text-softblack font-display">
                {stats?.completedCount ?? 0}
              </p>
              <p className="text-xs text-softblack-muted mt-1">Clients finished service today</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-softblack-border/80 shadow-subtle">
              <div className="flex items-center gap-2 text-xs font-bold text-deepgreen mb-2">
                <Clock className="w-4 h-4 text-deepgreen" />
                <span>{t.admin.avgWait}</span>
              </div>
              <p className="text-4xl font-black text-softblack font-display">
                {stats?.averageWaitMin != null ? `${stats.averageWaitMin}m` : t.admin.noAvgWait}
              </p>
              <p className="text-xs text-softblack-muted mt-1">Average joined to in-chair duration</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-softblack-border/80 shadow-subtle">
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{t.admin.noShows}</span>
              </div>
              <p className="text-4xl font-black text-red-600 font-display">
                {stats?.noShowCount ?? 0}
              </p>
              <p className="text-xs text-softblack-muted mt-1">Expired without reporting to chair</p>
            </div>
          </div>
        </section>

        {/* Online Queue Control Section */}
        <section className="bg-white rounded-3xl p-6 border border-softblack-border/80 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-deepgreen" />
                <h2 className="text-base font-bold text-softblack">
                  {t.admin.queueControl}
                </h2>
              </div>
              <p className="text-xs text-softblack-muted mt-1">
                {t.admin.scheduledClose} <span className="font-bold text-softblack">{settings?.closingTime}</span> &bull; {t.admin.cutoffNote}
              </p>
            </div>

            <button
              disabled={busy.queueToggle || (!settings?.onlineQueueOpen && !settings?.canReopenQueue)}
              onClick={() => doAction('queueToggle', () =>
                api.put('/api/admin/settings', { onlineQueueOpen: !settings.onlineQueueOpen })
              )}
              className={`py-3 px-6 rounded-2xl text-xs font-bold transition-all shadow-subtle ${
                settings?.onlineQueueOpen
                  ? 'btn-danger'
                  : 'btn-primary'
              }`}
            >
              {busy.queueToggle ? (
                <Spinner size="sm" />
              ) : settings?.onlineQueueOpen ? (
                'Close Online Admissions'
              ) : (
                'Open Online Admissions'
              )}
            </button>
          </div>

          {!settings?.canReopenQueue && !settings?.onlineQueueOpen && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
              {t.admin.reopenBlocked}
            </div>
          )}
        </section>

        {/* Stylist Roster & Duty Shift Toggle */}
        <section className="bg-white rounded-3xl p-6 border border-softblack-border/80 shadow-subtle space-y-4">
          <div>
            <h2 className="text-base font-bold text-softblack">{t.admin.barberRoster}</h2>
            <p className="text-xs text-softblack-muted mt-0.5">
              Control barber availability. Barbers cannot be turned off-duty while clients are waiting specifically for them or actively in-service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {barbers.map((b) => (
              <div key={b.name} className="p-4 rounded-2xl border border-softblack-border bg-offwhite flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-softblack text-base">{b.name}</p>
                    <p className={`text-xs font-bold mt-0.5 ${b.onDuty ? 'text-deepgreen' : 'text-softblack-muted'}`}>
                      {b.onDuty ? t.admin.onDuty : t.admin.offDuty}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${b.onDuty ? 'bg-deepgreen' : 'bg-neutral-300'}`}></div>
                </div>

                <button
                  disabled={busy[`duty-${b.name}`]}
                  onClick={() => doAction(`duty-${b.name}`, () => api.put(`/api/admin/barbers/${b.name}/duty`))}
                  className={`py-2 px-3 text-xs rounded-xl font-bold transition-all ${
                    b.onDuty
                      ? 'btn-secondary text-softblack hover:border-red-300 hover:text-red-700'
                      : 'btn-primary'
                  }`}
                >
                  {busy[`duty-${b.name}`] ? <Spinner size="sm" /> : b.onDuty ? 'Set Off Duty' : 'Set On Duty'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Service Menu Catalog Management */}
        <section className="bg-white rounded-3xl p-6 border border-softblack-border/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-softblack">{t.admin.services}</h2>
              <p className="text-xs text-softblack-muted mt-0.5">
                Active services appear on the client join screen with duration and price snapshots
              </p>
            </div>
            <button
              onClick={() => setSvcModal('add')}
              className="btn-primary text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.admin.addService}</span>
            </button>
          </div>

          {services.length === 0 ? (
            <p className="text-xs text-softblack-muted py-4">{t.admin.noServices}</p>
          ) : (
            <div className="divide-y divide-softblack-border/60 border border-softblack-border/60 rounded-2xl overflow-hidden">
              {services.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    s.enabled ? 'bg-white' : 'bg-neutral-50 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-softblack text-sm">{s.nameEn} / {s.nameGu}</p>
                      <span className={`badge text-[10px] ${
                        s.enabled ? 'bg-pista-light text-deepgreen border-pista' : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                      }`}>
                        {s.enabled ? t.admin.enabled : t.admin.disabled}
                      </span>
                    </div>
                    <p className="text-xs text-softblack-muted mt-0.5">
                      {s.durationMin} mins &bull; ₹{s.price}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSvcModal(s)}
                      className="btn-secondary text-xs px-3 py-1.5 rounded-xl inline-flex items-center gap-1 min-h-[36px]"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-deepgreen" />
                      <span>{t.admin.edit}</span>
                    </button>
                    <button
                      disabled={busy[`toggle-${s.id}`]}
                      onClick={() => doAction(`toggle-${s.id}`, () => api.patch(`/api/services/${s.id}/toggle`))}
                      className="btn-secondary text-xs px-3 py-1.5 rounded-xl min-h-[36px]"
                    >
                      {s.enabled ? t.admin.disable : t.admin.enable}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Service Add/Edit Modal */}
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
          onSave={(data) =>
            doAction(
              'svcSave',
              () => (svcModal === 'add' ? api.post('/api/services', data) : api.put(`/api/services/${svcModal.id}`, data)),
              t.admin.saveSuccess
            ).then(() => setSvcModal(null))
          }
        />
      </Modal>
    </div>
  );
}
