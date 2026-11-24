// src/components/LangToggle.jsx
import { useLang } from '../context/LangContext';
import { Globe } from 'lucide-react';

export function LangToggle({ className = '' }) {
  const { t, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      className={`btn-secondary text-xs font-semibold px-3 py-1.5 rounded-xl transition-all border border-softblack-border/80 hover:bg-pista-light hover:border-pista hover:text-deepgreen ${className}`}
      aria-label="Change Language"
      title="Toggle Language / ભાષા બદલો"
    >
      <Globe className="w-3.5 h-3.5 text-deepgreen" />
      <span>{t.language}</span>
    </button>
  );
}
