// src/pages/LoginPage.jsx
// Shared login page for all staff roles.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Spinner } from '../components/ui/Spinner';
import { LangToggle } from '../components/LangToggle';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function LoginPage({ redirectTo = '/reception' }) {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.auth.invalidCreds); return; }

      login(data.token, data.staff);

      // Route to appropriate screen based on role
      const roleRoutes = { OWNER: '/admin', BARBER: `/barber/${data.staff.barberName}`, RECEPTION: '/reception' };
      navigate(roleRoutes[data.staff.role] || redirectTo);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-charcoal-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold text-4xl mb-2">✂</p>
          <h1 className="text-2xl font-bold text-white">{t.auth.loginTitle}</h1>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700/40 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal-200 mb-1">{t.auth.username}</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal-200 mb-1">{t.auth.password}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : t.auth.login}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-6">
          <LangToggle />
        </div>
      </div>
    </div>
  );
}
