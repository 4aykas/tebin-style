import { hexToRgb } from './colors-csv.js';

/** WCAG 2.x relative luminance. Opaque hex only — see contrastRatio. */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) throw new Error(`not an opaque hex colour: ${hex}`);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio, 1 to 21.
 *
 * Both values must be opaque. A translucent colour has no ratio until it is
 * composited over something, and guessing that background is how a contrast
 * checker starts reporting numbers nobody can act on.
 */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA for normal-size text. */
export const AA_NORMAL = 4.5;
