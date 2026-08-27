import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { collectColorRows, NO_PRINT_VALUE } from './colors-csv.js';
import { readManifest } from './raster.js';
import { filterRules, type Rule } from './rules.js';
import { buildFrontMatter } from './front-matter.js';

export const BLOB_BASE = 'https://github.com/4aykas/tebin-style/blob/main';
export const RAW_BASE = 'https://raw.githubusercontent.com/4aykas/tebin-style/main';
export const DOC_CATEGORIES = ['brand', 'typography', 'theming'];

interface ThemeManifest {
  id: string;
  name: string;
  description?: string;
  version: string;
  license: { tokens: string; assets: string };
  source?: { url?: string };
  assets?: Array<{ id: string; type: string; variant?: string; format: string; path: string }>;
}

/** A human-facing download link: the blob page renders a preview and offers Download. */
function download(themeId: string, repoRelPath: string): string {
  return `${BLOB_BASE}/themes/${themeId}/${repoRelPath}?raw=1`;
}

/** A script/agent link: raw bytes, no HTML around them. */
function raw(themeId: string, repoRelPath: string): string {
  return `${RAW_BASE}/themes/${themeId}/${repoRelPath}`;
}

function readTokens(themeDir: string): Record<string, any> {
  return JSON.parse(readFileSync(join(themeDir, 'tokens.json'), 'utf8'));
}

function tokenTable(themeDir: string): string {
  const rows = collectColorRows(themeDir);
  let out = '| Token | HEX | RGB (Word, Excel) | Pantone | CMYK | Purpose |\n';
  out += '| --- | --- | --- | --- | --- | --- |\n';
  for (const row of rows) {
    const rgb = `${row.rgb.r}, ${row.rgb.g}, ${row.rgb.b}`;
    out += `| \`${row.token}\` | \`${row.hex}\` | ${rgb} | ${row.pantone} | ${row.cmyk} | ${row.purpose || '—'} |\n`;
  }
  return out;
}

function translucentNote(themeDir: string, themeId: string): string {
  const tokens = readTokens(themeDir);
  const groups = ['on-dark', 'on-light', 'rule-dark', 'rule-light', 'surface-dark'].filter((g) => g in tokens);
  if (groups.length === 0) return '';
  return (
    `\n### Translucent scale\n\n` +
    `Every semi-transparent colour comes from a step, never from an ad-hoc alpha; step 1 is always the strongest. ` +
    `Groups present in this theme: ${groups.map((g) => `\`${g}\``).join(', ')}. ` +
    `The steps below the contrast floor are for decoration, not for type. ` +
    `Full values: [tokens.json](${raw(themeId, 'tokens.json')}).\n`
  );
}

function typeSection(themeDir: string): string {
  const tokens = readTokens(themeDir) as {
    font?: Record<string, { $value?: string[]; $description?: string }>;
    fontWeight?: Record<string, { $value?: number }>;
  };
  let out = '\n## Typography\n\n';
  for (const [name, leaf] of Object.entries(tokens.font ?? {})) {
    out += `- **${name}** — ${(leaf.$value ?? []).join(', ')}${leaf.$description ? ` — ${leaf.$description}` : ''}\n`;
  }
  const weights = Object.entries(tokens.fontWeight ?? {});
  if (weights.length) {
    out += `- **Weights** — ${weights.map(([n, l]) => `${n} ${l.$value}`).join(', ')}\n`;
  }
  out += `\nIn Word, Excel, PowerPoint and Google Docs use **Arial**. It is the brand book's own substitute where Roboto is unavailable, and it is installed everywhere.\n`;
  return out;
}

function geometrySection(themeDir: string): string {
  const tokens = readTokens(themeDir) as { radius?: Record<string, { $value?: string }> };
  const radii = Object.entries(tokens.radius ?? {});
  if (!radii.length) return '';
  return `\n## Geometry\n\n${radii.map(([n, l]) => `- \`radius.${n}\` — ${l.$value}`).join('\n')}\n`;
}

function roleSection(themeDir: string): string {
  const tokens = readTokens(themeDir) as {
    role?: Record<string, { $value?: string; $description?: string }>;
  };
  const roles = Object.entries(tokens.role ?? {});
  if (!roles.length) return '';
  let out =
    '\n## Roles\n\nA role is a pointer, not a copy — change the colour it names and every role using it follows.\n\n';
  out += '| Role | Points at | Use for |\n| --- | --- | --- |\n';
  for (const [name, leaf] of roles) {
    const target = (leaf.$value ?? '').replace(/^\{|\}$/g, '');
    out += `| \`role.${name}\` | \`${target}\` | ${leaf.$description ?? '—'} |\n`;
  }
  return out;
}

