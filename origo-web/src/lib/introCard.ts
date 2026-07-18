/**
 * Intro Card renderer — the freshers-season growth loop.
 * ------------------------------------------------------
 * Produces a beautiful, shareable image (story 1080×1920 or square 1080×1080)
 * from a student's profile, designed to be posted to Instagram / WhatsApp during
 * admission season. Every card carries a QR + link back to the person's Origo
 * profile and a "Made with Origo" mark, so each share is a distribution surface.
 *
 * 100% client-side: draws on an offscreen <canvas> and exports a Blob via
 * canvas.toBlob(). No backend, no server render. See The Freshers Playbook memo.
 */

import QRCode from 'qrcode';

export type CardFormat = 'story' | 'square';

export interface CardTheme {
  id: string;
  label: string;
  from: string;
  to: string;
  ink: string;
}

export const CARD_THEMES: CardTheme[] = [
  { id: 'origo', label: 'Origo', from: '#6C3DFF', to: '#FF6B9D', ink: '#FFFFFF' },
  { id: 'midnight', label: 'Midnight', from: '#0D0D14', to: '#2A2A45', ink: '#FFFFFF' },
  { id: 'sunrise', label: 'Sunrise', from: '#F59E0B', to: '#FF6B9D', ink: '#1A1A2E' },
  { id: 'forest', label: 'Forest', from: '#10B981', to: '#6C3DFF', ink: '#FFFFFF' },
];

export interface IntroCardData {
  name: string;
  username: string;
  college: string;
  branchYear: string;   // e.g. "B.E. CSE · Batch of '30"
  hometown: string;
  interests: string[];   // labels, up to 5 shown
  promptLabel: string;   // e.g. "Hot take"
  promptAnswer: string;
  avatarUrl?: string | null;
  profileUrl: string;    // encoded into the QR + printed
  format: CardFormat;
  theme: CardTheme;
}

const DIMS: Record<CardFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Word-wrap `text` to `maxWidth`, returning the lines (respecting maxLines). */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  // Ellipsis if truncated
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length) last = last.slice(0, -1);
    if (last !== lines[maxLines - 1]) lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // keep canvas untainted so export works
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Render the card to a canvas and return both the canvas (for on-screen preview)
 * and a PNG data URL. Kept as one call so preview and export never drift.
 */
