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
  /** 3–4 hex stops for a holographic-foil sweep gradient (not a flat 2-tone diagonal). */
  stops: string[];
  ink: string;
}

// Holographic-foil sweeps — same visual family as premium metal-card finishes
// (bright, multi-hue, glossy), tuned to Origo's own palette instead of a flat
// two-color diagonal. Every stop set is rooted in brand purple/pink plus one
// bright complementary hue so the four options read as a family, not a grab-bag.
export const CARD_THEMES: CardTheme[] = [
  { id: 'origo', label: 'Origo Holo', stops: ['#5EEAD4', '#6C3DFF', '#FF6B9D'], ink: '#FFFFFF' },
  { id: 'sunrise', label: 'Sunrise', stops: ['#FFD166', '#FF6B9D', '#8B5CF6'], ink: '#FFFFFF' },
  { id: 'aqua', label: 'Aqua Dream', stops: ['#22D3EE', '#818CF8', '#6C3DFF'], ink: '#FFFFFF' },
  { id: 'candy', label: 'Candy', stops: ['#F472B6', '#A78BFA', '#60A5FA'], ink: '#FFFFFF' },
];

/** A prompt as rendered on the card — same data as the profile, shown shorter. */
export interface CardPrompt {
  label: string;
  answer: string;
}

export interface IntroCardData {
  name: string;
  username: string;
  college: string;
  branchYear: string;   // e.g. "CSE · Batch of 2026"
  hometown: string;
  interests: string[];   // labels, up to 5 shown
  /** Up to 3; story fits 3, square fits 2. Long answers are trimmed to fit. */
  prompts: CardPrompt[];
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
  const { stops, ink } = data.theme;
  const subInk = 'rgba(255,255,255,0.72)';
  const chipBg = 'rgba(255,255,255,0.16)';

