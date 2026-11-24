// src/components/BarberCard.jsx
// Displays a barber's name, status, and optionally their current token.

import { StatusBadge } from './StatusBadge';
import { useLang } from '../context/LangContext';

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function BarberCard({ barber, currentEntry, compact = false }) {
  const { t } = useLang();

  return (
    <div className={`card flex ${compact ? 'flex-row items-center gap-3' : 'flex-col items-center text-center gap-3'}`}>
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center shrink-0">
        <span className="text-gold font-bold text-sm">{initials(barber.name)}</span>
      </div>

      <div className={compact ? 'flex-1 min-w-0' : ''}>
        <p className="font-semibold text-white">{barber.name}</p>
        <StatusBadge status={barber.status} type="barber" className="mt-1" />

        {currentEntry && (
          <p className="text-xs text-charcoal-300 mt-1">
            #{currentEntry.tokenNumber}
          </p>
        )}

        {!barber.onDuty && (
          <p className="text-xs text-charcoal-400 mt-1">{t.barberStatus.OFF_DUTY}</p>
        )}
      </div>
    </div>
  );
}