export async function renderIntroCard(data: IntroCardData): Promise<{ canvas: HTMLCanvasElement; dataUrl: string }> {
  const { w, h } = DIMS[data.format];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const pad = 90;
  const { from, to, ink } = data.theme;
  const dim = ink === '#FFFFFF';
  const subInk = dim ? 'rgba(255,255,255,0.72)' : 'rgba(26,26,46,0.72)';
  const chipBg = dim ? 'rgba(255,255,255,0.14)' : 'rgba(26,26,46,0.10)';

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft radial glow top-right
  const glow = ctx.createRadialGradient(w * 0.85, h * 0.12, 0, w * 0.85, h * 0.12, w * 0.6);
  glow.addColorStop(0, 'rgba(255,255,255,0.18)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const fontFamily = 'Poppins, Inter, system-ui, sans-serif';

  // Eyebrow
  ctx.fillStyle = subInk;
  ctx.font = `600 30px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ORIGO · MY INTRO CARD', pad, data.format === 'story' ? 150 : 120);

  // Avatar
  const avatarSize = data.format === 'story' ? 300 : 220;
  const avatarX = pad;
  const avatarY = data.format === 'story' ? 230 : 190;
  const img = data.avatarUrl ? await loadImage(data.avatarUrl) : null;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    // cover-fit
    const scale = Math.max(avatarSize / img.width, avatarSize / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, avatarX + (avatarSize - dw) / 2, avatarY + (avatarSize - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = ink;
    ctx.font = `700 ${avatarSize * 0.44}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((data.name[0] || '?').toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 4);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
  // Avatar ring
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Name + handle + meta block (below avatar)
  let y = avatarY + avatarSize + 90;
  ctx.fillStyle = ink;
  ctx.font = `700 76px ${fontFamily}`;
  for (const line of wrapLines(ctx, data.name, w - pad * 2, 2)) {
    ctx.fillText(line, pad, y);
    y += 84;
  }

  ctx.fillStyle = subInk;
  ctx.font = `500 38px ${fontFamily}`;
  ctx.fillText(`@${data.username}`, pad, y);
  y += 62;

  ctx.fillStyle = ink;
  ctx.font = `600 40px ${fontFamily}`;
  for (const line of wrapLines(ctx, data.college, w - pad * 2, 1)) { ctx.fillText(line, pad, y); y += 52; }
  ctx.fillStyle = subInk;
  ctx.font = `400 34px ${fontFamily}`;
  if (data.branchYear) { ctx.fillText(data.branchYear, pad, y); y += 46; }
  if (data.hometown) { ctx.fillText(`📍 ${data.hometown}`, pad, y); y += 46; }

  // Interest chips
  y += 26;
  ctx.font = `500 32px ${fontFamily}`;
  let chipX = pad;
  const chipH = 62, chipGap = 16, chipPadX = 28;
  for (const label of data.interests.slice(0, 6)) {
    const tw = ctx.measureText(label).width;
    const cw = tw + chipPadX * 2;
    if (chipX + cw > w - pad) { chipX = pad; y += chipH + chipGap; }
    ctx.fillStyle = chipBg;
    roundRect(ctx, chipX, y - chipH + 14, cw, chipH, chipH / 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.fillText(label, chipX + chipPadX, y);
    chipX += cw + chipGap;
  }
  y += chipH + 40;

  // Prompt / icebreaker card
  if (data.promptAnswer) {
    const boxX = pad, boxW = w - pad * 2;
    ctx.font = `italic 400 38px ${fontFamily}`;
    const answerLines = wrapLines(ctx, `“${data.promptAnswer}”`, boxW - 64, data.format === 'story' ? 4 : 2);
    const boxH = 40 + 40 + answerLines.length * 50 + 40;
    ctx.fillStyle = chipBg;
    roundRect(ctx, boxX, y, boxW, boxH, 32);
    ctx.fill();
    let ty = y + 62;
    ctx.fillStyle = subInk;
    ctx.font = `600 28px ${fontFamily}`;
    ctx.fillText(data.promptLabel.toUpperCase(), boxX + 32, ty);
    ty += 50;
    ctx.fillStyle = ink;
    ctx.font = `italic 400 38px ${fontFamily}`;
    for (const line of answerLines) { ctx.fillText(line, boxX + 32, ty); ty += 50; }
    y += boxH + 40;
  }

  // Footer: QR + "Made with Origo"
  const qrSize = 190;
  const qrY = h - pad - qrSize;
  try {
    const qrUrl = await QRCode.toDataURL(data.profileUrl, {
      margin: 1, width: qrSize, color: { dark: '#0D0D14', light: '#FFFFFF' },
    });
    const qrImg = await loadImage(qrUrl);
    if (qrImg) {
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, pad - 12, qrY - 12, qrSize + 24, qrSize + 24, 22);
      ctx.fill();
      ctx.drawImage(qrImg, pad, qrY, qrSize, qrSize);
    }
  } catch { /* QR is best-effort */ }

  ctx.fillStyle = ink;
  ctx.font = `700 40px ${fontFamily}`;
  ctx.fillText('Scan to connect', pad + qrSize + 44, qrY + 74);
  ctx.fillStyle = subInk;
  ctx.font = `400 32px ${fontFamily}`;
  const shortUrl = data.profileUrl.replace(/^https?:\/\//, '');
  ctx.fillText(wrapLines(ctx, shortUrl, w - pad * 2 - qrSize - 44, 1)[0] ?? shortUrl, pad + qrSize + 44, qrY + 120);
  ctx.font = `600 28px ${fontFamily}`;
  ctx.fillStyle = subInk;
  ctx.fillText('Made with Origo · your campus, verified', pad + qrSize + 44, qrY + 170);

  return { canvas, dataUrl: canvas.toDataURL('image/png') };
}

/** Trigger a browser download of the rendered card. */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Share the card via the Web Share API when available (mobile); returns false if unsupported. */
export async function shareCard(dataUrl: string, data: IntroCardData): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `${data.username}-origo-card.png`, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'My Origo intro card',
        text: `Find me on Origo — ${data.profileUrl}`,
      });
      return true;
    }
  } catch { /* fall through */ }
  return false;
}
