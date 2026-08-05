import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Compass, MessageCircle, Bell, LogOut,
  GraduationCap, X, Menu, BadgeCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSocketStore } from '../../store/socketStore';
import { authApi } from '../../api/endpoints';
import Avatar from '../ui/Avatar';
import OnboardingGuide from '../ui/OnboardingGuide';

// Three destinations, each answering one question — see BUILD_PLAN.md 1.5:
// Campus "what's happening?", People "who's here?", Chats "who am I talking
// to?". Everything that used to be its own nav slot (Pulse, Rizz sessions,
// Communities, Senior Connect) is still fully built and routed; it's reached
// from inside these three now rather than competing for a primary tab.
// Campus is first and is the default landing tab, deliberately — it's a
// group-shaped surface, so the app doesn't open on people-browsing.
const NAV = [
  { to: '/app/freshers', icon: GraduationCap, label: 'Campus' },
  { to: '/app/discover', icon: Compass,       label: 'People' },
  { to: '/app/messages', icon: MessageCircle, label: 'Chats' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const unread = useNotificationStore((s) => s.unreadCount);
  const disconnect = useSocketStore((s) => s.disconnect);
  const navigate = useNavigate();

  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('origo_onboarded'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOnboardingDone = () => {
    localStorage.setItem('origo_onboarded', '1');
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    disconnect();
    clearAuth();
    navigate('/login');
  };

  return (
    <>
      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile slide-out drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="min-w-0">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Origo
            </span>
            {user?.collegeName ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.isVerified && <BadgeCheck size={13} className="text-primary shrink-0" />}
                <p className="text-xs text-text-secondary truncate">{user.collegeName}</p>
              </div>
            ) : (
              <p className="text-xs text-text-muted mt-0.5">Campus social</p>
            )}
          </div>
          <button onClick={() => setDrawerOpen(false)} className="text-text-muted hover:text-primary shrink-0">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-text-secondary hover:bg-primary/10 hover:text-primary'}`
              }
            >
              <Icon size={18} />
              {label}
              {label === 'Chats' && unread > 0 && (
                <span className="ml-auto bg-accent text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/app/notifications"
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-primary/10 hover:text-primary'}`
            }
          >
            <Bell size={18} />
            Notifications
            {unread > 0 && (
              <span className="ml-auto bg-accent text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unread}</span>
            )}
          </NavLink>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl} name={user?.name ?? 'U'} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">@{user?.username}</p>
            </div>
            <button onClick={handleLogout} className="text-text-muted hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex h-[100dvh] bg-bg text-text-primary overflow-hidden">

        {/* ── Desktop sidebar (md+) ── */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border shrink-0 bg-card/50">
          <div className="px-5 py-5 border-b border-border">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Origo
            </span>
            {user?.collegeName ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.isVerified && <BadgeCheck size={13} className="text-primary shrink-0" />}
                <p className="text-xs text-text-secondary truncate">{user.collegeName}</p>
              </div>
            ) : (
              <p className="text-xs text-text-muted mt-0.5">Campus social</p>
            )}
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text-secondary hover:bg-primary/10 hover:text-primary'}`
                }
              >
                <Icon size={18} />
                {label}
                {label === 'Chats' && unread > 0 && (
                  <span className="ml-auto bg-accent text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-border p-3 space-y-1">
            <NavLink
              to="/app/notifications"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-primary/10 hover:text-primary'}`
              }
            >
              <Bell size={18} />
              Notifications
              {unread > 0 && (
                <span className="ml-auto bg-accent text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unread}</span>
              )}
            </NavLink>

            {/* Profile has no primary nav slot in the 3-tab layout — reached
                from here on desktop, and from the avatar in the mobile header. */}
            <Link to="/app/profile" className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl hover:bg-primary/10 transition-colors">
              <Avatar src={user?.avatarUrl} name={user?.name ?? 'U'} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-text-muted truncate">@{user?.username}</p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }}
                className="text-text-muted hover:text-red-400 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </Link>
          </div>
        </aside>

        {/* ── Content area ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Mobile top bar */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
            <button onClick={() => setDrawerOpen(true)} className="text-text-muted hover:text-primary">
              <Menu size={22} />
            </button>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Origo
            </span>
            <div className="flex items-center gap-3">
              <Link to="/app/notifications" className="relative text-text-muted hover:text-primary">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <Link to="/app/profile">
                <Avatar src={user?.avatarUrl} name={user?.name ?? 'U'} size={28} />
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-sm border-t border-border flex items-stretch h-16 safe-bottom">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative
              ${isActive ? 'text-primary' : 'text-text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {label === 'Chats' && unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <span>{label}</span>
                {isActive && (
                  <span className="absolute top-0 inset-x-0 h-0.5 bg-primary rounded-b-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {showOnboarding && <OnboardingGuide onDone={handleOnboardingDone} />}
    </>
  );
}
