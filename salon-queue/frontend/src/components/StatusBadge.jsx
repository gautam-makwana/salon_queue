// src/components/StatusBadge.jsx
// Renders a coloured badge for EntryStatus or BarberStatus.

import { useLang } from '../context/LangContext';

const ENTRY_COLOURS = {
  WAITING:   'bg-blue-900/60 text-blue-300 border border-blue-600/40',
  CALLED:    'bg-gold/20 text-gold border border-gold/40',
  IN_CHAIR:  'bg-green-900/60 text-green-300 border border-green-600/40',
  DONE:      'bg-charcoal-600 text-charcoal-300 border border-charcoal-500',
  CANCELLED: 'bg-charcoal-600 text-charcoal-400 border border-charcoal-500',
  NO_SHOW:   'bg-red-900/60 text-red-300 border border-red-600/40',
};

const BARBER_COLOURS = {
  AVAILABLE: 'bg-green-900/60 text-green-300 border border-green-600/40',
  BUSY:      'bg-gold/20 text-gold border border-gold/40',
  ON_BREAK:  'bg-amber-900/60 text-amber-300 border border-amber-600/40',
  OFF_DUTY:  'bg-charcoal-600 text-charcoal-400 border border-charcoal-500',
};

export function StatusBadge({ status, type = 'entry', className = '' }) {
  const { t } = useLang();
  const colourMap = type === 'barber' ? BARBER_COLOURS : ENTRY_COLOURS;
  const labelMap  = type === 'barber' ? t.barberStatus : t.status;
  const colour    = colourMap[status] || 'bg-charcoal-600 text-charcoal-300';
  const label     = labelMap?.[status] || status;

  return (
    <span className={`badge ${colour} ${className}`}>
      {label}
    </span>
  );
}
