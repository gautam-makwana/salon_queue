// src/pages/BarberView.jsx
// Screen 5: /barber/:name — Minimalist mobile-first chair terminal for barbers

import { useState, useEffect, useCallback } from 'react';
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
import {
  Scissors, Play, CheckCircle2, Coffee, Moon, Clock,
  User, Sparkles, AlertCircle, ArrowRight
} from 'lucide-react';

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
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function BarberView() {
  const { name } = useParams();
  const { t, lang } = useLang();
  const { logout } = useAuth();
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
    try {
      await fn();
      await fetchData();
      setError(null);
    } catch (e) {
      setError(e.message);
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

  const barber     = data?.barber;
  const current    = data?.current;
  const next       = data?.next;
  const isOffDuty  = !barber?.onDuty;
  const isOnBreak  = barber?.status === 'ON_BREAK';
  const isCalled   = current?.status === 'CALLED';
  const isInChair  = current?.status === 'IN_CHAIR';

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <Header />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        <StaleWarning visible={!connected} />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Stylist Station Header Card */}
        <div className="bg-white rounded-3xl p-5 border border-softblack-border/80 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pista-light border border-pista flex items-center justify-center font-black text-deepgreen text-base">
              {name[0]}
            </div>
            <div>
              <h1 className="font-extrabold text-softblack text-lg font-display">{t.barber.title(name)}</h1>
              <p className="text-xs text-softblack-muted">Workstation Console</p>
            </div>
          </div>
          {barber && <StatusBadge status={barber.status} type="barber" />}
        </div>

        {isOffDuty ? (
          <div className="bg-white rounded-3xl p-8 border border-softblack-border/80 shadow-subtle text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
              <Moon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-softblack">{t.barber.offDuty}</h2>
            <p className="text-xs text-softblack-muted max-w-xs mx-auto">
              You are currently marked off duty by salon management. Please contact reception to start your shift.
            </p>
          </div>
        ) : (
          <>
            {/* Active Station Card */}
            <div className="bg-white rounded-3xl p-6 border border-softblack-border/80 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-softblack-border/60 pb-3">
                <span className="text-xs font-bold text-softblack uppercase tracking-wider">
                  {t.barber.current}
                </span>
                {current && <StatusBadge status={current.status} />}
              </div>

              {!current ? (
                <div className="py-10 text-center space-y-2">
                  <Scissors className="w-8 h-8 text-pista mx-auto" />
                  <p className="text-sm font-bold text-softblack">{t.barber.noCustomer}</p>
                  <p className="text-xs text-softblack-muted">Reception will call the next waiting client for your chair.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-softblack-muted uppercase font-bold tracking-wider">Token</p>
                      <p className="text-5xl font-black text-softblack font-display">#{current.tokenNumber}</p>
                      <p className="text-sm font-bold text-deepgreen mt-1">{current.customerName}</p>
                    </div>
                  </div>

                  {/* Services List */}
                  <div className="bg-offwhite rounded-2xl p-4 border border-softblack-border/60 space-y-2">
                    <p className="text-[11px] font-bold text-softblack-muted uppercase tracking-wider">Requested Services</p>
                    <ul className="space-y-1.5">
                      {current.services.map((s, idx) => (
                        <li key={idx} className="flex justify-between text-xs text-softblack font-medium">
                          <span>{lang === 'gu' ? s.nameGu : s.nameEn}</span>
                          <span className="text-softblack-muted">{s.durationMin} mins</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Live Service Duration Timer (when In Chair) */}
                  {isInChair && (
                    <div className="bg-pista-light rounded-2xl p-4 text-center border border-pista/60">
                      <p className="text-[11px] font-bold text-deepgreen uppercase tracking-wider mb-1">
                        {t.barber.timer}
                      </p>
                      <p className="text-4xl font-black text-deepgreen font-mono">{timer}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      disabled={!isCalled || busy.start}
                      onClick={() => doAction('start', () => api.post(`/api/barbers/${name}/start`))}
                      className="btn-primary text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                    >
                      {busy.start ? <Spinner size="sm" /> : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>{t.barber.start}</span>
                        </>
                      )}
                    </button>

                    <button
                      disabled={!isInChair || busy.done}
                      onClick={() => doAction('done', () => api.post(`/api/barbers/${name}/done`))}
                      className="btn-dark text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                    >
                      {busy.done ? <Spinner size="sm" className="border-white" /> : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t.barber.done}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Break Toggle Button */}
            <button
              disabled={!!current || busy.break}
              onClick={() => doAction('break', () => api.post(`/api/barbers/${name}/break`))}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all shadow-subtle flex items-center justify-center gap-2 ${
                isOnBreak
                  ? 'btn-primary'
                  : 'btn-secondary hover:bg-pista-light hover:border-pista hover:text-deepgreen'
              }`}
            >
              {busy.break ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Coffee className="w-4 h-4" />
                  <span>{isOnBreak ? t.barber.endBreak : t.barber.onBreak}</span>
                </>
              )}
            </button>

            {/* Next Customer Preview */}
            {next && (
              <div className="bg-white rounded-3xl p-5 border border-softblack-border/80 shadow-subtle space-y-2">
                <div className="flex items-center justify-between text-xs text-softblack-muted">
                  <span className="font-bold uppercase tracking-wider">{t.barber.nextFor}</span>
                  <span className="font-extrabold text-deepgreen">#{next.tokenNumber}</span>
                </div>
                <p className="text-xs text-softblack-muted">
                  {next.services.map(s => lang === 'gu' ? s.nameGu : s.nameEn).join(', ')}
                  {next.barberPref !== 'ANY' && ` &bull; Prefers ${next.barberPref}`}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