function typeScaleSection(themeDir: string): string {
  const tokens = readTokens(themeDir) as {
    type?: Record<string, {
      $value?: string;
      $extensions?: Record<string, { min: string; pref: string; max: string }>;
    }>;
    lineHeight?: Record<string, { $value?: number }>;
    fontWeight?: Record<string, { $value?: number }>;
  };
  const levels = Object.entries(tokens.type ?? {});
  if (!levels.length) return '';
  let out = '\n### Scale\n\n| Level | Size | Fluid range |\n| --- | --- | --- |\n';
  for (const [name, leaf] of levels) {
    const fluid = leaf.$extensions?.['pro.tebin.fluid'];
    const range = fluid ? `\`clamp(${fluid.min}, ${fluid.pref}, ${fluid.max})\`` : 'fixed';
    out += `| \`type.${name}\` | ${leaf.$value} | ${range} |\n`;
  }
  out +=
    '\nWhere a level shows a fluid range, the size column is its **ceiling**, not a fixed size. Display type is sized against the locale with the longest words — a range that fits English alone is an English-only cap.\n';
  const lh = Object.entries(tokens.lineHeight ?? {});
  if (lh.length) out += `\nLeading: ${lh.map(([n, l]) => `${n} ${l.$value}`).join(', ')}.\n`;
  const fw = Object.entries(tokens.fontWeight ?? {});
  if (fw.length) out += `Weights: ${fw.map(([n, l]) => `${n} ${l.$value}`).join(', ')}.\n`;
  return out;
}

function spacingSection(themeDir: string): string {
  const tokens = readTokens(themeDir) as {
    spacing?: Record<string, {
      $value?: string;
      $extensions?: Record<string, { min: string; pref: string; max: string }>;
    }>;
    layout?: Record<string, { $value?: string; $description?: string }>;
  };
  const steps = Object.entries(tokens.spacing ?? {});
  const containers = Object.entries(tokens.layout ?? {});
  if (!steps.length && !containers.length) return '';
  let out = '\n## Spacing\n\n';
  if (steps.length) {
    out += '| Step | Ceiling | Fluid range |\n| --- | --- | --- |\n';
    for (const [name, leaf] of steps) {
      const fluid = leaf.$extensions?.['pro.tebin.fluid'];
      const range = fluid ? `\`clamp(${fluid.min}, ${fluid.pref}, ${fluid.max})\`` : 'fixed';
      out += `| \`spacing.${name}\` | ${leaf.$value} | ${range} |\n`;
    }
  }
  if (containers.length) {
    out += `\nContainer widths: ${containers.map(([n, l]) => `\`${n}\` ${l.$value}`).join(', ')}.\n`;
  }
  return out;
}

function componentSection(themeDir: string): string {
  const tokens = readTokens(themeDir) as {
    components?: Record<string, Record<string, { $value?: string; $description?: string }>>;
  };
  const entries = Object.entries(tokens.components ?? {});
  if (!entries.length) return '';
  let out = '\n## Components\n\n';
  const notes: string[] = [];
  out += '| Component | Background | Text | Border | Shape | Padding | Height |\n';
  out += '| --- | --- | --- | --- | --- | --- | --- |\n';
  for (const [name, parts] of entries) {
    const cell = (p: string) => {
      const v = parts[p]?.$value;
      return v ? `\`${v.replace(/^\{|\}$/g, '')}\`` : '—';
    };
    out += `| \`${name}\` | ${cell('backgroundColor')} | ${cell('textColor')} | ${cell('borderColor')} | ${cell('rounded')} | ${cell('padding')} | ${cell('height')} |\n`;
    for (const [prop, leaf] of Object.entries(parts)) {
      if (leaf.$description) notes.push(`- **\`${name}.${prop}\`** — ${leaf.$description}`);
    }
  }
  out += '\nA variant states only what it changes; everything else comes from the component it names.\n';
  if (notes.length) out += `\n${notes.join('\n')}\n`;
  return out;
}

