// src/pages/Reception.jsx
// Screen 4: /reception — Receptionist dashboard.

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

const BARBERS = ['Ravi', 'Amit', 'Imran'];

function elapsed(dateStr) {
  if (!dateStr) return '—';
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function WalkinModal({ open, onClose, onSuccess, t, lang, services, barbers, api }) {
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [barberPref, setBarberPref]   = useState('ANY');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  function reset() { setName(''); setPhone(''); setSelectedIds([]); setBarberPref('ANY'); setErrors({}); setErr(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = t.join.errors.nameRequired;
    if (!/^\d{10}$/.test(phone)) errs.phone = t.join.errors.phoneInvalid;
    if (!selectedIds.length) errs.services = t.join.errors.selectService;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErr(null);
    try {
      const data = await api.post('/api/queue/walkin', { customerName: name.trim(), phone, serviceIds: selectedIds, barberPref });
      onSuccess(data);
      reset();
      onClose();
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t.reception.walkinTitle}>
      {err && <p className="text-red-300 text-sm mb-3">{err}</p>}
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-300 mb-1">{t.join.name}</label>
          <input className="input text-sm py-2" value={name} onChange={e => { setName(e.target.value); setErrors(x=>({...x,name:null})); }} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-300 mb-1">{t.join.phone}</label>
          <input className="input text-sm py-2" inputMode="numeric" maxLength={10} value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,'')); setErrors(x=>({...x,phone:null})); }} />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-300 mb-1">{t.join.services}</label>
          <div className="grid grid-cols-2 gap-2">
            {services.map(s => (
              <button key={s.id} type="button" onClick={() => setSelectedIds(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : p.length<3?[...p,s.id]:p)}
                className={`card text-left py-2 text-xs transition-all ${selectedIds.includes(s.id)?'border-2 border-gold':'border border-charcoal-600'}`}>
                <p className="font-medium">{lang==='gu'?s.nameGu:s.nameEn}</p>
                <p className="text-charcoal-400">{s.durationMin}m · ₹{s.price}</p>
              </button>
            ))}
          </div>
          {errors.services && <p className="field-error">{errors.services}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-300 mb-1">{t.join.barberPref}</label>
          <div className="flex gap-2 flex-wrap">
            {['ANY', ...BARBERS].map(opt => {
              const b = barbers.find(x=>x.name===opt);
              return <button key={opt} type="button" onClick={()=>setBarberPref(opt)} disabled={b && !b.onDuty}
                className={`btn-secondary text-xs px-3 py-1 min-h-[32px] ${barberPref===opt?'border-gold text-gold':''} ${b&&!b.onDuty?'opacity-40':''}`}>
                {opt==='ANY'?t.join.anyBarber:opt}
              </button>;
            })}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary flex-1">{t.cancel}</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">{loading?<Spinner size="sm"/>:t.confirm}</button>
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

  const [queue, setQueue]       = useState({ waiting: [], active: [] });
  const [barbers, setBarbers]   = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError]       = useState(null);

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
    try { await fn(); await fetchAll(); setError(null); }
    catch (e) { setError(e.message); await fetchAll(); }
    finally { setActionLoading((p) => ({ ...p, [key]: false })); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  const activeByBarber = {};
  for (const e of queue.active) if (e.assignedBarber) activeByBarber[e.assignedBarber] = e;

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <span className="text-charcoal-300 text-sm hidden sm:inline">
          {t.reception.waitingList}: {queue.waiting.length}
        </span>
        <button onClick={() => setWalkinOpen(true)} className="btn-primary text-sm px-3 py-2 min-h-[36px]">
          + {t.reception.addWalkin}
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-secondary text-sm px-3 py-2 min-h-[36px]">
          {t.reception.signOut}
        </button>
      </Header>

      <main className="flex-1 px-4 py-4 max-w-5xl mx-auto w-full">
        <StaleWarning visible={!connected} />
        {error && <div className="card border border-red-700/40 mb-3 text-red-300 text-sm">{error}</div>}

        {/* Barber cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {BARBERS.map((name) => {
            const b = barbers.find((x) => x.name === name);
            const current = activeByBarber[name];
            const hasEligible = queue.waiting.some((e) => e.barberPref === name || e.barberPref === 'ANY');
            const canCall = b?.onDuty && b.status === 'AVAILABLE' && hasEligible;

            return (
              <div key={name} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs">
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{name}</p>
                    {b && <StatusBadge status={b.status} type="barber" />}
                  </div>
                </div>

                {current && (
                  <div className="bg-charcoal-800 rounded-lg p-2 mb-2 text-xs text-charcoal-200">
                    <p>#{current.tokenNumber} · {current.customerName}</p>
                    <p className="text-charcoal-400">{current.services.map(s => lang==='gu'?s.nameGu:s.nameEn).join(', ')}</p>
                    <StatusBadge status={current.status} className="mt-1" />
                  </div>
                )}

                {!current && b?.onDuty && (
                  <p className="text-xs text-charcoal-400 mb-2">{t.reception.noEligible}</p>
                )}

                <button
                  disabled={!canCall || actionLoading[`call-${name}`]}
                  onClick={() => doAction(`call-${name}`, () => api.post('/api/queue/call-next', { barberName: name }))}
                  className="btn-primary w-full text-sm py-2"
                >
                  {actionLoading[`call-${name}`] ? <Spinner size="sm" /> : t.reception.callNext}
                </button>
              </div>
            );
          })}
        </div>

        {/* Active calls */}
        {queue.active.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">{t.reception.activeCalls}</h2>
            <div className="space-y-2">
              {queue.active.map((e) => {
                const calledMins = e.calledAt ? Math.floor((Date.now() - new Date(e.calledAt)) / 60000) : 0;
                const canNoShow = e.status === 'CALLED' && calledMins >= 10;
                return (
                  <div key={e.id} className="card flex items-center gap-3">
                    <span className="text-gold font-bold text-lg w-12 shrink-0">#{e.tokenNumber}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white">{e.customerName}</p>
                      <p className="text-xs text-charcoal-400">{e.assignedBarber} · {elapsed(e.calledAt)}</p>
                    </div>
                    <StatusBadge status={e.status} />
                    {e.status === 'CALLED' && (
                      <button
                        disabled={!canNoShow || actionLoading[`ns-${e.id}`]}
                        onClick={() => doAction(`ns-${e.id}`, () => api.post(`/api/queue/no-show/${e.id}`))}
                        className="btn-danger text-xs px-3 py-2 min-h-[36px]"
                        title={canNoShow ? t.reception.noShow : t.reception.noShowInfo}
                      >
                        {actionLoading[`ns-${e.id}`] ? <Spinner size="sm" /> : t.reception.noShow}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Waiting list */}
        <div>
          <h2 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">{t.reception.waitingList}</h2>
          {queue.waiting.length === 0 ? (
            <div className="card text-center text-charcoal-400">{t.reception.noWaiting}</div>
          ) : (
            <div className="space-y-2">
              {queue.waiting.map((e, idx) => {
                const waitMins = Math.floor((Date.now() - new Date(e.joinedAt)) / 60000);
                const longWait = waitMins >= 60;
                return (
                  <div key={e.id} className={`card flex items-center gap-3 ${longWait ? 'border border-amber-500/50' : ''}`}>
                    <span className="text-charcoal-300 text-sm w-5 shrink-0">{idx + 1}</span>
                    <span className="text-gold font-bold w-12 shrink-0">#{e.tokenNumber}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white">{e.customerName}</p>
                      <p className="text-xs text-charcoal-400">
                        {e.services.map(s=>lang==='gu'?s.nameGu:s.nameEn).join(', ')} · {e.barberPref === 'ANY' ? t.any : e.barberPref}
                      </p>
                    </div>
                    <span className={`text-xs ${longWait ? 'text-amber-400' : 'text-charcoal-400'}`}>{elapsed(e.joinedAt)}</span>
                    <button
                      disabled={actionLoading[`cancel-${e.id}`]}
                      onClick={() => doAction(`cancel-${e.id}`, () => api.post(`/api/queue/cancel/${e.id}`))}
                      className="btn-secondary text-xs px-3 py-2 min-h-[36px]"
                    >
                      {actionLoading[`cancel-${e.id}`] ? <Spinner size="sm" /> : t.reception.cancelEntry}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <WalkinModal
        open={walkinOpen}
        onClose={() => setWalkinOpen(false)}
        onSuccess={() => fetchAll()}
        t={t} lang={lang}
        services={services}
        barbers={barbers}
        api={api}
      />
    </div>
  );
}
