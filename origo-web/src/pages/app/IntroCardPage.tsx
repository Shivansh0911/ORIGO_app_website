import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Share2, Copy, Check, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useFreshersStore } from '../../store/freshersStore';
import { usersApi } from '../../api/endpoints';
import {
  renderIntroCard, downloadDataUrl, shareCard,
  CARD_THEMES, type CardFormat, type CardTheme, type IntroCardData,
} from '../../lib/introCard';
import { ICEBREAKER_PROMPTS } from '../../lib/freshers/content';
import { track } from '../../lib/telemetry';

const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://origo.app';

export default function IntroCardPage() {
  const user = useAuthStore((s) => s.user);
  const completeQuest = useFreshersStore((s) => s.completeQuest);

  // `branch` is a short, user-editable field (persisted to the profile) —
  // joiningYear is derived from the verified college ID and never
  // user-settable. Students identify by *joining* year ("23 batch"), not
  // passout year, so the combined label is built from joiningYear, never
  // hardcoded (see BUILD_PLAN.md 1.10).
  const [branch, setBranch] = useState(() => user?.branch ?? '');
  const [hometown, setHometown] = useState(() => user?.hometown ?? '');
  const branchYear = [branch, user?.joiningYear ? `Batch of ${user.joiningYear}` : null]
    .filter(Boolean).join(' · ');
  const [promptLabel, setPromptLabel] = useState(ICEBREAKER_PROMPTS[0]);
  const [promptAnswer, setPromptAnswer] = useState('');
  const [format, setFormat] = useState<CardFormat>('story');
  const [theme, setTheme] = useState<CardTheme>(CARD_THEMES[0]);

  const [dataUrl, setDataUrl] = useState<string>('');
  const [rendering, setRendering] = useState(false);
  const [copied, setCopied] = useState(false);
  const renderSeq = useRef(0);

  const interests = useMemo(
    () => (user?.interests ?? []).map((ui) => `${ui.interest.emoji} ${ui.interest.name}`),
    [user],
  );

  const profileUrl = user ? `${APP_ORIGIN}/u/${user.username}` : APP_ORIGIN;

  const cardData: IntroCardData | null = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name,
      username: user.username,
      college: user.collegeName ?? 'Add your college',
      branchYear,
      hometown,
      interests,
      promptLabel,
      promptAnswer,
      avatarUrl: user.avatarUrl,
      profileUrl,
      format,
      theme,
    };
  }, [user, branchYear, hometown, interests, promptLabel, promptAnswer, profileUrl, format, theme]);

  // Persist branch/hometown to the profile once they settle — these were
  // previously collected here and thrown away (local state only), despite
  // being the strongest cold-start signals for matching and Discover context.
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      const changed = branch !== (user.branch ?? '') || hometown !== (user.hometown ?? '');
      if (!changed) return;
      usersApi.updateMe({ branch: branch || undefined, hometown: hometown || undefined }).catch(() => {
        // Best-effort — the card itself doesn't depend on this succeeding.
      });
    }, 800);
    return () => clearTimeout(t);
  }, [user, branch, hometown]);

  // Re-render the card (debounced) whenever inputs change.
  useEffect(() => {
    if (!cardData) return;
    const seq = ++renderSeq.current;
    setRendering(true);
    const t = setTimeout(async () => {
      try {
        const { dataUrl: url } = await renderIntroCard(cardData);
        if (seq === renderSeq.current) setDataUrl(url);
      } catch {
        toast.error('Could not render card');
      } finally {
        if (seq === renderSeq.current) setRendering(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [cardData]);

  const handleDownload = () => {
    if (!dataUrl || !user) return;
    downloadDataUrl(dataUrl, `${user.username}-origo-card.png`);
    completeQuest('intro-card');
    track('intro_card_created', { format, theme: theme.id });
    toast.success('Card downloaded — go post it! 🎴');
  };

  const handleShare = async () => {
    if (!dataUrl || !cardData) return;
    const ok = await shareCard(dataUrl, cardData);
    if (ok) { completeQuest('intro-card'); track('intro_card_shared', { format, theme: theme.id }); }
    else toast('Sharing not supported here — use Download instead', { icon: 'ℹ️' });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { toast.error('Could not copy'); }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <Wand2 size={13} /> FRESHERS
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Your Intro Card</h1>
        <p className="text-text-muted text-sm mt-1 max-w-xl">
          Make a card and post it to your batch group or story. People scan the QR to find you on Origo —
          verified, and you hold the keys. No sketchy freshers page required.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Preview */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-center min-h-[420px]">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="Intro card preview"
                className={`rounded-xl shadow-2xl max-h-[560px] w-auto transition-opacity ${rendering ? 'opacity-70' : 'opacity-100'}`}
              />
            ) : (
              <div className="text-text-muted text-sm">Rendering your card…</div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleDownload}
              disabled={!dataUrl}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-light disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
            >
              <Download size={17} /> Download
            </button>
            <button
              onClick={handleShare}
              disabled={!dataUrl}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 bg-muted hover:bg-border disabled:opacity-50 rounded-xl text-text-secondary font-medium transition-colors"
            >
              <Share2 size={17} /> Share
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-border rounded-xl text-text-secondary transition-colors"
              title="Copy profile link"
            >
              {copied ? <Check size={17} className="text-green" /> : <Copy size={17} />}
            </button>
          </div>
        </div>

        {/* Composer */}
        <div className="space-y-6">
          {/* Format + theme */}
          <div>
            <p className="text-sm text-text-secondary font-medium mb-2">Format</p>
            <div className="flex gap-2">
              {(['story', 'square'] as CardFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm capitalize transition-colors ${
                    format === f ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {f === 'story' ? '📱 Story (9:16)' : '⬛ Square (1:1)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-text-secondary font-medium mb-2">Theme</p>
            <div className="flex gap-2 flex-wrap">
              {CARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t)}
                  className={`w-11 h-11 rounded-full border-2 transition-transform ${theme.id === t.id ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: `linear-gradient(135deg, ${t.stops.join(', ')})` }}
                  title={t.label}
                  aria-label={t.label}
                />
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-text-secondary font-medium">Branch</span>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="CSE"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            {user.joiningYear && (
              <span className="text-xs text-text-muted mt-0.5">Batch of {user.joiningYear} · from your verified email</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-text-secondary font-medium">Hometown</span>
            <input
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              placeholder="Delhi"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </label>

          <div>
            <p className="text-sm text-text-secondary font-medium mb-2">Icebreaker prompt</p>
            <div className="flex gap-2 flex-wrap mb-2">
              {ICEBREAKER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPromptLabel(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    promptLabel === p ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <textarea
              value={promptAnswer}
              onChange={(e) => setPromptAnswer(e.target.value.slice(0, 140))}
              placeholder="Your answer — keep it short and real"
              rows={3}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="text-xs text-text-muted text-right mt-1">{promptAnswer.length}/140</p>
          </div>

          {interests.length === 0 && (
            <div className="text-xs text-amber bg-amber/10 border border-amber/20 rounded-xl px-3 py-2">
              Add interests in your profile to make your card pop — they’ll show as chips.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
