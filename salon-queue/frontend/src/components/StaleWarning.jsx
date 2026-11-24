// src/components/StaleWarning.jsx
import { useLang } from '../context/LangContext';

export function StaleWarning({ visible }) {
  const { t } = useLang();
  if (!visible) return null;
  return (
    <div className="stale-banner" role="alert">
      <span>⚠</span>
      <span>{t.staleWarning}</span>
    </div>
  );
}
