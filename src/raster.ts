import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

export const LADDER = {
  logo: [512, 1024, 2048],
  pattern: [128, 256, 512],
} as const;

export interface RasterOutput {
  assetId: string;
  source: string;
  sourceSha256: string;
  width: number;
  height: number;
  variant: string;
  path: string;
  sha256: string;
}

export interface RasterManifest {
  outputs: RasterOutput[];
}

interface ThemeAsset {
  id: string;
  type: string;
  variant?: string;
  format: string;
  path: string;
}

export function sha256OfFile(absPath: string): string {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}

function themeColors(themeDir: string): Record<string, string> {
  const tokens = JSON.parse(readFileSync(join(themeDir, 'tokens.json'), 'utf8')) as {
    color?: Record<string, { $value?: string }>;
  };
  const out: Record<string, string> = {};
  for (const [name, leaf] of Object.entries(tokens.color ?? {})) {
    if (typeof leaf.$value === 'string') out[name] = leaf.$value;
  }
  return out;
}

/**
 * Background variants for a white asset. A white logo on transparency is
 * invisible in file previews and in Word's insert dialog, so it never gets one.
 */
function backgroundsFor(
  asset: ThemeAsset,
  colors: Record<string, string>,
): Array<{ variant: string; background: string | null }> {
  if (asset.variant !== 'white') return [{ variant: 'transparent', background: null }];
  const charcoal = colors.charcoal ?? colors.ink;
  const out: Array<{ variant: string; background: string | null }> = [];
  if (colors.brand) out.push({ variant: 'on-brand', background: colors.brand });
  if (charcoal) out.push({ variant: 'on-charcoal', background: charcoal });
  return out;
}

function widthsFor(asset: ThemeAsset): readonly number[] {
  return asset.type === 'logo' ? LADDER.logo : LADDER.pattern;
}

/**
 * Clear space around the mark on a coloured tile, as a fraction of the
 * viewBox height. The brand rule is "at least the height of the B", and in
 * logo-full.svg the B stands 116 units tall in a 166-unit viewBox — 0.7.
 */
export const CLEAR_SPACE_RATIO = 0.7;

/**
 * Wraps an SVG in a padded tile so a background variant honours the brand's
 * clear-space rule. Without this the letters touch the tile's edges — exactly
 * what a Word user would then paste into a document.
 */
export function padSvg(svg: string): string {
  const m = /viewBox\s*=\s*"([\d.\s+-]+)"/.exec(svg);
  if (!m) return svg;
  const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number);
  if ([x, y, w, h].some((n) => !Number.isFinite(n)) || w <= 0 || h <= 0) return svg;
  const pad = h * CLEAR_SPACE_RATIO;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 2 * pad} ${h + 2 * pad}">` +
    `<svg x="${pad}" y="${pad}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">` +
    svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') +
    `</svg></svg>`
  );
}

export function plannedOutputs(themeDir: string): Array<{
  assetId: string;
  source: string;
  width: number;
  variant: string;
  background: string | null;
  path: string;
}> {
  const theme = JSON.parse(readFileSync(join(themeDir, 'theme.json'), 'utf8')) as { assets?: ThemeAsset[] };
  const colors = themeColors(themeDir);
  const planned = [];

  for (const asset of theme.assets ?? []) {
    if (asset.format !== 'svg') continue;
    for (const width of widthsFor(asset)) {
      for (const { variant, background } of backgroundsFor(asset, colors)) {
        const suffix = variant === 'transparent' ? '' : `-${variant}`;
        planned.push({
          assetId: asset.id,
          source: asset.path,
          width,
          variant,
          background,
          path: `assets/png/${asset.id}-${width}${suffix}.png`,
        });
      }
    }
  }
  return planned.sort((a, b) => a.path.localeCompare(b.path));
}

export async function buildRaster(themeDir: string): Promise<RasterManifest> {
  const planned = plannedOutputs(themeDir);
  if (planned.length === 0) return { outputs: [] };
  mkdirSync(join(themeDir, 'assets', 'png'), { recursive: true });
  const outputs: RasterOutput[] = [];

  for (const item of planned) {
    const sourceAbs = join(themeDir, item.source);
    const raw = readFileSync(sourceAbs, 'utf8');
    // A coloured tile gets clear space per the brand rule; a transparent PNG
    // stays tight so it can be placed against the target's own spacing.
    const svg = item.background ? padSvg(raw) : raw;
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: item.width },
      ...(item.background ? { background: item.background } : {}),
    });
    const rendered = resvg.render();
    const outAbs = join(themeDir, item.path);
    writeFileSync(outAbs, rendered.asPng());
    outputs.push({
      assetId: item.assetId,
      source: item.source,
      sourceSha256: sha256OfFile(sourceAbs),
      width: rendered.width,
      height: rendered.height,
      variant: item.variant,
      path: item.path,
      sha256: sha256OfFile(outAbs),
    });
  }

  const manifest: RasterManifest = { outputs };
  writeFileSync(join(themeDir, 'assets', 'png', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export function readManifest(themeDir: string): RasterManifest | null {
  try {
    return JSON.parse(readFileSync(join(themeDir, 'assets', 'png', 'manifest.json'), 'utf8')) as RasterManifest;
  } catch {
    return null;
  }
}
