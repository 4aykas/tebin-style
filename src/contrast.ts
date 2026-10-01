import { hexToRgb } from './colors-csv.js';

/** WCAG 2.x relative luminance. Opaque hex only — see contrastRatio. */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) throw new Error(`not an opaque hex colour: ${hex}`);
  const linear = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b);
}

/**
 * WCAG contrast ratio, 1 to 21.
 *
 * Both values must be opaque. A translucent colour has no ratio until it is
 * composited over something, and guessing that background is how a contrast
 * checker starts reporting numbers nobody can act on.
 */
export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** WCAG AA for normal-size text. */
export const AA_NORMAL = 4.5;
