// src/pages/LoginPage.jsx
// Premium minimal login page with demo fast-switch buttons

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Spinner } from '../components/ui/Spinner';
import { LangToggle } from '../components/LangToggle';
import { Scissors, Lock, User, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const DEMO_USERS = [
  { label: 'Receptionist Desk', role: 'RECEPTION', username: 'reception', pass: 'demo1234' },
  { label: 'Ravi (Stylist)', role: 'BARBER', username: 'ravi', pass: 'demo1234' },
  { label: 'Amit (Stylist)', role: 'BARBER', username: 'amit', pass: 'demo1234' },
  { label: 'Imran (Stylist)', role: 'BARBER', username: 'imran', pass: 'demo1234' },
  { label: 'Salon Owner', role: 'OWNER', username: 'owner', pass: 'demo1234' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleLogin(user, pass) {
    const u = user || username;
    const p = pass || password;

    if (!u || !p) {
      setError(t.auth.invalidCreds);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.auth.invalidCreds);
        return;
      }

      login(data.token, data.staff);

      // Route according to role or return to attempted page
      if (location.state?.from?.pathname) {
        navigate(location.state.from.pathname);
      } else {
        const roleRoutes = {
          OWNER: '/admin',
          BARBER: `/barber/${data.staff.barberName}`,
          RECEPTION: '/reception',
        };
        navigate(roleRoutes[data.staff.role] || '/reception');
      }
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    handleLogin();
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary text-xs px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4 text-deepgreen" />
          <span>{t.home.heroBadge}</span>
        </button>
        <LangToggle />
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-pista text-softblack flex items-center justify-center font-bold mx-auto mb-3 shadow-subtle">
            <Scissors className="w-6 h-6 text-deepgreen" />
          </div>
          <h1 className="text-2xl font-extrabold text-softblack tracking-tight font-display">
            {t.auth.loginTitle}
          </h1>
          <p className="text-xs text-softblack-muted mt-1 max-w-xs mx-auto">
            {t.auth.loginSubtitle}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-softblack-border/80 shadow-card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1.5">
                {t.auth.username}
              </label>
              <div className="relative">
                <input
                  className="input pl-10"
                  type="text"
                  placeholder="e.g. reception, ravi, owner"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
                <User className="w-4 h-4 text-softblack-muted absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-softblack uppercase tracking-wider mb-1.5">
                {t.auth.password}
              </label>
              <div className="relative">
                <input
                  className="input pl-10"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <Lock className="w-4 h-4 text-softblack-muted absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-dark w-full mt-2 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size="sm" className="border-white" /> : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{t.auth.login}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Access */}
          <div className="mt-6 pt-5 border-t border-softblack-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-deepgreen uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.auth.quickDemo}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.username}
                  type="button"
                  onClick={() => {
                    setUsername(user.username);
                    setPassword(user.pass);
                    handleLogin(user.username, user.pass);
                  }}
                  className="btn-secondary text-[11px] py-2 px-2.5 rounded-xl text-left flex flex-col items-start hover:border-pista hover:bg-pista-light"
                >
                  <span className="font-bold text-softblack">{user.label}</span>
                  <span className="text-[10px] text-softblack-muted">{user.username} / {user.pass}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-softblack-muted">
        {t.salonName} &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
