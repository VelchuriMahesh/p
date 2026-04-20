import { Heart, Home, PlaySquare, Bell, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

const items = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/feed', label: 'Feed', icon: PlaySquare },
  { to: '/donate', label: '', icon: Heart, isDonate: true },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/dashboard', label: 'Me', icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-100 bg-white/98 px-2 pb-safe pt-1 backdrop-blur-xl" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map(({ to, label, icon: Icon, isDonate }) => {
          if (isDonate) {
            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate('/map')}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-orange-400 shadow-lg shadow-accent/40">
                  <Heart className="h-6 w-6 fill-white text-white" />
                </div>
                <span className="mt-1 text-[10px] font-bold text-accent">Donate</span>
              </button>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors relative ${
                  isActive ? 'text-accent' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {to === '/notifications' && unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <span>{label}</span>
                  {isActive ? <span className="absolute bottom-0 h-0.5 w-4 rounded-full bg-accent" /> : null}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}