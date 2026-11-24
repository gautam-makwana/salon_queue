// src/components/StaleWarning.jsx
import { useLang } from '../context/LangContext';
import { WifiOff } from 'lucide-react';

export function StaleWarning({ visible }) {
  const { t } = useLang();
  if (!visible) return null;
  return (
    <div className="stale-banner" role="alert">
      <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
      <span className="text-xs sm:text-sm font-medium">{t.staleWarning}</span>
    </div>
  );
}
