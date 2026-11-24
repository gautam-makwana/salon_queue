// src/components/Header.jsx
// Premium minimalist header with Salon branding, Join Queue CTA, TV link, Staff Portal access and Language Toggle.

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LangToggle } from './LangToggle';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { Scissors, Tv, UserCog, LogOut, LayoutDashboard, UserPlus, PlusCircle } from 'lucide-react';

export function Header({ children, showHome = true }) {
  const { t } = useLang();
  const { isLoggedIn, staff, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isJoinPage = location.pathname === '/join';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-softblack-border/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Salon Logo & Brand */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-[0.98]"
            title="L'Élégance Salon"
          >
            <div className="w-9 h-9 rounded-xl bg-pista text-softblack flex items-center justify-center font-bold shadow-subtle group-hover:bg-pista-dark transition-colors">
              <Scissors className="w-4 h-4 text-deepgreen" />
            </div>
            <div>
              <span className="text-softblack font-extrabold text-base tracking-tight leading-none block font-display">
                {t.salonName}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-deepgreen font-semibold leading-tight block mt-0.5">
                {t.tagline}
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Custom Action Content */}
        {children && <div className="flex-1 flex justify-center">{children}</div>}

        {/* Right Navigation & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent "Join Queue" CTA in Header if not already on /join */}
          {!isJoinPage && (
            <Link
              to="/join"
              className="btn-primary text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-subtle inline-flex items-center gap-1.5"
              title="Request salon services and join the live queue"
            >
              <PlusCircle className="w-3.5 h-3.5 text-deepgreen" />
              <span>{t.home.joinQueue}</span>
            </Link>
          )}

          {/* Waiting Area TV Link */}
          <Link
            to="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs px-3 py-1.5 hidden md:inline-flex rounded-xl"
            title="Open Waiting Area TV Board in New Tab"
          >
            <Tv className="w-3.5 h-3.5 text-deepgreen" />
            <span>{t.displayTv}</span>
          </Link>

          {/* Staff Login / Portal Button - Always prominently visible */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to={staff?.role === 'OWNER' ? '/admin' : staff?.role === 'BARBER' ? `/barber/${staff.barberName}` : '/reception'}
                className="btn-pista-light text-xs font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-deepgreen" />
                <span className="capitalize">{staff?.username} ({staff?.role?.toLowerCase()})</span>
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="text-softblack-muted hover:text-red-600 p-2 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-secondary text-xs px-3 py-1.5 rounded-xl border border-softblack-border hover:border-pista hover:bg-pista-light hover:text-deepgreen font-semibold"
              title="Barber, Receptionist & Owner Console"
            >
              <UserCog className="w-3.5 h-3.5 text-deepgreen" />
              <span>{t.staffPortal}</span>
            </Link>
          )}

          {/* Language Toggle */}
          <LangToggle />
        </div>
      </div>
    </header>
  );
}
