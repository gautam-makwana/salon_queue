// src/pages/Home.jsx
// Screen 1: / — Customer checks availability and joins.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useSocket } from '../context/SocketContext';
import { publicFetch } from '../hooks/useApi';
import { Header } from '../components/Header';
import { BarberCard } from '../components/BarberCard';
import { StaleWarning } from '../components/StaleWarning';
import { Spinner } from '../components/ui/Spinner';

export default function Home() {
  const { t } = useLang();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const [state, setState]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await publicFetch('GET', '/api/queue/summary');
      setState(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Refresh on socket queue update
  useSocketEvent('queue:updated', (data) => {
    if (data) {
      setState((prev) => ({
        ...prev,
        waitingCount: data.waitingCount,
        estimateMin:  data.globalWaitMin,
        barbers:      data.barbers,
        settings:     data.settings,
        onlineOpen:   prev?.onlineOpen, // keep — recalculate via full fetch
      }));
    }
    fetchSummary();
  });

  // Reconnect: re-fetch authoritative state
  useSocketEvent('connect', () => { if (!loading) fetchSummary(); });

  const isOpen    = state?.onlineOpen ?? false;
  const hasBarbers = state?.barbers?.some((b) => b.onDuty && b.status !== 'OFF_DUTY');

  // Determine closing-cutoff display text
  const closingTime = state?.settings?.closingTime ?? '21:00';
  const [ch, cm] = closingTime.split(':').map(Number);
  const cutoffH = cm < 30 ? ch - 1 : ch;
  const cutoffM = cm < 30 ? cm + 30 : cm - 30;
  const cutoffStr = `${String(cutoffH).padStart(2, '0')}:${String(cutoffM).padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <div className="flex items-center gap-2">
          <span className={`badge ${isOpen ? 'bg-green-900/60 text-green-300 border border-green-600/40' : 'bg-red-900/60 text-red-300 border border-red-600/40'}`}>
            {isOpen ? t.home.openLabel : t.home.closedLabel}
          </span>
          <span className="text-charcoal-400 text-xs hidden sm:inline">
            {t.home.closesAt} {closingTime}
          </span>
        </div>
      </Header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <StaleWarning visible={!connected} />

        {error && (
          <div className="card border border-red-700/40 mb-4 text-red-300 text-sm flex items-center gap-2">
            <span>⚠ {error}</span>
            <button onClick={fetchSummary} className="btn-secondary text-xs px-3 py-1 ml-auto min-h-[32px]">
              {t.retry}
            </button>
          </div>
        )}

        {/* Live summary */}
        <div className="card-gold mb-6 text-center">
          {!hasBarbers ? (
            <p className="text-charcoal-300">{t.home.noStaffWorking}</p>
          ) : state?.waitingCount === 0 ? (
            <p className="text-green-300 font-semibold">{t.home.noOneWaiting}</p>
          ) : (
            <>
              <p className="text-2xl font-bold text-white">
                {t.home.waitingCount(state?.waitingCount ?? 0)}
              </p>
              <p className="text-gold mt-1">
                {state?.estimateMin != null
                  ? t.home.estimatedWait(state.estimateMin)
                  : t.home.waitUnavailable}
              </p>
            </>
          )}
        </div>

        {/* Barber cards */}
        <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-3">
          {t.home.barbers}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {(state?.barbers ?? []).map((b) => (
            <BarberCard key={b.name} barber={b} />
          ))}
        </div>

        {/* Join button */}
        <div className="sticky bottom-4">
          {isOpen ? (
            <button
              onClick={() => navigate('/join')}
              className="btn-primary w-full text-lg py-4"
            >
              {t.home.joinQueue}
            </button>
          ) : (
            <div className="card text-center">
              <p className="text-charcoal-300 font-medium">{t.home.joiningClosed}</p>
              <p className="text-charcoal-400 text-sm mt-1">
                {t.home.closesAt} {cutoffStr}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
