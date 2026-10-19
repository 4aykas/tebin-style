import { hexToRgb } from './colors-csv.js';
import { resolveString, type TokenTree } from './tokens.js';

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

/**
 * Whether a look is dark: its `role.surface` reads better against white than
 * against black. Null when the surface is missing or not an opaque hex.
 */
export function surfaceIsDark(tokens: TokenTree): boolean | null {
  const surface = resolveString(tokens, ((tokens.role ?? {}) as Record<string, { $value?: unknown }>).surface?.$value);
  if (!surface || !hexToRgb(surface)) return null;
  return contrastRatio(surface, '#000000') < contrastRatio(surface, '#FFFFFF');
}

/** WCAG AA for normal-size text. */
export const AA_NORMAL = 4.5;

/** The floors a contrast pair may set: non-text (WCAG 1.4.11), text, AAA text. */
export const PAIR_FLOORS = [3, 4.5, 7] as const;

/** A named contrast check in theme.json. `min` is the ratio it must reach. */
export interface ContrastPair { foreground: string; background: string; min?: number }
