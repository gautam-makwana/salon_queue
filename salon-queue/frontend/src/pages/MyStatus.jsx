// src/pages/MyStatus.jsx
// Screen 3: /status/:id — Customer tracks own queue spot.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useSocket } from '../context/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { publicFetch } from '../hooks/useApi';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { StaleWarning } from '../components/StaleWarning';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';

const ACTIVE = ['WAITING', 'CALLED', 'IN_CHAIR'];

export default function MyStatus() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket();

  const [entry, setEntry]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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

  // Subscribe to private entry updates
  useEffect(() => {
    const sock = socket.current;
    if (sock && id) sock.emit('subscribe:entry', id);
    return () => { if (sock) sock.emit('unsubscribe:entry', id); };
  }, [socket, id]);

  // On queue update, re-fetch entry
  useSocketEvent('queue:updated', () => { if (!loading) fetchEntry(); });
  useSocketEvent('connect', () => { if (!loading) fetchEntry(); });

  // Vibrate + flash when status transitions to CALLED
  useEffect(() => {
    if (!entry) return;
    if (prevStatus.current !== 'CALLED' && entry.status === 'CALLED') {
      setFlashCalled(true);
      setTimeout(() => setFlashCalled(false), 5000);
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-300 text-center">{t.status?.invalidLink}</p>
        <button onClick={() => navigate('/')} className="btn-primary">{t.status?.goHome}</button>
      </div>
    );
  }

  const isActive   = ACTIVE.includes(entry?.status);
  const isCalled   = entry?.status === 'CALLED';
  const isInChair  = entry?.status === 'IN_CHAIR';
  const isDone     = entry?.status === 'DONE';
  const isCancelled = ['CANCELLED', 'NO_SHOW'].includes(entry?.status);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${flashCalled ? 'bg-gold/10' : ''}`}>
      <Header showHome />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <StaleWarning visible={!connected} />

        {/* Token display */}
        <div className={`card-gold text-center py-8 mb-6 ${flashCalled ? 'flash-gold' : ''}`}>
          <p className="text-sm text-charcoal-400 uppercase tracking-wider mb-1">{t.status?.token}</p>
          <p className="text-7xl font-black text-gold mb-3">S-{entry?.tokenNumber}</p>
          <StatusBadge status={entry?.status} />

          {isCalled && (
            <div className="mt-4 p-3 bg-gold/20 rounded-xl border border-gold/40">
              <p className="text-gold font-bold text-lg">{t.status?.calledAlert}</p>
              {entry.assignedBarber && (
                <p className="text-charcoal-200 text-sm mt-1">
                  {t.status?.barberWaiting(entry.assignedBarber)}
                </p>
              )}
            </div>
          )}

          {isInChair && (
            <p className="text-green-300 mt-3 font-medium">{t.status?.serviceInProgress}</p>
          )}

          {isDone && (
            <p className="text-gold mt-3 font-semibold">{t.status?.thankYou}</p>
          )}

          {isCancelled && (
            <p className="text-charcoal-300 mt-3 text-sm">
              {entry?.status === 'NO_SHOW' ? t.status?.statusNoShow : t.status?.statusCancelled}
            </p>
          )}
        </div>

        {/* Position + wait (Waiting only) */}
        {entry?.status === 'WAITING' && (
          <div className="card mb-4 flex items-center justify-around text-center">
            <div>
              <p className="text-charcoal-400 text-xs uppercase tracking-wider">{t.status?.position}</p>
              <p className="text-3xl font-bold text-white mt-1">#{entry.position}</p>
              {entry.position === 2 && (
                <p className="text-amber-300 text-xs mt-1">{t.status?.comeToSalon}</p>
              )}
              {entry.position === 1 && (
                <p className="text-gold text-xs mt-1 font-semibold">{t.status?.youreNext}</p>
              )}
            </div>
            <div className="w-px h-12 bg-charcoal-600" />
            <div>
              <p className="text-charcoal-400 text-xs uppercase tracking-wider">{t.status?.estimatedWait}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {entry.estimateMin != null ? `${entry.estimateMin}` : '—'}
              </p>
              {entry.estimateMin != null && (
                <p className="text-charcoal-400 text-xs">{t.status?.minutes}</p>
              )}
            </div>
          </div>
        )}

        {/* Services */}
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-3">
            {t.status?.services}
          </h3>
          <ul className="space-y-2">
            {entry?.services?.map((s, i) => (
              <li key={i} className="flex justify-between text-sm text-charcoal-200">
                <span>{lang === 'gu' ? s.nameGu : s.nameEn}</span>
                <span className="text-charcoal-400">{s.durationMin} min</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-charcoal-600 mt-3 pt-2 flex justify-between text-xs text-charcoal-400">
            <span>{t.status?.preferredBarber}: {entry?.barberPref === 'ANY' ? t.status?.any : entry?.barberPref}</span>
            {entry?.assignedBarber && (
              <span>{t.status?.assignedBarber}: {entry.assignedBarber}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {entry?.status === 'WAITING' && (
          <button
            onClick={() => setCancelOpen(true)}
            className="btn-danger w-full"
          >
            {t.status?.cancelSpot}
          </button>
        )}

        {isCancelled && (
          <button onClick={() => navigate('/join')} className="btn-primary w-full">
            {t.status?.joinAgain}
          </button>
        )}
      </main>

      {/* Cancel confirmation modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t.status?.cancelSpot}
      >
        <p className="text-charcoal-200 mb-2">{t.status?.cancelConfirm}</p>
        <p className="text-charcoal-400 text-sm mb-6">{t.status?.cancelWarning}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setCancelOpen(false)}
            className="btn-secondary flex-1"
            disabled={cancelling}
          >
            {t.back}
          </button>
          <button
            onClick={handleCancel}
            className="btn-danger flex-1"
            disabled={cancelling}
          >
            {cancelling ? <Spinner size="sm" /> : t.confirm}
          </button>
        </div>
      </Modal>
    </div>
  );
}
