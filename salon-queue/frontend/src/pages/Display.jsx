// src/pages/Display.jsx
// Screen 6: /display — High-contrast full-screen lobby TV display (no PII, readable from distance)

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import { useSocket } from '../context/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { publicFetch } from '../hooks/useApi';
import { StatusBadge } from '../components/StatusBadge';
import { Scissors, Volume2, VolumeX, Wifi, WifiOff, Clock } from 'lucide-react';

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-softblack">
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </div>
  );
}

export default function Display() {
  const { t } = useLang();
  const { connected } = useSocket();

  const [state, setState]             = useState(null);
  const [flashToken, setFlashToken]   = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevCalled  = useRef(new Set());
  const audioCtxRef = useRef(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await publicFetch('GET', '/api/queue/summary');
      setState(data);
    } catch { /* offline cached */ }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  function playChime() {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch { /* policy */ }
  }

  useSocketEvent('queue:updated', (data) => {
    if (!data) { fetchState(); return; }
    setState((prev) => ({
      ...prev,
      ...data,
      barbers: data.barbers,
      publicWaiting: data.publicWaiting,
      activeByBarber: data.activeByBarber,
    }));

    // Detect newly called tokens for audio chime & visual flash
    const activeCalled = Object.entries(data.activeByBarber || {})
      .filter(([, e]) => e.status === 'CALLED')
      .map(([, e]) => e.tokenNumber);

    for (const tok of activeCalled) {
      if (!prevCalled.current.has(tok)) {
        setFlashToken(tok);
        setTimeout(() => setFlashToken(null), 5000);
        playChime();
      }
    }
    prevCalled.current = new Set(activeCalled);
  });

  const barbers = state?.barbers ?? [];
  const activeByBarber = state?.activeByBarber ?? {};
  const waiting = (state?.publicWaiting ?? []).slice(0, 5);

  return (
    <div className="min-h-screen bg-white text-softblack flex flex-col p-6 sm:p-10 select-none">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b-2 border-softblack-border gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pista flex items-center justify-center font-black shadow-subtle">
            <Scissors className="w-6 h-6 text-deepgreen" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-softblack tracking-tight font-display">
              {t.salonName}
            </h1>
            <p className="text-xs uppercase tracking-widest text-deepgreen font-bold">
              {t.display.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <LiveClock />
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              {connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-deepgreen animate-pulse"></span>
                  <span className="text-xs font-bold text-deepgreen">Live Sync Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-bold text-red-600">{t.display.connectionLost}</span>
                </>
              )}
            </div>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={() => {
              setSoundEnabled((p) => !p);
              if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
            }}
            className={`btn-secondary text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border-2 transition-all ${
              soundEnabled
                ? 'bg-pista-light text-deepgreen border-deepgreen font-bold'
                : 'bg-white text-softblack-muted border-softblack-border'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-deepgreen" />
                <span>{t.display.soundEnabled}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-softblack-muted" />
                <span>{t.display.enableSound}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Screen Content Grid */}
      <div className="flex-1 space-y-10">
        {/* Stylist Stations — Now Serving */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-softblack-muted">
              {t.display.nowServing}
            </h2>
            <span className="text-xs font-semibold text-deepgreen bg-pista-light px-3 py-1 rounded-full border border-pista">
              Workstation Floor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {barbers.map((b) => {
              const entry = activeByBarber[b.name];
              const isFlashing = entry?.tokenNumber === flashToken;

              return (
                <div
                  key={b.name}
                  className={`rounded-3xl p-6 sm:p-7 border-2 transition-all duration-300 ${
                    isFlashing
                      ? 'bg-pista border-deepgreen flash-pista shadow-card scale-[1.02]'
                      : entry
                      ? 'bg-pista-light/70 border-pista shadow-card'
                      : 'bg-offwhite border-softblack-border/80'
                  }`}
                >
                  {/* Stylist Name & Avatar */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-softblack-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-softblack-border flex items-center justify-center font-extrabold text-deepgreen text-lg shadow-subtle">
                        {initials(b.name)}
                      </div>
                      <div>
                        <p className="text-2xl font-black text-softblack font-display">{b.name}</p>
                        <p className="text-xs text-softblack-muted font-medium">Chair Station</p>
                      </div>
                    </div>
                    <StatusBadge status={b.status} type="barber" />
                  </div>

                  {/* Token Big Display */}
                  {entry ? (
                    <div className="text-center py-4 bg-white rounded-2xl border border-softblack-border/60 shadow-subtle">
                      <p className="text-xs font-bold text-softblack-muted uppercase tracking-wider">
                        {entry.status === 'CALLED' ? 'Called — Please Proceed' : 'In Service'}
                      </p>
                      <p className="text-6xl sm:text-7xl font-black text-softblack tracking-tight font-display my-2">
                        #{entry.tokenNumber}
                      </p>
                      <div className="inline-block">
                        <StatusBadge status={entry.status} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-base font-bold text-softblack-muted">{t.display.available}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Up Tokens Line */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-softblack-muted">
              {t.display.nextUp}
            </h2>
            <span className="text-xs text-softblack-muted">Next 5 Waiting Tokens</span>
          </div>

          {waiting.length === 0 ? (
            <div className="bg-offwhite rounded-3xl p-10 text-center border-2 border-dashed border-softblack-border">
              <p className="text-lg font-bold text-softblack-muted">{t.display.noWaiting}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {waiting.map((e, idx) => (
                <div
                  key={e.tokenNumber}
                  className={`rounded-3xl p-5 text-center border-2 transition-all ${
                    idx === 0
                      ? 'bg-pista-light border-deepgreen shadow-card'
                      : 'bg-white border-softblack-border/80 shadow-subtle'
                  }`}
                >
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/80 text-deepgreen border border-pista mb-2">
                    Position #{e.position}
                  </div>
                  <p className="text-4xl sm:text-5xl font-black text-softblack tracking-tight font-display">
                    #{e.tokenNumber}
                  </p>
                  {e.barberPref && e.barberPref !== 'ANY' && (
                    <p className="text-xs font-bold text-deepgreen mt-2 bg-white/70 py-1 rounded-xl">
                      Prefers {e.barberPref}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="mt-8 pt-4 border-t border-softblack-border/60 flex items-center justify-between text-xs text-softblack-muted">
        <span>Tokens update in real-time. Please stay in the reception lounge when you reach position 1 or 2.</span>
        <span className="font-semibold">{t.salonName} &bull; Guest Privacy Board</span>
      </footer>
    </div>
  );
}
