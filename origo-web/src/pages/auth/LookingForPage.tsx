import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import { usersApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

const OPTIONS = [
  { value: 'FRIENDS', label: '🤝 Friends', desc: 'Genuine campus friendships' },
  { value: 'DATING', label: '💕 Dating', desc: 'Meaningful romantic connections' },
  { value: 'STUDY_BUDDY', label: '📚 Study Buddy', desc: 'Focus together, grow together' },
  { value: 'NETWORKING', label: '🚀 Networking', desc: 'Build your professional circle' },
];

export default function LookingForPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v); else next.add(v);
    setSelected(next);
  };

  const save = async () => {
    if (!selected.size) { toast.error('Pick at least one option'); return; }
    setSaving(true);
    try {
      const { data } = await usersApi.updateMe({ lookingFor: Array.from(selected) as never[] });
      setUser(data);
      navigate('/profile-setup');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text-primary mb-1">What are you here for?</h2>
      <p className="text-text-muted text-sm mb-5">Select all that apply — be honest, be you.</p>

      <div className="space-y-3">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
              selected.has(o.value)
                ? 'border-primary bg-primary/10 text-text-primary'
                : 'border-border hover:border-primary/40 text-text-secondary'
            }`}
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{o.label}</p>
              <p className="text-xs text-text-muted">{o.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 transition-all shrink-0 ${selected.has(o.value) ? 'border-primary bg-primary' : 'border-border'}`} />
          </button>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving || !selected.size}
        className="w-full mt-5 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Continue →'}
      </button>
    </AuthLayout>
  );
}
