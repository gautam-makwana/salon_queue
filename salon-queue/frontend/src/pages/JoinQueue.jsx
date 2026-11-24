// src/pages/JoinQueue.jsx
// Screen 2: /join — Minimalist booking experience with pista selection states

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { publicFetch } from '../hooks/useApi';
import { Header } from '../components/Header';
import { Spinner } from '../components/ui/Spinner';
import {
  User, Phone, Scissors, Check, ArrowLeft, ArrowRight,
  Clock, IndianRupee, Sparkles, AlertCircle
} from 'lucide-react';

const BARBER_OPTIONS = ['ANY', 'Ravi', 'Amit', 'Imran'];

export default function JoinQueue() {
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [services, setServices]     = useState([]);
  const [barbers, setBarbers]       = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [barberPref, setBarberPref] = useState('ANY');

  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    Promise.all([
      publicFetch('GET', '/api/services'),
      publicFetch('GET', '/api/barbers'),
    ])
      .then(([svcs, bbs]) => { setServices(svcs); setBarbers(bbs); })
      .catch((e) => setSubmitError(e.message))
      .finally(() => setLoadingInit(false));
  }, []);

  function toggleService(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3 limit
      return [...prev, id];
    });
    setErrors((e) => ({ ...e, services: null }));
  }

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.id)),
    [services, selectedIds]
  );

  const totalDuration = selectedServices.reduce((s, x) => s + x.durationMin, 0);
  const totalPrice    = selectedServices.reduce((s, x) => s + x.price, 0);

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = t.join.errors.nameRequired;
    if (!/^\d{10}$/.test(phone)) errs.phone = t.join.errors.phoneInvalid;
    if (selectedIds.length === 0) errs.services = t.join.errors.selectService;
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const data = await publicFetch('POST', '/api/queue/join', {
        customerName: name.trim(),
        phone,
        serviceIds:   selectedIds,
        barberPref,
      });
      navigate(`/status/${data.id}`, { state: { fresh: true, tokenNumber: data.tokenNumber } });
    } catch (e) {
      if (e.status === 409 && e.data?.recovery) {
        // Recover existing active spot
        navigate(`/status/${e.data.recovery.id}`, {
          state: { recovered: true, tokenNumber: e.data.recovery.tokenNumber },
        });
      } else {
        setSubmitError(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInit) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-softblack-muted font-medium">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary text-xs px-3.5 py-2 rounded-xl inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-deepgreen" />
            <span>{t.back}</span>
          </button>
          <span className="text-xs font-bold text-deepgreen bg-pista-light px-3 py-1.5 rounded-full border border-pista/50">
            Step 1 of 2: Join Queue
          </span>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-subtle">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Details, Services, Barber preference */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-softblack-border/80 shadow-subtle space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-softblack tracking-tight font-display">
                  {t.join.title}
                </h1>
                <p className="text-xs sm:text-sm text-softblack-muted mt-1">
                  {t.join.subtitle}
                </p>
              </div>

              {/* Client Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1.5">
                    {t.join.name}
                  </label>
                  <div className="relative">
                    <input
                      className="input pl-10"
                      type="text"
                      placeholder={t.join.namePlaceholder}
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: null })); }}
                      autoComplete="name"
                    />
                    <User className="w-4 h-4 text-softblack-muted absolute left-3.5 top-3.5" />
                  </div>
                  {errors.name && <p className="field-error">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1.5">
                    {t.join.phone}
                  </label>
                  <div className="relative">
                    <input
                      className="input pl-10"
                      type="tel"
                      inputMode="numeric"
                      placeholder={t.join.phonePlaceholder}
                      value={phone}
                      maxLength={10}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setErrors((x) => ({ ...x, phone: null })); }}
                      autoComplete="tel"
                    />
                    <Phone className="w-4 h-4 text-softblack-muted absolute left-3.5 top-3.5" />
                  </div>
                  {errors.phone && <p className="field-error">{errors.phone}</p>}
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-softblack uppercase tracking-wider">
                      {t.join.services}
                    </h2>
                    <p className="text-[11px] text-softblack-muted">{t.join.servicesHelp}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    selectedIds.length === 3
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-pista-light text-deepgreen'
                  }`}>
                    {selectedIds.length}/3 selected
                  </span>
                </div>

                {services.length === 0 ? (
                  <p className="text-softblack-muted text-sm">{t.join.emptyServices}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((svc) => {
                      const isSelected = selectedIds.includes(svc.id);
                      const isLimitReached = !isSelected && selectedIds.length >= 3;

                      return (
                        <button
                          key={svc.id}
                          type="button"
                          disabled={isLimitReached}
                          onClick={() => toggleService(svc.id)}
                          className={`rounded-2xl p-4 text-left transition-all duration-200 border ${
                            isSelected
                              ? 'bg-pista-light border-deepgreen ring-1 ring-deepgreen shadow-subtle'
                              : 'bg-white border-softblack-border/80 hover:border-pista hover:bg-offwhite'
                          } ${isLimitReached ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.99]'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-softblack text-sm">
                                {lang === 'gu' ? svc.nameGu : svc.nameEn}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-softblack-muted font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-deepgreen" />
                                  <span>{svc.durationMin}m</span>
                                </span>
                                <span>&bull;</span>
                                <span className="inline-flex items-center font-bold text-softblack">
                                  ₹{svc.price}
                                </span>
                              </div>
                            </div>

                            <div className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-deepgreen text-white'
                                : 'border border-softblack-border bg-offwhite'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.services && <p className="field-error mt-2">{errors.services}</p>}
              </div>

              {/* Stylist Selection */}
              <div>
                <h2 className="text-sm font-bold text-softblack uppercase tracking-wider mb-3">
                  {t.join.barberPref}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BARBER_OPTIONS.map((opt) => {
                    const barber = barbers.find((b) => b.name === opt);
                    const isOffDuty = barber && !barber.onDuty;
                    const isSelected = barberPref === opt;

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isOffDuty}
                        onClick={() => setBarberPref(opt)}
                        className={`rounded-2xl p-3.5 text-center transition-all duration-200 border ${
                          isSelected
                            ? 'bg-pista-light border-deepgreen ring-1 ring-deepgreen'
                            : 'bg-white border-softblack-border/80 hover:border-pista hover:bg-offwhite'
                        } ${isOffDuty ? 'opacity-40 cursor-not-allowed bg-neutral-50' : 'active:scale-[0.99]'}`}
                      >
                        <p className="font-bold text-xs sm:text-sm text-softblack leading-tight">
                          {opt === 'ANY' ? t.join.anyBarber : opt}
                        </p>
                        {barber && (
                          <p className={`text-[10px] font-bold mt-1.5 ${
                            barber.status === 'AVAILABLE' ? 'text-deepgreen' :
                            barber.status === 'ON_BREAK'  ? 'text-amber-700' : 'text-softblack-muted'
                          }`}>
                            {t.barberStatus[barber.status]}
                          </p>
                        )}
                        {opt === 'ANY' && (
                          <p className="text-[10px] text-deepgreen font-semibold mt-1">Recommended</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary & Confirmation */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-softblack-border/80 shadow-card">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-softblack-border/60">
                <Sparkles className="w-5 h-5 text-deepgreen" />
                <h3 className="text-base font-extrabold text-softblack tracking-tight font-display">
                  {t.join.summary}
                </h3>
              </div>

              {selectedServices.length === 0 ? (
                <div className="py-8 text-center text-softblack-muted text-xs">
                  <Scissors className="w-8 h-8 text-pista mx-auto mb-2 opacity-80" />
                  <p>Select at least 1 service to view estimated time and price breakdown</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected items list */}
                  <ul className="space-y-2.5">
                    {selectedServices.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-softblack-secondary">
                          {lang === 'gu' ? s.nameGu : s.nameEn}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-softblack-muted text-xs">{s.durationMin}m</span>
                          <span className="font-bold text-softblack">₹{s.price}</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Stylist line */}
                  <div className="py-2.5 px-3 bg-offwhite rounded-xl text-xs flex justify-between items-center text-softblack-secondary">
                    <span className="text-softblack-muted">{t.join.barberPref}:</span>
                    <span className="font-bold text-deepgreen">
                      {barberPref === 'ANY' ? t.join.anyBarber : barberPref}
                    </span>
                  </div>

                  {/* Totals */}
                  <div className="pt-4 border-t border-softblack-border/60 space-y-2">
                    <div className="flex justify-between text-xs text-softblack-muted">
                      <span>{t.join.totalDuration}</span>
                      <span className="font-semibold text-softblack">{totalDuration} mins</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-softblack">
                      <span>{t.join.totalPrice}</span>
                      <span className="text-deepgreen text-xl font-display">₹{totalPrice}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                disabled={submitting || selectedServices.length === 0}
                onClick={handleSubmit}
                className="btn-primary w-full mt-6 py-4 rounded-2xl text-base font-bold shadow-card flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <span>{t.join.confirmJoin}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
