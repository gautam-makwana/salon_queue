// src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { Scissors, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-offwhite flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full text-center border border-softblack-border/80 shadow-card space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-pista-light text-deepgreen flex items-center justify-center mx-auto">
          <Scissors className="w-7 h-7" />
        </div>
        <h1 className="text-4xl font-black text-softblack tracking-tight font-display">404</h1>
        <p className="text-sm font-semibold text-softblack">Page not found</p>
        <p className="text-xs text-softblack-muted">The salon page you are looking for does not exist or has been moved.</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary w-full text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.status?.goHome || 'Return to Queue Home'}</span>
        </button>
      </div>
    </div>
  );
}
