// src/pages/JoinQueue.jsx
// Screen 2: /join — Customer selects services, barber, confirms.

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { publicFetch } from '../hooks/useApi';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/ui/Spinner';

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
      if (prev.length >= 3) return prev; // max 3
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
        // Existing entry — navigate to their status
        navigate(`/status/${e.data.recovery.id}`, {
          state: { recovered: true, tokenNumber: e.data.recovery.tokenNumber },
        });
      } else {
        setSubmitError(e.message);
        // Preserve form values
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showHome>
        <button onClick={() => navigate('/')} className="btn-secondary text-sm px-3 py-2 min-h-[36px]">
          {t.back}
        </button>
      </Header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-6">{t.join.title}</h1>

        {submitError && (
          <div className="card border border-red-700/40 mb-4 text-red-300 text-sm">{submitError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-charcoal-200 mb-1">{t.join.name}</label>
            <input
              className="input"
              type="text"
              placeholder={t.join.namePlaceholder}
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: null })); }}
              autoComplete="name"
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal-200 mb-1">{t.join.phone}</label>
            <input
              className="input"
              type="tel"
              inputMode="numeric"
              placeholder={t.join.phonePlaceholder}
              value={phone}
              maxLength={10}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setErrors((x) => ({ ...x, phone: null })); }}
              autoComplete="tel"
            />
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>

          {/* Services */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-3">
              {t.join.services}
            </h2>
            {services.length === 0 ? (
              <p className="text-charcoal-400 text-sm">{t.join.emptyServices}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((svc) => {
                  const selected = selectedIds.includes(svc.id);
                  const disabled = !selected && selectedIds.length >= 3;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleService(svc.id)}
                      className={`card text-left transition-all ${
                        selected
                          ? 'border-2 border-gold ring-1 ring-gold/30'
                          : 'border border-charcoal-600 hover:border-charcoal-500'
                      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      aria-pressed={selected}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {lang === 'gu' ? svc.nameGu : svc.nameEn}
                          </p>
                          <p className="text-charcoal-400 text-xs mt-0.5">
                            {svc.durationMin} min · ₹{svc.price}
                          </p>
                        </div>
                        {selected && (
                          <span className="text-gold text-lg leading-none">✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.services && <p className="field-error mt-2">{errors.services}</p>}
          </div>

          {/* Barber preference */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-3">
              {t.join.barberPref}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BARBER_OPTIONS.map((opt) => {
                const barber = barbers.find((b) => b.name === opt);
                const isOffDuty = barber && !barber.onDuty;
                const selected  = barberPref === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isOffDuty}
                    onClick={() => setBarberPref(opt)}
                    className={`card text-center py-3 transition-all ${
                      selected ? 'border-2 border-gold' : 'border border-charcoal-600'
                    } ${isOffDuty ? 'opacity-40 cursor-not-allowed' : ''}`}
                    aria-pressed={selected}
                  >
                    <p className="font-medium text-sm text-white">
                      {opt === 'ANY' ? t.join.anyBarber : opt}
                    </p>
                    {barber && (
                      <p className={`text-xs mt-0.5 ${
                        barber.status === 'AVAILABLE' ? 'text-green-400' :
                        barber.status === 'ON_BREAK'  ? 'text-amber-400' : 'text-charcoal-400'
                      }`}>
                        {t.barberStatus[barber.status]}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {selectedServices.length > 0 && (
            <div className="card-gold mb-6">
              <h3 className="font-semibold text-gold mb-2 text-sm">{t.join.summary}</h3>
              <ul className="space-y-1 mb-3">
                {selectedServices.map((s) => (
                  <li key={s.id} className="flex justify-between text-sm text-charcoal-200">
                    <span>{lang === 'gu' ? s.nameGu : s.nameEn}</span>
                    <span>₹{s.price}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-charcoal-600 pt-2 flex justify-between text-sm font-semibold text-white">
                <span>{totalDuration} min</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || services.length === 0}
            className="btn-primary w-full text-base py-4"
          >
            {submitting ? <Spinner size="sm" /> : t.join.confirmJoin}
          </button>
        </form>
      </main>
    </div>
  );
}