  // Holographic-foil background: a multi-stop diagonal sweep (not a flat
  // 2-tone gradient) — same visual family as a premium metal card's finish.
  const grad = ctx.createLinearGradient(0, 0, w, h);
  stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft radial glow, bottom-left, to balance the sheen band above
  const glow = ctx.createRadialGradient(w * 0.1, h * 0.92, 0, w * 0.1, h * 0.92, w * 0.55);
  glow.addColorStop(0, 'rgba(255,255,255,0.16)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Glossy diagonal sheen band, like light catching brushed foil
  const sheen = ctx.createLinearGradient(0, h * 0.05, w, h * 0.35);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.22)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Fine brushed-foil texture: closely-spaced, near-transparent diagonal
  // hairlines. Cheap enough for the 220ms debounced re-render.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  const span = Math.hypot(w, h);
  for (let x = -span; x <= span; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, -span);
    ctx.lineTo(x, span);
    ctx.stroke();
  }
  ctx.restore();

  // Abstract swoosh flourish (the card's one bold graphic accent, echoing the
  // signature-swash look of a premium card design) — kept low-opacity and
  // tucked in the top-right negative space so it never fights the text.
  // Kept very low-opacity: at higher values the hard edge reads as a rendering
  // artifact rather than an intentional flourish.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#1A1A2E';
  ctx.beginPath();
  ctx.moveTo(w * 0.62, -h * 0.02);
  ctx.bezierCurveTo(w * 0.78, h * 0.22, w * 0.58, h * 0.30, w * 0.74, h * 0.5);
  ctx.bezierCurveTo(w * 0.86, h * 0.64, w * 0.7, h * 0.7, w * 0.82, h * 0.86);
  ctx.lineTo(w * 1.02, h * 0.86);
  ctx.lineTo(w * 1.02, -h * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const fontFamily = 'Poppins, Inter, system-ui, sans-serif';

  // Eyebrow
  ctx.fillStyle = subInk;
  ctx.font = `600 30px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ORIGO · MY INTRO CARD', pad, data.format === 'story' ? 150 : 120);

  // The square format has ~44% less vertical room than story at the same
  // width, so every vertical step is scaled — without this the content block
  // runs past the canvas and the footer paints over the interest chips.
  const story = data.format === 'story';
  const s = story ? 1 : 0.78;
  const px = (n: number) => Math.round(n * s);

  // Footer geometry is reserved up-front so content can be budgeted against it.
  const qrSize = px(190);
  const qrY = h - pad - qrSize;
  const contentLimit = qrY - px(46);

  // Avatar
  const avatarSize = story ? 340 : 150;
  const avatarX = pad;
  const avatarY = story ? 230 : 150;
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
  // Gap must clear the name's ascender — fillText draws from the baseline, so
  // too small a gap silently overlaps the avatar above it.
  let y = avatarY + avatarSize + (story ? 84 : px(112));
  ctx.fillStyle = ink;
  ctx.font = `700 ${px(92)}px ${fontFamily}`;
  for (const line of wrapLines(ctx, data.name, w - pad * 2, 2)) {
    ctx.fillText(line, pad, y);
    y += px(100);
  }

  ctx.fillStyle = subInk;
  ctx.font = `500 ${px(38)}px ${fontFamily}`;
  ctx.fillText(`@${data.username}`, pad, y);
  y += px(64);

  // Meta collapsed onto one line — three stacked micro-lines read as a form.
  ctx.fillStyle = ink;
  ctx.font = `600 ${px(38)}px ${fontFamily}`;
  for (const line of wrapLines(ctx, data.college, w - pad * 2, 1)) { ctx.fillText(line, pad, y); y += px(50); }
  const metaBits = [data.branchYear, data.hometown ? `📍 ${data.hometown}` : ''].filter(Boolean);
  if (metaBits.length) {
    ctx.fillStyle = subInk;
    ctx.font = `400 ${px(34)}px ${fontFamily}`;
    for (const line of wrapLines(ctx, metaBits.join('  ·  '), w - pad * 2, 1)) { ctx.fillText(line, pad, y); y += px(48); }
  }

  // Interest chips — stop adding rows once they'd collide with the footer.
  y += px(30);
  ctx.font = `500 ${px(32)}px ${fontFamily}`;
  let chipX = pad;
  const chipH = px(62), chipGap = px(16), chipPadX = px(28);
  // Square is vertically tight — cap chips to one row so the prompts, which
  // are the better content, still get their space.
  for (const label of data.interests.slice(0, story ? 6 : 3)) {
    const cw = ctx.measureText(label).width + chipPadX * 2;
    if (chipX + cw > w - pad) {
      if (y + chipH + chipGap > contentLimit) break;
      chipX = pad;
      y += chipH + chipGap;
    }
    ctx.fillStyle = chipBg;
    roundRect(ctx, chipX, y - chipH + px(14), cw, chipH, chipH / 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.fillText(label, chipX + chipPadX, y);
    chipX += cw + chipGap;
  }
  y += chipH + px(34);

  // Prompt cards — the part people actually read, so they get the space and
  // the weight. Each is its own panel so three answers scan as three distinct
  // thoughts rather than a paragraph. Shortest-first, so the most card-friendly
  // answers win the room when not all of them fit.
  const boxX = pad, boxW = w - pad * 2;
  // Chrome kept tight on purpose: generous padding looks better on one card
  // but costs a whole prompt slot, and three thoughts beat one roomy one.
  const lineH = px(50);
  const boxPadTop = px(28), boxPadBottom = px(26), labelGap = px(38);
  const boxChrome = boxPadTop + labelGap + boxPadBottom;
  const gap = px(20);

  const ordered = [...data.prompts]
    .filter((p) => p.answer.trim())
    .sort((a, b) => a.answer.length - b.answer.length)
    .slice(0, story ? 3 : 2);

  // Distribute leftover vertical room *before* the prompts rather than leaving
  // a dead gap above the footer — a story card that stops two-thirds down
  // reads as unfinished, which is fatal for something meant to be posted.
  if (ordered.length > 0) {
    ctx.font = `italic 500 ${px(44)}px ${fontFamily}`;
    const projected = ordered.reduce((sum, p) => {
      const lines = wrapLines(ctx, p.answer, boxW - px(72), 2);
      return sum + boxChrome + lines.length * lineH + gap;
    }, 0);
    const slack = contentLimit - y - projected;
    if (slack > 0) y += Math.min(slack * 0.6, px(60));
  }

  for (const prompt of ordered) {
    if (contentLimit - y < boxChrome + lineH) break;

    ctx.font = `italic 500 ${px(44)}px ${fontFamily}`;
    // Square only has room for one prompt, so let that one breathe across more
    // lines — a single short box floating above a large gap looks unfinished.
    const roomForLines = Math.floor((contentLimit - y - boxChrome) / lineH);
    const maxLines = Math.max(1, Math.min(story ? 2 : 3, roomForLines));
    const answerLines = wrapLines(ctx, prompt.answer, boxW - px(72), maxLines);
    const boxH = boxChrome + answerLines.length * lineH;

    ctx.fillStyle = chipBg;
    roundRect(ctx, boxX, y, boxW, boxH, px(30));
    ctx.fill();

    let ty = y + boxPadTop + px(18);
    ctx.fillStyle = subInk;
    ctx.font = `600 ${px(26)}px ${fontFamily}`;
    ctx.letterSpacing = `${px(2)}px`;
    ctx.fillText(prompt.label.toUpperCase(), boxX + px(36), ty);
    ctx.letterSpacing = '0px';
    ty += labelGap;
    ctx.fillStyle = ink;
    ctx.font = `italic 500 ${px(44)}px ${fontFamily}`;
    for (const line of answerLines) { ctx.fillText(line, boxX + px(36), ty); ty += lineH; }

    y += boxH + gap;
  }

  // Footer: QR + "Made with Origo"
  try {
    const qrUrl = await QRCode.toDataURL(data.profileUrl, {
      margin: 1, width: qrSize, color: { dark: '#0D0D14', light: '#FFFFFF' },
    });
    const qrImg = await loadImage(qrUrl);
    if (qrImg) {
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, pad - px(12), qrY - px(12), qrSize + px(24), qrSize + px(24), px(22));
      ctx.fill();
      ctx.drawImage(qrImg, pad, qrY, qrSize, qrSize);
    }
  } catch { /* QR is best-effort */ }

  const footX = pad + qrSize + px(44);
  ctx.fillStyle = ink;
  ctx.font = `700 ${px(40)}px ${fontFamily}`;
  ctx.fillText('Scan to connect', footX, qrY + px(74));
  ctx.fillStyle = subInk;
  ctx.font = `400 ${px(32)}px ${fontFamily}`;
  const shortUrl = data.profileUrl.replace(/^https?:\/\//, '');
  ctx.fillText(wrapLines(ctx, shortUrl, w - pad - footX, 1)[0] ?? shortUrl, footX, qrY + px(120));
  ctx.font = `600 ${px(28)}px ${fontFamily}`;
  ctx.fillStyle = subInk;
  ctx.fillText('Made with Origo · your campus, verified', footX, qrY + px(170));

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
