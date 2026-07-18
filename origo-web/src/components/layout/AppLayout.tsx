import { NavLink, useNavigate } from 'react-router-dom';
import { Compass, Zap, MessageCircle, Users, User, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSocketStore } from '../../store/socketStore';
import { authApi } from '../../api/endpoints';
import Avatar from '../ui/Avatar';

const NAV = [
  { to: '/app/discover', icon: Compass, label: 'Discover' },
  { to: '/app/rizz', icon: Zap, label: 'Rizz In 5' },
  { to: '/app/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/app/communities', icon: Users, label: 'Communities' },
  { to: '/app/profile', icon: User, label: 'Profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const unread = useNotificationStore((s) => s.unreadCount);
  const disconnect = useSocketStore((s) => s.disconnect);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    disconnect();
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-bg text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border shrink-0 bg-card/50">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Origo
          </span>
          <p className="text-xs text-text-muted mt-0.5">Campus social</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-text-secondary hover:bg-white/5 hover:text-white'}`
              }
            >
              <Icon size={18} />
              {label}
              {label === 'Messages' && unread > 0 && (
                <span className="ml-auto bg-accent text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Notifications + User footer */}
        <div className="border-t border-border p-3 space-y-1">
          <NavLink
            to="/app/notifications"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`
            }
          >
            <Bell size={18} />
            Notifications
            {unread > 0 && (
              <span className="ml-auto bg-accent text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {unread}
              </span>
            )}
          </NavLink>

          <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
            <Avatar src={user?.avatarUrl} name={user?.name ?? 'U'} size={32} />
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
