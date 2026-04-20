import { ArrowLeft, HeartHandshake, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { logout } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const canGoBack = location.pathname !== '/home' && location.pathname !== '/ngo-dashboard' && location.pathname !== '/admin';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy/95 px-4 py-4 text-white backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div className="flex items-center gap-3">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
              <HeartHandshake className="h-5 w-5" />
            </div>
          )}

          <div>
            <p className="text-sm font-semibold tracking-wide text-white">Celebrate With Purpose</p>
            <p className="text-xs text-white/65">
              {role === 'ngo_admin' ? 'NGO dashboard' : role === 'super_admin' ? 'Admin console' : 'Give with heart'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {role === 'donor' ? <NotificationBell /> : null}
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

