// src/components/LangToggle.jsx
import { useLang } from '../context/LangContext';

export function LangToggle({ className = '' }) {
  const { t, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      className={`btn-secondary text-sm px-3 py-2 min-h-[36px] ${className}`}
      aria-label="Toggle language"
    >
      {t.language}
    </button>
  );
}
