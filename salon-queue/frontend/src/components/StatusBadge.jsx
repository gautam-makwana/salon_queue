// src/components/StatusBadge.jsx
// Minimalist pill badges with Lucide icons

import { useLang } from '../context/LangContext';
import { Clock, Bell, Scissors, Check, X, AlertOctagon, Sparkles, Coffee, Moon } from 'lucide-react';

export function StatusBadge({ status, type = 'entry', className = '' }) {
  const { t } = useLang();

  if (type === 'barber') {
    const config = {
      AVAILABLE: {
        bg: 'bg-pista-light text-deepgreen border-pista',
        icon: Sparkles,
        label: t.barberStatus.AVAILABLE,
      },
      BUSY: {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: Scissors,
        label: t.barberStatus.BUSY,
      },
      ON_BREAK: {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: Coffee,
        label: t.barberStatus.ON_BREAK,
      },
      OFF_DUTY: {
        bg: 'bg-neutral-100 text-neutral-500 border-neutral-200',
        icon: Moon,
        label: t.barberStatus.OFF_DUTY,
      },
    };

    const cfg = config[status] || { bg: 'bg-neutral-100 text-neutral-600 border-neutral-200', icon: Clock, label: status };
    const Icon = cfg.icon;

    return (
      <span className={`badge ${cfg.bg} ${className}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{cfg.label}</span>
      </span>
    );
  }

  // Queue Entry statuses
  const config = {
    WAITING: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
      label: t.status.WAITING,
    },
    CALLED: {
      bg: 'bg-pista text-softblack border-pista-dark font-bold shadow-subtle',
      icon: Bell,
      label: t.status.CALLED,
    },
    IN_CHAIR: {
      bg: 'bg-pista-light text-deepgreen border-pista',
      icon: Scissors,
      label: t.status.IN_CHAIR,
    },
    DONE: {
      bg: 'bg-offwhite text-softblack-muted border-softblack-border',
      icon: Check,
      label: t.status.DONE,
    },
    CANCELLED: {
      bg: 'bg-neutral-100 text-neutral-500 border-neutral-200',
      icon: X,
      label: t.status.CANCELLED,
    },
    NO_SHOW: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertOctagon,
      label: t.status.NO_SHOW,
    },
  };

  const cfg = config[status] || { bg: 'bg-neutral-100 text-neutral-600 border-neutral-200', icon: Clock, label: status };
  const Icon = cfg.icon;

  return (
    <span className={`badge ${cfg.bg} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
}