function assetSection(themeDir: string, theme: ThemeManifest): string {
  const id = theme.id;
  const assets = theme.assets ?? [];
  if (assets.length === 0) return '';
  const manifest = readManifest(themeDir);
  let out = '\n## Assets\n\n| Asset | Source | PNG |\n| --- | --- | --- |\n';

  for (const asset of assets) {
    const pngs = (manifest?.outputs ?? [])
      .filter((o) => o.assetId === asset.id)
      .sort((a, b) => a.width - b.width || a.variant.localeCompare(b.variant))
      .map((o) => {
        const label = o.variant === 'transparent' ? `${o.width} px` : `${o.width} px ${o.variant.replace('on-', 'on ')}`;
        return `[${label}](${download(id, o.path)})`;
      });
    out += `| \`${asset.id}\` | [${asset.format.toUpperCase()}](${download(id, asset.path)}) | ${pngs.join(' · ') || '—'} |\n`;
  }

  out += `\nFor scripts and agents, the same files without the HTML page around them: \`${RAW_BASE}/themes/${id}/…\`. Note that a raw SVG is served as \`text/plain\`, so a browser shows its source — use the vector links above to download one by hand.\n`;
  out += `\nColour table as a spreadsheet: [colors.csv](${download(id, 'dist/colors.csv')}).\n`;
  return out;
}

function rulesSection(): string {
  let out = '\n## Rules\n';
  for (const category of DOC_CATEGORIES) {
    const rules: Rule[] = filterRules({ category });
    if (!rules.length) continue;
    out += `\n### ${category}\n\n`;
    for (const rule of rules) {
      const rationale = rule.rationale ? ` — _${rule.rationale}_` : '';
      out += `- **[${rule.severity}]** ${rule.statement}${rationale}\n`;
    }
  }
  return out;
}

export function buildDesignDoc(themeDir: string): string {
  const theme = JSON.parse(readFileSync(join(themeDir, 'theme.json'), 'utf8')) as ThemeManifest;
  const introPath = join(themeDir, 'design.intro.md');
  const intro = existsSync(introPath) ? readFileSync(introPath, 'utf8').trim() : '';

  let out = buildFrontMatter(themeDir);
  out += `# ${theme.name} — design\n\n`;
  out += `> Generated from \`tokens.json\`, \`theme.json\` and \`rules/rules.json\` — do not edit by hand.\n\n`;
  if (intro) out += `${intro}\n`;
  out += `\n**Version** ${theme.version}. **Tokens** ${theme.license.tokens}. **Assets** ${theme.license.assets}.\n`;
  if (theme.source?.url) out += `**Source** ${theme.source.url}.\n`;
  out += `\n## Palette\n\n${tokenTable(themeDir)}`;
  out += `\nWhere a cell reads "${NO_PRINT_VALUE}", no value was printed there — do not convert one from the RGB.\n`;
  out += translucentNote(themeDir, theme.id);
  out += roleSection(themeDir);
  out += typeSection(themeDir);
  out += typeScaleSection(themeDir);
  out += geometrySection(themeDir);
  out += spacingSection(themeDir);
  out += componentSection(themeDir);
  out += assetSection(themeDir, theme);
  out += rulesSection();
  out += `\n## Using this elsewhere\n\n`;
  out += `- Word, Excel, PowerPoint, Google Docs — [the Office guide](${BLOB_BASE}/docs/guide/office.md).\n`;
  out += `- A coding agent — [the agent guide](${BLOB_BASE}/docs/guide/ai-agents.md).\n`;
  out += `- A web project — [the developer guide](${BLOB_BASE}/docs/guide/developers.md).\n`;
  out += `\nEvery link in this file is absolute, so the file keeps working when it is pasted into a chat or saved beside a document.\n`;
  return out;
}

export function writeDesignDoc(themeDir: string): void {
  writeFileSync(join(themeDir, 'DESIGN.md'), buildDesignDoc(themeDir));
}
