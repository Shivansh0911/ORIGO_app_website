import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { usersApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

const GENDERS = ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'];
const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male', FEMALE: 'Female', NON_BINARY: 'Non-binary', PREFER_NOT_TO_SAY: 'Prefer not to say',
};

export default function ProfileSetupPage() {
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatar(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (avatar) await usersApi.uploadAvatar(avatar);
      const { data } = await usersApi.updateMe({ bio: bio || undefined, gender: gender || undefined });
      setUser(data);
      toast.success("You're all set! 🎉");
      navigate('/app/discover', { replace: true });
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text-primary mb-1">Set up your profile</h2>
      <p className="text-text-muted text-sm mb-5">First impressions matter. Add a photo and bio.</p>

      {/* Avatar picker */}
      <div className="flex justify-center mb-5">
        <button onClick={() => fileRef.current?.click()} className="relative">
          <div className="w-24 h-24 rounded-full bg-card border-2 border-dashed border-border overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera size={28} className="text-text-muted" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5">
            <Camera size={12} className="text-white" />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-text-secondary font-medium block mb-1">Bio</label>
          <textarea
            placeholder="Tell your campus who you are…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none text-sm"
          />
          <p className="text-xs text-text-muted text-right mt-1">{bio.length}/160</p>
        </div>

        <div>
          <label className="text-sm text-text-secondary font-medium block mb-2">Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g === gender ? '' : g)}
                className={`py-2 px-3 rounded-xl border text-sm transition-all ${
                  gender === g ? 'border-primary bg-primary/10 text-text-primary' : 'border-border text-text-secondary hover:border-primary/40'
                }`}
              >
                {GENDER_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full mt-5 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : "Let's go 🚀"}
      </button>
    </AuthLayout>
  );
}
