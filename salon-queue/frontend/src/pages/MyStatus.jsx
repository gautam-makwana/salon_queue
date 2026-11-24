// src/pages/MyStatus.jsx
// Screen 3: /status/:id — Minimalist Queue Pass with Pista wait indicator and alerts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useSocket } from '../context/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { publicFetch } from '../hooks/useApi';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { StaleWarning } from '../components/StaleWarning';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import {
  Clock, Scissors, User, Sparkles, CheckCircle2,
  AlertTriangle, ArrowLeft, RefreshCw, XCircle, BellRing
} from 'lucide-react';

const ACTIVE = ['WAITING', 'CALLED', 'IN_CHAIR'];

export default function MyStatus() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const [entry, setEntry]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [cancelOpen, setCancelOpen]   = useState(false);
  const [cancelling, setCancelling]   = useState(false);
  const [flashCalled, setFlashCalled] = useState(false);
  const prevStatus = useRef(null);

  const fetchEntry = useCallback(async () => {
    try {
      const data = await publicFetch('GET', `/api/queue/entry/${id}`);
      setEntry(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  // Subscribe to private updates
  useEffect(() => {
    const sock = socket.current;
    if (sock && id) sock.emit('subscribe:entry', id);
    return () => { if (sock) sock.emit('unsubscribe:entry', id); };
  }, [socket, id]);

  useSocketEvent('queue:updated', () => { if (!loading) fetchEntry(); });
  useSocketEvent('connect', () => { if (!loading) fetchEntry(); });

  // Trigger vibration & notification when Called
  useEffect(() => {
    if (!entry) return;
    if (prevStatus.current !== 'CALLED' && entry.status === 'CALLED') {
      setFlashCalled(true);
      setTimeout(() => setFlashCalled(false), 6000);
      if (navigator.vibrate) {
        try { navigator.vibrate([300, 100, 300]); } catch { /* ignore */ }
      }
    }
    prevStatus.current = entry.status;
  }, [entry?.status]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await publicFetch('DELETE', `/api/queue/entry/${id}`);
      setCancelOpen(false);
      await fetchEntry();
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(false);
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

  if (error && !entry) {
    return (
      <div className="min-h-screen bg-offwhite flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-softblack-border shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-softblack">{t.status.invalidLink}</h1>
          <p className="text-xs text-softblack-muted">The ticket ID might be wrong or expired.</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            {t.status.goHome}
          </button>
        </div>
      </div>
    );
  }

  const isCalled    = entry?.status === 'CALLED';
  const isInChair   = entry?.status === 'IN_CHAIR';
  const isDone      = entry?.status === 'DONE';
  const isCancelled = ['CANCELLED', 'NO_SHOW'].includes(entry?.status);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${flashCalled ? 'bg-pista-light' : 'bg-offwhite'}`}>
      <Header />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-6">
        <StaleWarning visible={!connected} />

        {/* Turn Called Alert Notification */}
        {isCalled && (
          <div className="bg-pista text-softblack rounded-3xl p-5 border-2 border-deepgreen shadow-card flex items-start gap-4 animate-bounce">
            <div className="w-10 h-10 rounded-2xl bg-deepgreen text-white flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold text-base leading-tight">{t.status.calledAlert}</p>
              <p className="text-xs text-softblack-secondary mt-1 font-semibold">
                {entry.assignedBarber ? t.status.barberWaiting(entry.assignedBarber) : 'Stylist station ready'}
              </p>
            </div>
          </div>
        )}

        {/* Pass Main Card */}
        <div className="bg-white rounded-3xl p-7 border border-softblack-border/80 shadow-card text-center relative overflow-hidden">
          {/* Subtle Top Pista Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-pista"></div>

          <div className="flex items-center justify-between text-xs text-softblack-muted mb-4 pt-1">
            <span className="font-bold tracking-wider uppercase">{t.status.title}</span>
            <StatusBadge status={entry?.status} />
          </div>

          {/* Large Token Display */}
          <div className="my-5">
            <p className="text-xs font-semibold text-softblack-muted uppercase tracking-widest">{t.status.token}</p>
            <p className="text-6xl sm:text-7xl font-black text-softblack tracking-tight font-display mt-1">
              S-{entry?.tokenNumber}
            </p>
            <p className="text-xs font-semibold text-deepgreen mt-1">
              {entry?.customerName}
            </p>
          </div>

          {/* Dynamic Circular Waiting Time Indicator for WAITING */}
          {entry?.status === 'WAITING' && (
            <div className="my-6 p-5 bg-pista-light rounded-3xl border border-pista/80 flex items-center justify-around gap-4">
              <div className="text-center">
                <p className="text-[11px] font-bold text-deepgreen uppercase tracking-wider">{t.status.position}</p>
                <p className="text-3xl font-extrabold text-softblack font-display mt-0.5">
                  #{entry?.position ?? 1}
                </p>
                {entry?.position === 2 && (
                  <p className="text-[11px] font-bold text-amber-800 mt-0.5">{t.status.comeToSalon}</p>
                )}
                {entry?.position === 1 && (
                  <p className="text-[11px] font-bold text-deepgreen mt-0.5">{t.status.youreNext}</p>
                )}
              </div>

              <div className="w-px h-10 bg-pista-border"></div>

              <div className="text-center">
                <p className="text-[11px] font-bold text-deepgreen uppercase tracking-wider">{t.status.estimatedWait}</p>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-3xl font-extrabold text-softblack font-display">
                    {entry?.estimateMin != null ? entry.estimateMin : '0'}
                  </span>
                  <span className="text-xs text-deepgreen font-semibold">{t.status.minutes}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Message Banners */}
          {isInChair && (
            <div className="my-4 p-4 bg-pista-light rounded-2xl border border-pista text-deepgreen text-xs font-bold flex items-center justify-center gap-2">
              <Scissors className="w-4 h-4" />
              <span>{t.status.serviceInProgress}</span>
            </div>
          )}

          {isDone && (
            <div className="my-4 p-4 bg-offwhite rounded-2xl border border-softblack-border text-softblack text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-deepgreen" />
              <span>{t.status.thankYou}</span>
            </div>
          )}

          {isCancelled && (
            <div className="my-4 p-4 bg-neutral-100 rounded-2xl text-softblack-muted text-xs font-semibold">
              {entry?.status === 'NO_SHOW' ? t.status.statusNoShow : t.status.statusCancelled}
            </div>
          )}

          {/* Booked Services Breakdown */}
          <div className="text-left pt-5 border-t border-softblack-border/60 space-y-3">
            <p className="text-xs font-bold text-softblack uppercase tracking-wider">{t.status.services}</p>
            <ul className="space-y-2">
              {entry?.services?.map((s, idx) => (
                <li key={idx} className="flex justify-between items-center text-xs text-softblack-secondary">
                  <span className="font-medium">{lang === 'gu' ? s.nameGu : s.nameEn}</span>
                  <span className="text-softblack-muted font-medium">{s.durationMin}m &bull; ₹{s.price}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 flex justify-between text-xs text-softblack-muted border-t border-softblack-border/40">
              <span>{t.status.preferredBarber}:</span>
              <span className="font-bold text-softblack">
                {entry?.barberPref === 'ANY' ? t.status.any : entry?.barberPref}
              </span>
            </div>

            {entry?.assignedBarber && (
              <div className="flex justify-between text-xs text-deepgreen font-semibold">
                <span>{t.status.assignedBarber}:</span>
                <span className="font-bold">{entry.assignedBarber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {entry?.status === 'WAITING' && (
            <button
              onClick={() => setCancelOpen(true)}
              className="btn-danger w-full text-xs font-bold py-3.5 rounded-2xl"
            >
              {t.status.cancelSpot}
            </button>
          )}

          {isCancelled && (
            <button
              onClick={() => navigate('/join')}
              className="btn-primary w-full text-xs font-bold py-3.5 rounded-2xl"
            >
              {t.status.joinAgain}
            </button>
          )}

          <button
            onClick={fetchEntry}
            className="btn-secondary w-full text-xs py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-deepgreen" />
            <span>Refresh Status</span>
          </button>
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t.status.cancelSpot}
      >
        <div className="space-y-4">
          <p className="text-sm text-softblack font-medium">{t.status.cancelConfirm}</p>
          <p className="text-xs text-softblack-muted">{t.status.cancelWarning}</p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="btn-secondary flex-1"
              disabled={cancelling}
            >
              {t.back}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-danger flex-1"
              disabled={cancelling}
            >
              {cancelling ? <Spinner size="sm" /> : t.confirm}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
