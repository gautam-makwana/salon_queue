// src/pages/Display.jsx
// Screen 6: /display — Public TV waiting area display (no PII).

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import { useSocket } from '../context/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { publicFetch } from '../hooks/useApi';
import { StatusBadge } from '../components/StatusBadge';

function initials(name) { return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return ()=>clearInterval(id); }, []);
  return <span className="font-mono">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>;
}

export default function Display() {
  const { t } = useLang();
  const { connected } = useSocket();

  const [state, setState]       = useState(null);
  const [flashToken, setFlashToken] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevCalled   = useRef(new Set());
  const audioCtxRef  = useRef(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await publicFetch('GET', '/api/queue/summary');
      setState(data);
    } catch { /* show stale */ }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  function playChime() {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    } catch { /* browser policy */ }
  }

  useSocketEvent('queue:updated', (data) => {
    if (!data) { fetchState(); return; }
    setState(prev => ({ ...prev, ...data, barbers: data.barbers, publicWaiting: data.publicWaiting, activeByBarber: data.activeByBarber }));

    // Detect newly called tokens
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
    <div className="min-h-screen bg-charcoal-900 text-white flex flex-col p-6 select-none">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gold tracking-tight">✂ Royal Cut</h1>
          <p className="text-charcoal-400 text-sm mt-0.5">Queue Display</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-3xl font-mono font-bold text-white"><Clock /></p>
            <p className={`text-xs mt-0.5 ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? '● Live' : t.display.connectionLost}
            </p>
          </div>
          {/* Sound toggle */}
          <button
            onClick={() => { setSoundEnabled(p=>!p); if (!audioCtxRef.current) audioCtxRef.current = new AudioContext(); }}
            className={`text-xs px-3 py-2 rounded-lg border transition-all min-h-[44px] ${
              soundEnabled ? 'border-gold text-gold bg-gold/10' : 'border-charcoal-600 text-charcoal-400'
            }`}
          >
            {soundEnabled ? t.display.soundEnabled : t.display.enableSound}
          </button>
        </div>
      </header>

      {!connected && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-300 rounded-xl px-4 py-2 mb-6 text-center font-semibold">
          {t.display.stale}
        </div>
      )}

      {/* Barber stations */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {barbers.map((b) => {
          const entry = activeByBarber[b.name];
          const isFlash = entry?.tokenNumber === flashToken;
          return (
            <div key={b.name} className={`rounded-2xl p-5 border transition-all duration-500 ${
              isFlash ? 'bg-gold/20 border-gold flash-gold' :
              b.status === 'AVAILABLE' ? 'bg-charcoal-800 border-charcoal-600' :
              b.status === 'BUSY'      ? 'bg-charcoal-700 border-gold/40' :
              'bg-charcoal-800 border-charcoal-700'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center">
                  <span className="text-gold font-black text-xl">{initials(b.name)}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{b.name}</p>
                  <StatusBadge status={b.status} type="barber" />
                </div>
              </div>

              {entry ? (
                <div className="text-center bg-charcoal-900/50 rounded-xl py-4">
                  <p className="text-sm text-charcoal-400 uppercase tracking-wider">{t.display.nowServing}</p>
                  <p className="text-6xl font-black text-gold mt-1">#{entry.tokenNumber}</p>
                  <StatusBadge status={entry.status} className="mt-2" />
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-charcoal-400">{t.display.available}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next up */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-charcoal-400 uppercase tracking-wider mb-4">{t.display.nextUp}</h2>
        {waiting.length === 0 ? (
          <p className="text-charcoal-500 text-center text-2xl py-8">{t.display.noWaiting}</p>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {waiting.map((e, i) => (
              <div key={e.tokenNumber} className={`rounded-xl p-4 text-center border ${
                i === 0 ? 'bg-charcoal-700 border-gold/40' : 'bg-charcoal-800 border-charcoal-700'
              }`}>
                <p className="text-xs text-charcoal-400 uppercase">{e.position}</p>
                <p className={`font-black ${i === 0 ? 'text-5xl text-gold' : 'text-4xl text-white'} mt-1`}>
                  #{e.tokenNumber}
                </p>
                {e.barberPref && e.barberPref !== 'ANY' && (
                  <p className="text-xs text-charcoal-400 mt-1">{e.barberPref}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
