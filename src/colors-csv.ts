import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const NO_PRINT_VALUE = 'not specified in the 2017 brand book';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parses #RGB / #RRGGBB. Returns null for anything else (rgba(), var(), …). */
export function hexToRgb(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

interface Leaf {
  $type?: string;
  $value?: string;
  $description?: string;
  $extensions?: { 'pro.tebin.print'?: { pantone?: string; cmyk?: string } };
}

export interface ColorRow {
  token: string;
  hex: string;
  rgb: Rgb;
  pantone: string;
  cmyk: string;
  purpose: string;
}

/**
 * Opaque hex colour tokens of a theme, in source order, as `color.brand` paths.
 * The translucent scale (rgba values) is deliberately excluded: an rgba()
 * string in a spreadsheet cell helps nobody — DESIGN.md documents it instead.
 */
export function collectColorRows(themeDir: string): ColorRow[] {
  const tokens = JSON.parse(readFileSync(join(themeDir, 'tokens.json'), 'utf8')) as Record<string, unknown>;
  const rows: ColorRow[] = [];

  const walk = (node: Record<string, unknown>, path: string[]): void => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$') || typeof value !== 'object' || value === null) continue;
      const leaf = value as Leaf;
      const here = [...path, key];
      if (leaf.$type === 'color' && typeof leaf.$value === 'string') {
        const rgb = hexToRgb(leaf.$value);
        if (!rgb) continue; // translucent scale — deliberately excluded
        const print = leaf.$extensions?.['pro.tebin.print'];
        rows.push({
          token: here.join('.'),
          hex: leaf.$value.toUpperCase(),
          rgb,
          pantone: print?.pantone ?? NO_PRINT_VALUE,
          cmyk: print?.cmyk ?? NO_PRINT_VALUE,
          purpose: leaf.$description ?? '',
        });
        continue;
      }
      if (!leaf.$type) walk(value as Record<string, unknown>, here);
    }
  };

  walk(tokens, []);
  return rows;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildColorsCsv(themeDir: string): string {
  const header = 'token,hex,r,g,b,pantone,cmyk,purpose';
  const lines = collectColorRows(themeDir).map((row) =>
    [
      row.token,
      row.hex,
      String(row.rgb.r),
      String(row.rgb.g),
      String(row.rgb.b),
      csvCell(row.pantone),
      csvCell(row.cmyk),
      csvCell(row.purpose),
    ].join(','),
  );
  return [header, ...lines].join('\n') + '\n';
}

export function writeColorsCsv(themeDir: string): void {
  mkdirSync(join(themeDir, 'dist'), { recursive: true });
  writeFileSync(join(themeDir, 'dist', 'colors.csv'), buildColorsCsv(themeDir));
}
