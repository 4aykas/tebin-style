import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { decodePng, type Rgba } from './png.js';
import { collectColorRows, type ColorRow, type Rgb } from './colors-csv.js';

/** Default ΔE2000 above which a colour counts as off-palette. */
export const DEFAULT_THRESHOLD = 10;
/** Share of opaque pixels a colour needs to be reported: antialiasing stays below it. */
export const MIN_SHARE = 0.005;
/** Coverage below this means the image is mostly gradients or photo. */
const PHOTO_COVERAGE = 0.6;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_COLORS = 24;

export interface ImageColor {
  hex: string;
  share: number;
  nearest: { token: string; hex: string };
  deltaE: number;
  onPalette: boolean;
}

export interface ImageCheckResult {
  theme: string;
  width: number;
  height: number;
  threshold: number;
  colors: ImageColor[];
  offPalette: number;
  coverage: number;
  note?: string;
}

const toHex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/** sRGB (D65) to CIELAB. */
export function toLab({ r, g, b }: Rgb): [number, number, number] {
  const lin = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIEDE2000 colour difference (Sharma, Wu and Dalal 2005). */
export function deltaE2000(a: [number, number, number], b: [number, number, number]): number {
  const [L1, a1, b1] = a, [L2, a2, b2] = b;
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hue = (bb: number, ap: number) => (bb === 0 && ap === 0 ? 0 : (Math.atan2(bb, ap) / rad + 360) % 360);
  const h1p = hue(b1, a1p), h2p = hue(b2, a2p);
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lm = (L1 + L2) / 2, Cmp = (C1p + C2p) / 2;
  let hm = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hm += h1p + h2p < 360 ? 360 : -360;
    hm /= 2;
  }
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad)
    + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2);
  const SC = 1 + 0.045 * Cmp, SH = 1 + 0.015 * Cmp * T;
  const RT = -2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH));
}

/**
 * The image's main colours, by share of opaque pixels. Pixels are binned at
 * 5 bits a channel; each bin reports its mean, and a bin within ΔE 3 of a
 * larger one joins it, so compression noise does not split one colour in two.
 */
export function dominantColors(image: Rgba): { opaque: number; colors: Array<{ rgb: Rgb; share: number }> } {
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>();
  let opaque = 0;
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 128) continue;
    opaque++;
    const [r, g, b] = [data[i]!, data[i + 1]!, data[i + 2]!];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bin = bins.get(key);
    if (bin) { bin.n++; bin.r += r; bin.g += g; bin.b += b; } else bins.set(key, { n: 1, r, g, b });
  }
  if (!opaque) return { opaque, colors: [] };

  // Bins under a tenth of the reporting share cannot change the answer much,
  // and on a photo there are thousands of them: merging those would be quadratic.
  const floor = opaque * MIN_SHARE * 0.1;
  const merged: Array<{ rgb: Rgb; lab: [number, number, number]; n: number }> = [];
  for (const bin of [...bins.values()].filter((b) => b.n >= floor).sort((x, y) => y.n - x.n)) {
    const rgb = { r: Math.round(bin.r / bin.n), g: Math.round(bin.g / bin.n), b: Math.round(bin.b / bin.n) };
    const lab = toLab(rgb);
    const home = merged.find((m) => deltaE2000(m.lab, lab) < 3);
    if (home) home.n += bin.n; else merged.push({ rgb, lab, n: bin.n });
  }
  const colors = merged.map(({ rgb, n }) => ({ rgb, share: n / opaque }))
    .filter((c) => c.share >= MIN_SHARE).sort((x, y) => y.share - x.share).slice(0, MAX_COLORS);
  return { opaque, colors };
}

/** Compares an image's main colours with a theme's palette. */
export function checkImage(image: Rgba, theme: string, palette: ColorRow[],
  threshold = DEFAULT_THRESHOLD): ImageCheckResult {
  const swatches = palette.map(({ token, hex, rgb }) => ({ token, hex, lab: toLab(rgb) }));
  if (!swatches.length) throw new Error(`theme "${theme}" has no palette colours`);

  const { opaque, colors: main } = dominantColors(image);
  const colors = main.map(({ rgb, share }) => {
    const lab = toLab(rgb);
    const best = swatches.map((s) => ({ s, d: deltaE2000(lab, s.lab) })).sort((x, y) => x.d - y.d)[0]!;
    const deltaE = Math.round(best.d * 10) / 10;
    return { hex: toHex(rgb), share: Math.round(share * 1000) / 1000,
      nearest: { token: best.s.token, hex: best.s.hex }, deltaE, onPalette: deltaE <= threshold };
  });
  const coverage = Math.round(colors.reduce((sum, c) => sum + c.share, 0) * 1000) / 1000;
  return {
    theme, width: image.width, height: image.height, threshold, colors,
    offPalette: colors.filter((c) => !c.onPalette).length, coverage,
    ...(opaque === 0 ? { note: 'The image has no opaque pixels.' }
      : coverage < PHOTO_COVERAGE ? { note: 'Most pixels fall outside the main colours: likely a photo or gradient. The findings cover the main colours only.' }
      : {}),
  };
}

/** Reads a local PNG and checks it against a theme directory's palette. */
export function checkImageFile(path: string, theme: string, themeDir: string, threshold?: number): ImageCheckResult {
  if (extname(path).toLowerCase() !== '.png') throw new Error('only PNG is supported; export the image as PNG');
  if (statSync(path).size > MAX_FILE_BYTES) throw new Error('the file is over 50 MB');
  return checkImage(decodePng(readFileSync(path)), theme, collectColorRows(themeDir), threshold);
}
