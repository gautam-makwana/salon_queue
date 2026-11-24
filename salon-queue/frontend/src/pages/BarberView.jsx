// src/pages/BarberView.jsx
// Screen 5: /barber/:name — Barber manages their own station.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useSocket } from '../context/SocketContext';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { StaleWarning } from '../components/StaleWarning';
import { Spinner } from '../components/ui/Spinner';

function useElapsedTimer(startDate) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startDate) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startDate)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startDate]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function BarberView() {
  const { name } = useParams();
  const { t, lang } = useLang();
  const { logout, staff } = useAuth();
  const api = useApi();
  const navigate = useNavigate();
  const { connected } = useSocket();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState({});

  const timer = useElapsedTimer(data?.current?.startedAt);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get(`/api/barbers/${name}/current`);
      setData(d);
      setError(null);
    } catch (e) {
      if (e.status === 403 || e.status === 401) { logout(); navigate('/login'); return; }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api, name, logout, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSocketEvent('queue:updated', () => { if (!loading) fetchData(); });
  useSocketEvent('connect', () => { if (!loading) fetchData(); });

  async function doAction(key, fn) {
    setBusy((p) => ({ ...p, [key]: true }));
    try { await fn(); await fetchData(); setError(null); }
    catch (e) { setError(e.message); }
    finally { setBusy((p) => ({ ...p, [key]: false })); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  const barber  = data?.barber;
  const current = data?.current;
  const next    = data?.next;
  const isOffDuty  = !barber?.onDuty;
  const isOnBreak  = barber?.status === 'ON_BREAK';
  const isCalled   = current?.status === 'CALLED';
  const isInChair  = current?.status === 'IN_CHAIR';

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <div className="flex items-center gap-2">
          <span className="text-charcoal-200 font-medium text-sm">{name}</span>
          {barber && <StatusBadge status={barber.status} type="barber" />}
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-secondary text-sm px-3 py-2 min-h-[36px]">
          {t.barber.signOut}
        </button>
      </Header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <StaleWarning visible={!connected} />

        {error && (
          <div className="card border border-red-700/40 mb-4 text-red-300 text-sm">{error}</div>
        )}

        {isOffDuty ? (
          <div className="card text-center py-10">
            <p className="text-2xl mb-2">🌙</p>
            <p className="text-charcoal-300">{t.barber.offDuty}</p>
          </div>
        ) : (
          <>
            {/* Current customer */}
            <div className="card-gold mb-4">
              <h2 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-3">
                {t.barber.current}
              </h2>

              {!current ? (
                <p className="text-charcoal-300 text-center py-4">{t.barber.noCustomer}</p>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-3xl font-black text-gold">#{current.tokenNumber}</p>
                      <p className="text-white font-semibold">{current.customerName}</p>
                    </div>
                    <StatusBadge status={current.status} />
                  </div>
                  <ul className="mb-3 space-y-1">
                    {current.services.map((s, i) => (
                      <li key={i} className="text-sm text-charcoal-200 flex justify-between">
                        <span>{lang==='gu'?s.nameGu:s.nameEn}</span>
                        <span className="text-charcoal-400">{s.durationMin}m</span>
                      </li>
                    ))}
                  </ul>
                  {isInChair && (
                    <div className="text-center bg-charcoal-800 rounded-lg py-2 mb-3">
                      <p className="text-xs text-charcoal-400">{t.barber.timer}</p>
                      <p className="text-2xl font-mono font-bold text-gold">{timer}</p>
                    </div>
                  )}
                </>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  disabled={!isCalled || busy.start}
                  onClick={() => doAction('start', () => api.post(`/api/barbers/${name}/start`))}
                  className="btn-primary flex-1"
                >
                  {busy.start ? <Spinner size="sm" /> : t.barber.start}
                </button>
                <button
                  disabled={!isInChair || busy.done}
                  onClick={() => doAction('done', () => api.post(`/api/barbers/${name}/done`))}
                  className="btn-secondary flex-1"
                >
                  {busy.done ? <Spinner size="sm" /> : t.barber.done}
                </button>
              </div>
            </div>

            {/* Break toggle */}
            <button
              disabled={!!current || busy.break}
              onClick={() => doAction('break', () => api.post(`/api/barbers/${name}/break`))}
              className={`w-full mb-4 ${isOnBreak ? 'btn-primary' : 'btn-secondary'}`}
            >
              {busy.break ? <Spinner size="sm" /> : isOnBreak ? t.barber.endBreak : t.barber.onBreak}
            </button>

            {/* Next customer preview */}
            {next && (
              <div className="card">
                <h3 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">{t.barber.nextFor}</h3>
                <p className="text-gold font-bold">#{next.tokenNumber}</p>
                <p className="text-xs text-charcoal-400">
                  {next.services.map(s=>lang==='gu'?s.nameGu:s.nameEn).join(', ')}
                  {next.barberPref !== 'ANY' && ` · ${next.barberPref}`}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
