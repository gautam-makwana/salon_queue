// src/pages/Home.jsx
// Screen 1: / — High-end minimalist Salon Landing Page with live queue stats and stylist availability

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useSocket } from '../context/SocketContext';
import { publicFetch } from '../hooks/useApi';
import { Header } from '../components/Header';
import { BarberCard } from '../components/BarberCard';
import { StaleWarning } from '../components/StaleWarning';
import { Spinner } from '../components/ui/Spinner';
import {
  Users, Clock, Scissors, ArrowRight, ShieldCheck,
  Sparkles, CheckCircle2, ChevronRight, Tv, UserCog, CalendarClock
} from 'lucide-react';

export default function Home() {
  const { t } = useLang();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const [state, setState]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

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

  // Handle Socket.IO live updates
  useSocketEvent('queue:updated', (data) => {
    if (data) {
      setState((prev) => ({
        ...prev,
        waitingCount: data.waitingCount,
        estimateMin:  data.globalWaitMin,
        barbers:      data.barbers,
        settings:     data.settings,
      }));
    }
    fetchSummary();
  });

  useSocketEvent('connect', () => { if (!loading) fetchSummary(); });

  const isOpen = state?.onlineOpen ?? false;
  const hasBarbers = state?.barbers?.some((b) => b.onDuty && b.status !== 'OFF_DUTY');
  const closingTime = state?.settings?.closingTime ?? '21:00';

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-softblack-muted font-medium">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-softblack">
      {/* Minimal Header */}
      <Header />

      <main className="flex-1">
        {/* Offline / Stale Data Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
          <StaleWarning visible={!connected} />
          {error && (
            <div className="card bg-red-50 border border-red-200 text-red-700 text-xs font-medium mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchSummary} className="btn-secondary text-xs px-2.5 py-1 min-h-[30px]">
                {t.retry}
              </button>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <section className="relative px-4 sm:px-8 pt-6 pb-14 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading and Live Queue Card */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pista-light text-deepgreen text-xs font-bold border border-pista/60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.home.heroBadge}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-deepgreen animate-pulse"></span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-softblack tracking-tight leading-[1.1] font-display">
                {t.home.heroTitle}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-softblack-secondary leading-relaxed max-w-xl">
                {t.home.heroSubtitle}
              </p>

              {/* Live Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {/* Status Card */}
                <div className="card-offwhite p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-softblack-muted mb-1">
                    <CalendarClock className="w-4 h-4 text-deepgreen" />
                    <span>Salon Status</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-deepgreen' : 'bg-red-500'}`}></span>
                    <span className="font-extrabold text-sm sm:text-base text-softblack">
                      {isOpen ? t.home.openLabel : t.home.closedLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-softblack-muted mt-0.5">
                    {t.home.closesAt} {closingTime}
                  </p>
                </div>

                {/* Queue Count */}
                <div className="card-offwhite p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-softblack-muted mb-1">
                    <Users className="w-4 h-4 text-deepgreen" />
                    <span>{t.reception.waitingList}</span>
                  </div>
                  <p className="font-extrabold text-2xl text-softblack font-display">
                    {state?.waitingCount ?? 0}
                  </p>
                  <p className="text-[11px] text-softblack-muted mt-0.5">
                    {state?.waitingCount === 0 ? t.home.noOneWaiting : `${state?.waitingCount} waiting`}
                  </p>
                </div>

                {/* Estimated Wait */}
                <div className="card-pista p-4 rounded-2xl col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-deepgreen mb-1">
                    <Clock className="w-4 h-4 text-deepgreen" />
                    <span>Est. Wait (Any)</span>
                  </div>
                  <p className="font-extrabold text-2xl text-deepgreen font-display">
                    {state?.estimateMin != null ? `~${state.estimateMin}m` : '0m'}
                  </p>
                  <p className="text-[11px] text-deepgreen/80 font-medium mt-0.5">
                    {state?.estimateMin != null ? t.home.estimatedWait(state.estimateMin) : t.home.waitUnavailable}
                  </p>
                </div>
              </div>

              {/* Call to Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {isOpen ? (
                  <button
                    onClick={() => navigate('/join')}
                    className="btn-primary text-base font-bold py-4 px-8 rounded-2xl shadow-card inline-flex items-center justify-center gap-3 group"
                  >
                    <span>{t.home.joinQueue}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="card bg-neutral-50 border border-neutral-200 p-4 rounded-2xl text-center sm:text-left">
                    <p className="font-bold text-softblack text-sm">{t.home.joiningClosed}</p>
                    <p className="text-xs text-softblack-muted mt-0.5">{t.admin.cutoffNote}</p>
                  </div>
                )}

                <Link
                  to="/display"
                  className="btn-secondary text-sm font-semibold py-4 px-6 rounded-2xl inline-flex items-center justify-center gap-2"
                >
                  <Tv className="w-4 h-4 text-deepgreen" />
                  <span>{t.displayTv}</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Visual Feature Card & Salon Atmosphere */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-softblack-border/80 shadow-card bg-offwhite group">
                {/* Salon Image */}
                <div className="h-72 sm:h-80 w-full overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80"
                    alt="Premium Salon Interior"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-softblack/70 via-softblack/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs uppercase tracking-widest text-pista font-bold font-display">L'ÉLÉGANCE EXPERIENCE</p>
                    <p className="text-lg font-bold">Uncompromising quality and style.</p>
                  </div>
                </div>

                {/* Floating Quick Action Box */}
                <div className="p-5 bg-white space-y-3">
                  <div className="flex items-center justify-between text-xs text-softblack-muted">
                    <span className="font-semibold text-softblack uppercase tracking-wider">{t.home.quickLinks}</span>
                    <span className="text-[11px] text-deepgreen font-bold">Staff Access</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      to="/login"
                      className="btn-secondary text-xs py-2 px-2 rounded-xl flex flex-col items-center justify-center text-center hover:bg-pista-light hover:border-pista"
                    >
                      <Scissors className="w-4 h-4 text-deepgreen mb-1" />
                      <span className="text-[11px] font-semibold">Barbers</span>
                    </Link>
                    <Link
                      to="/login"
                      className="btn-secondary text-xs py-2 px-2 rounded-xl flex flex-col items-center justify-center text-center hover:bg-pista-light hover:border-pista"
                    >
                      <Users className="w-4 h-4 text-deepgreen mb-1" />
                      <span className="text-[11px] font-semibold">Reception</span>
                    </Link>
                    <Link
                      to="/login"
                      className="btn-secondary text-xs py-2 px-2 rounded-xl flex flex-col items-center justify-center text-center hover:bg-pista-light hover:border-pista"
                    >
                      <UserCog className="w-4 h-4 text-deepgreen mb-1" />
                      <span className="text-[11px] font-semibold">Manager</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Barbers / Stylists Roster Section */}
        <section className="bg-offwhite border-y border-softblack-border/60 py-14 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-3">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-deepgreen mb-1">
                  {t.home.barbersSection}
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-softblack tracking-tight font-display">
                  {t.home.barbersSubtitle}
                </h2>
              </div>
              <div className="text-xs text-softblack-muted">
                {hasBarbers ? 'Live workstation status' : t.home.noStaffWorking}
              </div>
            </div>

            {/* Stylist Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(state?.barbers ?? []).map((b) => (
                <BarberCard key={b.name} barber={b} />
              ))}
            </div>
          </div>
        </section>

        {/* Clean Features Grid */}
        <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-softblack-border/80 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-pista-light text-deepgreen flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-softblack">Live Dynamic Wait Time</h3>
              <p className="text-sm text-softblack-secondary leading-relaxed">
                Smart queue calculation continuously updates based on active haircuts and stylist pace. Never wait in an overcrowded lobby.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-softblack-border/80 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-pista-light text-deepgreen flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-softblack">Personal Stylist Choice</h3>
              <p className="text-sm text-softblack-secondary leading-relaxed">
                Reserve your spot with Ravi, Amit, Imran, or choose First Available to get into the chair as fast as possible.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-softblack-border/80 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-pista-light text-deepgreen flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-softblack">Instant Turn Notifications</h3>
              <p className="text-sm text-softblack-secondary leading-relaxed">
                Receive proactive reminders when you're 2nd and 1st in line, plus an alert the moment your stylist is ready.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-softblack-border/80 bg-white py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-softblack-muted">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-deepgreen" />
            <span className="font-bold text-softblack">{t.salonName}</span>
            <span>&mdash; {t.tagline}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/display" className="hover:text-deepgreen transition-colors">{t.displayTv}</Link>
            <span>&bull;</span>
            <Link to="/login" className="hover:text-deepgreen transition-colors font-semibold text-softblack">{t.staffPortal}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
