import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import { usersApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

const GENDERS = ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'];
const GL: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', NON_BINARY: 'Non-binary', PREFER_NOT_TO_SAY: 'Prefer not to say' };
const LF_OPTS = ['FRIENDS', 'DATING', 'STUDY_BUDDY', 'NETWORKING'];
const LF_LABELS: Record<string, string> = { FRIENDS: '🤝 Friends', DATING: '💕 Dating', STUDY_BUDDY: '📚 Study Buddy', NETWORKING: '🚀 Networking' };

export default function EditProfilePage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [lookingFor, setLookingFor] = useState<Set<string>>(new Set(user?.lookingFor ?? []));
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleLf = (v: string) => {
    const n = new Set(lookingFor);
    n.has(v) ? n.delete(v) : n.add(v);
    setLookingFor(n);
  };

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
      const { data } = await usersApi.updateMe({
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        gender: gender || undefined,
        lookingFor: Array.from(lookingFor) as never[],
      });
      setUser(data);
      toast.success('Profile updated!');
      navigate('/app/profile');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate('/app/profile')} className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Edit Profile</h1>
        <button onClick={save} disabled={saving} className="ml-auto px-4 py-1.5 bg-primary hover:bg-primary-light text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="relative">
            <Avatar src={preview ?? user?.avatarUrl} name={user?.name ?? ''} size={80} ring />
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5">
              <Camera size={12} className="text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
          <p className="text-xs text-text-muted">Tap to change photo</p>
        </div>

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

        <div>
          <label className="text-sm text-text-secondary font-medium block mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            placeholder="Tell your campus who you are…"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none text-sm"
          />
          <p className="text-xs text-text-muted text-right mt-0.5">{bio.length}/160</p>
        </div>

        <div>
          <label className="text-sm text-text-secondary font-medium block mb-2">Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g === gender ? '' : g)}
                className={`py-2 px-3 rounded-xl border text-sm transition-all ${gender === g ? 'border-primary bg-primary/10 text-text-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}
              >
                {GL[g]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary font-medium block mb-2">Looking For</label>
          <div className="space-y-2">
            {LF_OPTS.map((lf) => (
              <button
                key={lf}
                onClick={() => toggleLf(lf)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all ${lookingFor.has(lf) ? 'border-primary bg-primary/10 text-text-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}
              >
                {LF_LABELS[lf]}
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${lookingFor.has(lf) ? 'border-primary bg-primary' : 'border-border'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
