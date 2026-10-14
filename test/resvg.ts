import { Resvg, type ResvgRenderOptions } from '@resvg/resvg-js';

/**
 * Renders without system fonts. resvg scans them by default, which takes
 * 5–17 s on a Windows CI runner and times tests out. Tests render through
 * this helper; resvg-in-tests.test.ts keeps it that way.
 */
export function renderNoFonts(svg: string, options: Omit<ResvgRenderOptions, 'font'> = {}) {
  return new Resvg(svg, { ...options, font: { loadSystemFonts: false } }).render();
}
