import { useState } from 'react';
import { ArrowLeft, ChevronRight, Trash2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import Modal from '../../components/ui/Modal';

export default function SettingsPage() {
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { clearAuth } = useAuthStore();
  const { disconnect } = useSocketStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    disconnect();
    clearAuth();
    navigate('/login', { replace: true });
  };

  const handleDelete = async () => {
    if (deleteInput !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      disconnect();
      clearAuth();
      navigate('/login', { replace: true });
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const SettingRow = ({ label, description, onClick, danger = false }: { label: string; description?: string; onClick?: () => void; danger?: boolean }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors text-left ${danger ? 'hover:bg-red-500/10' : 'hover:bg-white/5'}`}
    >
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-text-primary'}`}>{label}</p>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <ChevronRight size={16} className={danger ? 'text-red-400/50' : 'text-text-muted'} />
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate('/app/profile')} className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Account */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider px-2 mb-2">Account</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            <SettingRow label="Edit Profile" description="Name, bio, photo, gender" onClick={() => navigate('/app/profile/edit')} />
            <SettingRow label="Interests" description="Update what you're into" onClick={() => navigate('/interests')} />
            <SettingRow label="Looking For" description="Update your goals" onClick={() => navigate('/looking-for')} />
            <SettingRow label="Verify College" description="Add or update your college email" onClick={() => navigate('/verify-college')} />
          </div>
        </div>

        {/* Privacy */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider px-2 mb-2">Privacy & Safety</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            <SettingRow label="Privacy Policy" onClick={() => window.open('/privacy', '_blank')} />
            <SettingRow label="Terms of Service" onClick={() => window.open('/terms', '_blank')} />
            <SettingRow label="Data Export" description="Download a copy of your data" onClick={() => toast('Coming soon — data export will be emailed to you.')} />
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider px-2 mb-2">Danger Zone</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            <SettingRow label="Sign Out" onClick={handleLogout} />
            <SettingRow label="Delete Account" description="Permanently remove all your data" onClick={() => setDeleteModal(true)} danger />
          </div>
        </div>

        <p className="text-center text-xs text-text-muted pb-4">Origo v1.0 · Made with ❤️ for campus India</p>
      </div>

      {/* Delete confirmation */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400 text-sm font-medium">⚠️ This action is permanent</p>
            <p className="text-text-muted text-sm mt-1">All your data, matches, and messages will be deleted forever.</p>
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Type <span className="font-mono text-red-400">DELETE</span> to confirm</label>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-red-500 transition-colors text-sm"
            />
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting || deleteInput !== 'DELETE'}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            {deleting ? 'Deleting…' : 'Delete My Account'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
