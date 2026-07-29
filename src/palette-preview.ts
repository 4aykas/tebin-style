import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { collectColorRows, hexToRgb } from './colors-csv.js';

const SWATCH = 120;
const GAP = 8;
const LABEL_HEIGHT = 34;

/** Black or white label, whichever clears contrast on the swatch. */
function labelColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? '#000000' : '#FFFFFF';
}

export function buildPaletteSvg(themeDir: string): string {
  const rows = collectColorRows(themeDir);
  const width = rows.length * SWATCH + (rows.length - 1) * GAP;
  const height = SWATCH + LABEL_HEIGHT;
  const parts = rows.map((row, i) => {
    const x = i * (SWATCH + GAP);
    const name = row.token.replace(/^color\./, '');
    return (
      `  <rect x="${x}" y="0" width="${SWATCH}" height="${SWATCH}" fill="${row.hex}" />\n` +
      `  <text x="${x + 10}" y="${SWATCH - 14}" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="${labelColor(row.hex)}">${name}</text>\n` +
      `  <text x="${x + 10}" y="${SWATCH + 20}" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#666666">${row.hex}</text>`
    );
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n` +
    parts.join('\n') +
    `\n</svg>\n`
  );
}

/**
 * Unlike the logos, this SVG carries <text>, so its PNG depends on a font
 * being present at render time. Acceptable for a decorative preview — and one
 * more reason palette.png is never byte-compared.
 */
export async function writePalettePreview(themeDir: string): Promise<void> {
  const svg = buildPaletteSvg(themeDir);
  const dir = join(themeDir, 'preview');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'palette.svg'), svg);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1600 }, background: '#FFFFFF' });
  writeFileSync(join(dir, 'palette.png'), resvg.render().asPng());
}
