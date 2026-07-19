import { Link } from 'react-router-dom';
import { Edit, Star, Settings, Heart, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';

const LF_LABELS: Record<string, string> = {
  FRIENDS: '🤝 Friends',
  DATING: '💕 Dating',
  STUDY_BUDDY: '📚 Study Buddy',
  NETWORKING: '🚀 Networking',
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">My Profile</h1>
        <Link to="/app/settings" className="text-text-muted hover:text-primary transition-colors">
          <Settings size={20} />
        </Link>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Hero */}
        <div className="flex items-center gap-5">
          <Avatar src={user.avatarUrl} name={user.name} size={80} ring />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-text-primary">{user.name}</h2>
              {user.isVerified && <span className="text-primary font-bold">✓</span>}
              {user.isPremium && (
                <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">✨ Premium</span>
              )}
            </div>
            <p className="text-text-muted text-sm">@{user.username}</p>
            {user.collegeName && (
              <div className="flex items-center gap-1.5 text-text-secondary text-sm mt-1">
                <GraduationCap size={14} />
                {user.collegeName}
              </div>
            )}
          </div>
        </div>

        {user.bio && (
          <p className="text-text-secondary text-sm leading-relaxed bg-muted rounded-xl p-4 border border-border">
            {user.bio}
          </p>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/app/profile/edit"
            className="flex items-center justify-center gap-2 py-3 bg-card border border-border rounded-xl text-text-secondary hover:border-primary/40 hover:text-primary transition-all text-sm font-medium"
          >
            <Edit size={16} /> Edit Profile
          </Link>
          <Link
            to="/app/premium"
            className="flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-light rounded-xl text-white transition-colors text-sm font-medium"
          >
            <Star size={16} /> {user.isPremium ? 'Premium ✓' : 'Go Premium'}
          </Link>
        </div>

        {/* Ship a Friend */}
        <Link
          to="/app/ship"
          className="flex items-center justify-center gap-2 py-3 bg-accent/10 border border-accent/30 hover:bg-accent/20 rounded-xl text-accent transition-all text-sm font-medium"
        >
          <Heart size={16} /> Ship a Friend — ₹19
        </Link>

        {/* Looking For */}
        {user.lookingFor?.length > 0 && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Looking For</p>
            <div className="flex flex-wrap gap-2">
              {user.lookingFor.map((lf) => (
                <span key={lf} className="text-sm bg-card border border-border px-3 py-1.5 rounded-full text-text-secondary">
                  {LF_LABELS[lf] ?? lf}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {user.interests?.length > 0 && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((ui) => (
                <span key={ui.interestId} className="text-sm bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-primary">
                  {ui.interest.emoji} {ui.interest.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
