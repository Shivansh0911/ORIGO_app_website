import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Spinner from '../../components/ui/Spinner';
import { usersApi } from '../../api/endpoints';
import type { Interest } from '../../types';

export default function InterestPickerPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const { data: interests, isLoading } = useQuery({
    queryKey: ['interests'],
    queryFn: () => usersApi.getInterests().then((r) => r.data),
  });

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) { next.delete(id); } else if (next.size < 10) { next.add(id); }
    setSelected(next);
  };

  const groups = interests?.reduce<Record<string, Interest[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {}) ?? {};

  const save = async () => {
    if (selected.size < 3) { toast.error('Pick at least 3 interests'); return; }
    setSaving(true);
    try {
      await usersApi.setInterests(Array.from(selected));
      navigate('/looking-for');
    } catch {
      toast.error('Failed to save interests');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text-primary mb-1">Your interests</h2>
      <p className="text-text-muted text-sm mb-4">Pick 3–10 things you love. This powers your compatibility score.</p>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {Object.entries(groups).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{cat}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => toggle(i.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      selected.has(i.id)
                        ? 'bg-primary border-primary text-white'
                        : 'bg-transparent border-border text-text-secondary hover:border-primary/50'
                    }`}
                  >
                    {i.emoji} {i.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-text-muted text-sm">{selected.size}/10 selected</span>
        <button
          onClick={save}
          disabled={saving || selected.size < 3}
          className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </AuthLayout>
  );
}
