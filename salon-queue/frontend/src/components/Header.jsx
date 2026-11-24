// src/components/Header.jsx
// Shared header with salon name, optional nav, language toggle.

import { Link } from 'react-router-dom';
import { LangToggle } from './LangToggle';
import { useLang } from '../context/LangContext';

export function Header({ children, showHome = false }) {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-40 bg-charcoal-900/95 backdrop-blur border-b border-charcoal-700 px-4 py-3 flex items-center gap-3">
      {showHome && (
        <Link to="/" className="text-gold font-bold text-lg tracking-tight hover:opacity-80 transition-opacity shrink-0">
          ✂ {t.salonName}
        </Link>
      )}
      {!showHome && (
        <span className="text-gold font-bold text-lg tracking-tight shrink-0">
          ✂ {t.salonName}
        </span>
      )}
      <div className="flex-1" />
      {children}
      <LangToggle />
    </header>
  );
}
