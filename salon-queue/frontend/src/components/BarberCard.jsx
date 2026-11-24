// src/components/BarberCard.jsx
// Premium stylist card in White, Pista & Soft Black

import { StatusBadge } from './StatusBadge';
import { useLang } from '../context/LangContext';
import { User, Scissors, Clock } from 'lucide-react';

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
    <div className={`card group hover:border-pista hover:shadow-card transition-all duration-200 ${
      compact ? 'flex items-center gap-4 p-4' : 'flex flex-col items-center text-center p-5'
    }`}>
      {/* Avatar with Pista accent ring */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-offwhite border border-softblack-border flex items-center justify-center text-softblack font-bold text-base shadow-subtle group-hover:bg-pista-light group-hover:border-pista transition-colors">
          <span className="text-deepgreen font-bold">{initials(barber.name)}</span>
        </div>
        {barber.onDuty && barber.status === 'AVAILABLE' && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-deepgreen border-2 border-white rounded-full"></span>
        )}
      </div>

      <div className={compact ? 'flex-1 min-w-0' : 'mt-3 w-full'}>
        <div className="flex items-center justify-center gap-1.5">
          <p className="font-bold text-softblack text-base">{barber.name}</p>
        </div>
        <div className="mt-2 flex justify-center">
          <StatusBadge status={barber.status} type="barber" />
        </div>

        {currentEntry && (
          <div className="mt-3 py-1.5 px-3 bg-pista-light rounded-xl border border-pista/50 inline-flex items-center gap-1.5 text-xs text-deepgreen font-semibold">
            <Scissors className="w-3.5 h-3.5" />
            <span>Serving Token #{currentEntry.tokenNumber}</span>
          </div>
        )}

        {!barber.onDuty && (
          <p className="text-xs text-softblack-muted mt-2">{t.barberStatus.OFF_DUTY}</p>
        )}
      </div>
    </div>
  );
}
