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
  // Fraunces carries the one hero prompt — a warm, high-personality serif
  // italic set against Poppins' geometric sans, so the card has a real focal
  // point instead of every text element using the same typeface.
  const quoteFontFamily = 'Fraunces, Georgia, serif';

  // ctx.font does not trigger a font load — an unrequested weight/style
  // silently falls back to the platform default with no error. This is why
  // every italic prompt was rendering in a generic system italic before this
  // fix: index.html never loaded an italic Poppins weight, so "italic 500
  // Poppins" resolved to whatever the OS default italic happens to be.
  await Promise.all([
    document.fonts.load(`700 92px Poppins`),
    document.fonts.load(`600 40px Poppins`),
    document.fonts.load(`500 38px Poppins`),
    document.fonts.load(`400 34px Poppins`),
    document.fonts.load(`600 26px Poppins`),
    document.fonts.load(`italic 500 40px Poppins`),
    document.fonts.load(`italic 600 56px ${quoteFontFamily}`),
    document.fonts.load(`italic 500 140px ${quoteFontFamily}`),
  ]).catch(() => { /* best-effort — draw proceeds with whatever loaded */ });

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

  // Prompts — one hero pull-quote plus compact supporting lines, rather than
  // three identical boxes. A single strong focal point reads as designed;
  // three equal-weight panels reads as a form. Shortest-first so the most
  // card-friendly answer becomes the hero and wins the most generous layout.
  const boxX = pad, boxW = w - pad * 2;
  const gap = px(26);
  const heroFontPx = story ? 54 : 42;
  const heroLineH = px(story ? 66 : 52);
  const heroMaxLines = story ? 3 : 2;
  const pillH = px(64);

  const ordered = [...data.prompts]
    .filter((p) => p.answer.trim())
    .sort((a, b) => a.answer.length - b.answer.length);
  const hero = ordered[0];
  const secondary = ordered.slice(1, story ? 3 : 2);

  // Predict the block's total height before drawing anything, so leftover
  // room can be pushed in *above* it as breathing space instead of leaking
  // out as a dead gap over the footer. This is what makes a 1-prompt card
  // (the common case — most people fill in one before they fill in three)
  // look intentional rather than sparse.
  if (hero || secondary.length > 0) {
    let predicted = 0;
    if (hero) {
      ctx.font = `italic 600 ${px(heroFontPx)}px ${quoteFontFamily}`;
      const lines = wrapLines(ctx, hero.answer, boxW - px(30), heroMaxLines).length;
      predicted += px(78) + (lines - 1) * heroLineH + px(6) + px(30) + gap + px(10);
    }
    predicted += secondary.length * (pillH + px(14));
    const slack = contentLimit - y - predicted;
    if (slack > 0) y += Math.min(slack * 0.7, px(140));
  }

  if (hero) {
    // Decorative opening-quote glyph, low-opacity, sitting behind the text as
    // a pull-quote flourish rather than framed in its own box.
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = ink;
    ctx.font = `italic 500 ${px(150)}px ${quoteFontFamily}`;
    ctx.fillText('“', boxX - px(14), y + px(96));
    ctx.restore();

    ctx.font = `italic 600 ${px(heroFontPx)}px ${quoteFontFamily}`;
    const heroLines = wrapLines(ctx, hero.answer, boxW - px(30), heroMaxLines);

    let ty = y + px(78);
    ctx.fillStyle = ink;
    for (const line of heroLines) { ctx.fillText(line, boxX + px(48), ty); ty += heroLineH; }

    ty += px(6);
    ctx.fillStyle = subInk;
    ctx.font = `600 ${px(24)}px ${fontFamily}`;
    ctx.letterSpacing = `${px(2)}px`;
    ctx.fillText(`— ${hero.label.toUpperCase()}`, boxX + px(48), ty);
    ctx.letterSpacing = '0px';

    y = ty + gap + px(10);
  }

  // Secondary prompts: compact single-line pills — "LABEL · answer" — clearly
  // supporting cast next to the hero rather than competing with it.
  for (const prompt of secondary) {
    if (contentLimit - y < pillH) break;

    ctx.fillStyle = chipBg;
    roundRect(ctx, boxX, y, boxW, pillH, pillH / 2);
    ctx.fill();

    ctx.fillStyle = subInk;
    ctx.font = `600 ${px(24)}px ${fontFamily}`;
    const labelText = prompt.label.toUpperCase();
    ctx.fillText(labelText, boxX + px(30), y + px(40));
    const labelW = ctx.measureText(labelText).width;

    ctx.fillStyle = ink;
    ctx.font = `italic 500 ${px(30)}px ${fontFamily}`;
    const answerX = boxX + px(30) + labelW + px(16);
    const [answerLine] = wrapLines(ctx, prompt.answer, boxW - px(60) - labelW - px(16), 1);
    ctx.fillText(answerLine ?? '', answerX, y + px(40));

    y += pillH + px(14);
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
