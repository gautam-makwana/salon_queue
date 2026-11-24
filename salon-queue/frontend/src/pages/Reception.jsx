// src/pages/Reception.jsx
// Screen 4: /reception — Professional reception dashboard with clean floor control

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useSocket } from '../context/SocketContext';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { StaleWarning } from '../components/StaleWarning';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import {
  Users, UserPlus, PhoneCall, AlertOctagon, X, Scissors,
  Clock, CheckCircle2, AlertTriangle, LogOut, Sparkles, User
} from 'lucide-react';

const BARBERS = ['Ravi', 'Amit', 'Imran'];

function elapsed(dateStr) {
  if (!dateStr) return '—';
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function WalkinModal({ open, onClose, onSuccess, t, lang, services, barbers, api }) {
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [barberPref, setBarberPref]   = useState('ANY');
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState(null);

  function reset() {
    setName(''); setPhone(''); setSelectedIds([]); setBarberPref('ANY'); setErrors({}); setErr(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = t.join.errors.nameRequired;
    if (!/^\d{10}$/.test(phone)) errs.phone = t.join.errors.phoneInvalid;
    if (!selectedIds.length) errs.services = t.join.errors.selectService;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true); setErr(null);
    try {
      const data = await api.post('/api/queue/walkin', {
        customerName: name.trim(),
        phone,
        serviceIds: selectedIds,
        barberPref
      });
      onSuccess(data);
      reset();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t.reception.walkinTitle}>
      {err && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          {err}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1">
            {t.join.name}
          </label>
          <input
            className="input text-sm py-2.5"
            placeholder="Client Name"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors(x => ({ ...x, name: null })); }}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1">
            {t.join.phone}
          </label>
          <input
            className="input text-sm py-2.5"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setErrors(x => ({ ...x, phone: null })); }}
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1">
            {t.join.services}
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {services.map((s) => {
              const isSelected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedIds(p => p.includes(s.id) ? p.filter(x => x !== s.id) : p.length < 3 ? [...p, s.id] : p)}
                  className={`rounded-xl p-2.5 text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-pista-light border-deepgreen font-semibold'
                      : 'bg-white border-softblack-border hover:bg-offwhite'
                  }`}
                >
                  <p className="font-bold text-softblack truncate">{lang === 'gu' ? s.nameGu : s.nameEn}</p>
                  <p className="text-[11px] text-softblack-muted mt-0.5">{s.durationMin}m &bull; ₹{s.price}</p>
                </button>
              );
            })}
          </div>
          {errors.services && <p className="field-error">{errors.services}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1">
            {t.join.barberPref}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {['ANY', ...BARBERS].map((opt) => {
              const b = barbers.find(x => x.name === opt);
              const isOffDuty = b && !b.onDuty;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBarberPref(opt)}
                  disabled={isOffDuty}
                  className={`py-2 px-1 text-xs rounded-xl font-bold border transition-all ${
                    barberPref === opt
                      ? 'bg-pista text-softblack border-pista-dark'
                      : 'bg-white text-softblack-secondary border-softblack-border hover:bg-offwhite'
                  } ${isOffDuty ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {opt === 'ANY' ? 'Any' : opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary flex-1">
            {t.cancel}
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 font-bold">
            {loading ? <Spinner size="sm" /> : t.confirm}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Reception() {
  const { t, lang } = useLang();
  const { logout } = useAuth();
  const api = useApi();
  const navigate = useNavigate();
  const { connected } = useSocket();

  const [queue, setQueue]         = useState({ waiting: [], active: [] });
  const [barbers, setBarbers]     = useState([]);
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError]         = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [q, bbs, svcs] = await Promise.all([
        api.get('/api/queue'),
        api.get('/api/barbers'),
        api.get('/api/services'),
      ]);
      setQueue(q);
      setBarbers(bbs);
      setServices(svcs);
      setError(null);
    } catch (e) {
      if (e.message?.includes('expired')) { logout(); navigate('/login'); return; }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api, logout, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useSocketEvent('queue:updated', () => { if (!loading) fetchAll(); });
  useSocketEvent('connect', () => { if (!loading) fetchAll(); });

  async function doAction(key, fn) {
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      await fn();
      await fetchAll();
      setError(null);
    } catch (e) {
      setError(e.message);
      await fetchAll();
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
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

  const activeByBarber = {};
  for (const e of queue.active) {
    if (e.assignedBarber) activeByBarber[e.assignedBarber] = e;
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <Header>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWalkinOpen(true)}
            className="btn-primary text-xs font-bold px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-subtle"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.reception.addWalkin}</span>
          </button>
        </div>
      </Header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        <StaleWarning visible={!connected} />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Title & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-softblack tracking-tight font-display">
              {t.reception.title}
            </h1>
            <p className="text-xs text-softblack-muted mt-0.5">{t.reception.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-pista-light px-4 py-2 rounded-2xl border border-pista/60 flex items-center gap-2">
              <Users className="w-4 h-4 text-deepgreen" />
              <span className="text-xs font-bold text-deepgreen">
                {queue.waiting.length} Waiting
              </span>
            </div>
            <div className="bg-white px-4 py-2 rounded-2xl border border-softblack-border/80 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-softblack-muted" />
              <span className="text-xs font-bold text-softblack">
                {queue.active.length} In-Chair / Called
              </span>
            </div>
          </div>
        </div>

        {/* Barber Chairs & Call Next Section */}
        <div>
          <h2 className="text-xs font-bold text-softblack uppercase tracking-wider mb-3">
            Stylist Workstations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BARBERS.map((name) => {
              const b = barbers.find((x) => x.name === name);
              const current = activeByBarber[name];
              const hasEligible = queue.waiting.some((e) => e.barberPref === name || e.barberPref === 'ANY');
              const canCall = b?.onDuty && b.status === 'AVAILABLE' && hasEligible;

              return (
                <div key={name} className="bg-white rounded-3xl p-5 border border-softblack-border/80 shadow-subtle space-y-4 flex flex-col justify-between">
                  <div>
                    {/* Stylist Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-softblack-border/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-offwhite border border-softblack-border flex items-center justify-center font-bold text-deepgreen text-sm">
                          {name[0]}
                        </div>
                        <div>
                          <p className="font-extrabold text-softblack text-base">{name}</p>
                          <p className="text-[11px] text-softblack-muted">Chair Station</p>
                        </div>
                      </div>
                      {b && <StatusBadge status={b.status} type="barber" />}
                    </div>

                    {/* Current Client Status in Chair */}
                    <div className="mt-3">
                      {current ? (
                        <div className="bg-pista-light p-3.5 rounded-2xl border border-pista space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-deepgreen text-sm">
                              Token #{current.tokenNumber}
                            </span>
                            <StatusBadge status={current.status} />
                          </div>
                          <p className="text-xs font-bold text-softblack">{current.customerName}</p>
                          <p className="text-[11px] text-softblack-secondary">
                            {current.services.map(s => lang === 'gu' ? s.nameGu : s.nameEn).join(', ')}
                          </p>
                        </div>
                      ) : (
                        <div className="py-5 text-center text-xs text-softblack-muted bg-offwhite rounded-2xl border border-softblack-border/40">
                          {b?.onDuty ? (
                            hasEligible ? 'Station available for call' : t.reception.noEligible
                          ) : (
                            'Stylist currently off-duty'
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call Next Button */}
                  <button
                    disabled={!canCall || actionLoading[`call-${name}`]}
                    onClick={() => doAction(`call-${name}`, () => api.post('/api/queue/call-next', { barberName: name }))}
                    className="btn-primary w-full text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    {actionLoading[`call-${name}`] ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{t.reception.callNext}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Calls & In-Chair Section */}
        {queue.active.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-softblack uppercase tracking-wider mb-3">
              {t.reception.activeCalls}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {queue.active.map((e) => {
                const calledMins = e.calledAt ? Math.floor((Date.now() - new Date(e.calledAt)) / 60000) : 0;
                const canNoShow = e.status === 'CALLED' && calledMins >= 10;

                return (
                  <div key={e.id} className="bg-white rounded-2xl p-4 border border-softblack-border/80 shadow-subtle flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-pista-light text-deepgreen flex items-center justify-center font-extrabold text-base font-display shrink-0">
                        #{e.tokenNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-softblack text-sm truncate">{e.customerName}</p>
                        <p className="text-xs text-softblack-muted">
                          {e.assignedBarber} &bull; Called {elapsed(e.calledAt)} ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={e.status} />
                      {e.status === 'CALLED' && (
                        <button
                          disabled={!canNoShow || actionLoading[`ns-${e.id}`]}
                          onClick={() => doAction(`ns-${e.id}`, () => api.post(`/api/queue/no-show/${e.id}`))}
                          className="btn-danger text-xs px-3 py-1.5 rounded-xl min-h-[36px]"
                          title={canNoShow ? t.reception.noShow : t.reception.noShowInfo}
                        >
                          {actionLoading[`ns-${e.id}`] ? <Spinner size="sm" /> : t.reception.noShow}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Waiting Queue List Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-softblack uppercase tracking-wider">
              {t.reception.waitingList} ({queue.waiting.length})
            </h2>
            <span className="text-[11px] text-amber-800 font-medium">
              * Highlighted in amber if waiting &gt; 60 mins
            </span>
          </div>

          {queue.waiting.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-softblack-border/80 shadow-subtle">
              <Users className="w-8 h-8 text-pista mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-softblack">{t.reception.noWaiting}</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-softblack-border/80 shadow-subtle overflow-hidden">
              <div className="divide-y divide-softblack-border/60">
                {queue.waiting.map((e, idx) => {
                  const waitMins = Math.floor((Date.now() - new Date(e.joinedAt)) / 60000);
                  const isOver60 = waitMins >= 60;

                  return (
                    <div
                      key={e.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isOver60 ? 'bg-amber-50/60' : 'hover:bg-offwhite/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-softblack-muted w-5 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-offwhite border border-softblack-border flex items-center justify-center font-extrabold text-softblack text-sm shrink-0">
                          #{e.tokenNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-softblack text-sm truncate">{e.customerName}</p>
                            {e.isWalkin && (
                              <span className="badge bg-neutral-100 text-neutral-600 border-neutral-200 text-[10px]">
                                Walk-in
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-softblack-muted truncate mt-0.5">
                            {e.services.map(s => lang === 'gu' ? s.nameGu : s.nameEn).join(', ')} &bull; {e.barberPref === 'ANY' ? t.any : e.barberPref}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <span className={`text-xs font-semibold ${isOver60 ? 'text-amber-700' : 'text-softblack-muted'}`}>
                          {elapsed(e.joinedAt)}
                        </span>
                        <button
                          disabled={actionLoading[`cancel-${e.id}`]}
                          onClick={() => doAction(`cancel-${e.id}`, () => api.post(`/api/queue/cancel/${e.id}`))}
                          className="btn-secondary text-xs px-3 py-1.5 rounded-xl hover:border-red-300 hover:text-red-700 min-h-[36px]"
                        >
                          {actionLoading[`cancel-${e.id}`] ? <Spinner size="sm" /> : t.reception.cancelEntry}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Walk-in Registration Modal */}
      <WalkinModal
        open={walkinOpen}
        onClose={() => setWalkinOpen(false)}
        onSuccess={() => fetchAll()}
        t={t}
        lang={lang}
        services={services}
        barbers={barbers}
        api={api}
      />
    </div>
  );
}
