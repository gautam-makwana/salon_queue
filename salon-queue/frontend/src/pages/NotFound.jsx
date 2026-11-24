// src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function NotFound() {
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-6xl">✂</p>
      <h1 className="text-2xl font-bold text-white">404</h1>
      <p className="text-charcoal-400">Page not found.</p>
      <button onClick={() => navigate('/')} className="btn-primary">{t.status?.goHome || 'Go Home'}</button>
    </div>
  );
}
