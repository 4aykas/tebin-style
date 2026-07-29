import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildRaster } from '../src/raster.js';
import { writePalettePreview } from '../src/palette-preview.js';
import { writeDesignDoc } from '../src/design-doc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');

if (!existsSync(themesRoot)) {
  console.log('no themes/ directory yet — nothing to rasterize');
  process.exit(0);
}

for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const themeDir = join(themesRoot, entry.name);
  const manifest = await buildRaster(themeDir);
  await writePalettePreview(themeDir);
  writeDesignDoc(themeDir); // reads the raster manifest — must come after buildRaster
  console.log(`rasterized ${entry.name}: ${manifest.outputs.length} file(s) + palette preview + DESIGN.md`);
}
