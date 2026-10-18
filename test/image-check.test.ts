import { describe, it, expect } from 'vitest';
import { deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodePng } from '../src/png.js';
import { checkImage, checkImageFile, deltaE2000, dominantColors } from '../src/image-check.js';
import { collectColorRows } from '../src/colors-csv.js';
import { checkImageTool } from '../mcp/tools.js';
import { REPO_ROOT, loadIndex } from '../src/registry.js';

/** A minimal PNG: one IHDR, one IDAT, given raw rows (each with its filter byte). */
function png(width: number, height: number, type: number, depth: number, rows: number[][],
  extra: Array<[string, number[]]> = [], interlace = 0, raw?: Uint8Array): Uint8Array {
  const chunk = (name: string, body: Uint8Array) => {
    const out = Buffer.alloc(12 + body.length);
    out.writeUInt32BE(body.length, 0);
    out.write(name, 4, 'ascii');
    Buffer.from(body).copy(out, 8);
    return out; // the decoder does not check CRCs
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = depth; ihdr[9] = type; ihdr[12] = interlace;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    ...extra.map(([name, body]) => chunk(name, Uint8Array.from(body))),
    chunk('IDAT', deflateSync(raw ?? Uint8Array.from(rows.flat()))), chunk('IEND', new Uint8Array()),
  ]);
}

const classic = join(REPO_ROOT, 'themes', 'tebin-classic');
const asset = (name: string) => join(classic, 'assets', 'png', name);

describe('decodePng', () => {
  it('reads RGBA rows through every filter type', () => {
    // Two pixels a row; rows use filters None, Sub, Up, Average and Paeth.
    const rows = [
      [0, 10, 20, 30, 255, 40, 50, 60, 255],
      [1, 10, 20, 30, 255, 30, 30, 30, 0],
      [2, 0, 0, 0, 0, 0, 0, 0, 0],
      [3, 10, 20, 30, 255, 15, 15, 15, 128],
      [4, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const { width, height, data } = decodePng(png(2, 5, 6, 8, rows));
    expect([width, height]).toEqual([2, 5]);
    expect([...data.subarray(0, 8)]).toEqual([10, 20, 30, 255, 40, 50, 60, 255]);
    expect([...data.subarray(8, 16)]).toEqual([10, 20, 30, 255, 40, 50, 60, 255]);
    expect([...data.subarray(16, 24)]).toEqual([10, 20, 30, 255, 40, 50, 60, 255]);
    // Average: the first pixel adds up/2, the next (left + up)/2, wrapping at 256.
    expect([...data.subarray(24, 32)]).toEqual([15, 30, 45, 126, 42, 55, 67, 62]);
    // Paeth with a zero row repeats the row above.
    expect([...data.subarray(32, 40)]).toEqual([15, 30, 45, 126, 42, 55, 67, 62]);
  });

  it('expands indexed pixels at 2 bits with transparency', () => {
    const plte: [string, number[]] = ['PLTE', [255, 0, 0, 0, 255, 0, 0, 0, 255]];
    const trns: [string, number[]] = ['tRNS', [255, 0]];
    const { data } = decodePng(png(3, 1, 3, 2, [[0, 0b00011000]], [plte, trns]));
    expect([...data]).toEqual([255, 0, 0, 255, 0, 255, 0, 0, 0, 0, 255, 255]);
  });

  it('reads grey with alpha and keeps the high byte of 16-bit samples', () => {
    expect([...decodePng(png(1, 1, 4, 8, [[0, 90, 200]])).data]).toEqual([90, 90, 90, 200]);
    expect([...decodePng(png(1, 1, 2, 16, [[0, 1, 2, 3, 4, 5, 6]])).data]).toEqual([1, 3, 5, 255]);
  });

  it('decodes the shipped logo at its manifest size', () => {
    const image = decodePng(readFileSync(asset('logo-full-512.png')));
    expect([image.width, image.height]).toEqual([512, 160]);
  });

  it('refuses what it cannot read, by name', () => {
    expect(() => decodePng(Buffer.from('GIF89a......'))).toThrow(/not a PNG/);
    expect(() => decodePng(png(1, 1, 6, 8, [[0, 0, 0, 0, 0]], [], 1))).toThrow(/interlaced/);
    expect(() => decodePng(png(1, 1, 2, 4, [[0, 0]]))).toThrow(/not supported/);
    // 1×1 in the header, 64 MB of zeros in the data: refused, not inflated.
    const bomb = png(1, 1, 6, 8, [], [], 0, new Uint8Array(64 * 1024 * 1024));
    expect(() => decodePng(bomb)).toThrow(/larger than its 1×1 header/);
  });
});

describe('deltaE2000', () => {
  // Reference pairs from Sharma, Wu and Dalal (2005), table 1.
  it.each([
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0],
    [[50, 2.5, 0], [73, 25, -18], 27.1492],
    [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
  ] as Array<[[number, number, number], [number, number, number], number]>)('%j vs %j is %d', (a, b, want) => {
    expect(deltaE2000(a, b)).toBeCloseTo(want, 4);
  });
});

describe('checkImage', () => {
  const palette = collectColorRows(classic);

  it('passes the brand logo, colour by colour', () => {
    const result = checkImage(decodePng(readFileSync(asset('logo-full-1024.png'))), 'tebin-classic', palette);
    expect(result.offPalette).toBe(0);
    expect(result.colors.map((c) => c.nearest.token)).toEqual(['color.brand', 'color.grey']);
    expect(result.coverage).toBeGreaterThan(0.99);
  });

  it('flags a green that is nowhere in the palette', () => {
    const data = new Uint8Array(100 * 4);
    for (let i = 0; i < 100; i++) data.set(i < 70 ? [218, 41, 28, 255] : [0, 160, 60, 255], i * 4);
    const result = checkImage({ width: 10, height: 10, data }, 'tebin-classic', palette);
    expect(result.offPalette).toBe(1);
    expect(result.colors[1]).toMatchObject({ hex: '#00A03C', share: 0.3, onPalette: false });
  });

  it('ignores transparent pixels and antialiasing below the reporting share', () => {
    const data = new Uint8Array(1000 * 4);
    for (let i = 0; i < 1000; i++) data.set(i < 500 ? [0, 0, 0, 0] : i < 998 ? [218, 41, 28, 255] : [5, 200, 250, 255], i * 4);
    expect(dominantColors({ width: 1000, height: 1, data })).toEqual({
      opaque: 500, colors: [{ rgb: { r: 218, g: 41, b: 28 }, share: 0.996 }],
    });
  });

  it('says when an image is mostly gradient', () => {
    const data = new Uint8Array(256 * 256 * 4);
    for (let i = 0; i < 256 * 256; i++) data.set([i & 255, i >> 8, (i * 7) & 255, 255], i * 4);
    expect(checkImage({ width: 256, height: 256, data }, 'tebin-classic', palette).note).toMatch(/photo or gradient/);
    expect(checkImage({ width: 1, height: 1, data: new Uint8Array(4) }, 'tebin-classic', palette).note).toMatch(/no opaque/);
  });
});

describe('checkImageFile and the MCP tool', () => {
  it('reads a PNG path and refuses other formats', () => {
    expect(checkImageTool({ id: 'tebin-classic', path: asset('corner-mark-256.png') }).offPalette).toBe(0);
    const dir = mkdtempSync(join(tmpdir(), 'tebin-image-'));
    try {
      const jpg = join(dir, 'banner.jpg');
      writeFileSync(jpg, 'not really');
      expect(() => checkImageFile(jpg, 'tebin-classic', classic)).toThrow(/only PNG/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses an unknown theme', () => {
    expect(() => checkImageTool({ id: 'nope', path: asset('corner-mark-256.png') })).toThrow(/nope/);
  });
});

describe('every shipped PNG stays on its own palette', () => {
  // #91: the tebin logo was drawn in #EE3124 / #808285 while its palette said
  // #DA291C. A transparent PNG is the asset as drawn, so it must match.
  for (const theme of loadIndex().themes) {
    const dir = join(REPO_ROOT, 'themes', theme.id);
    const manifestPath = join(dir, 'assets', 'png', 'manifest.json');
    if (!existsSync(manifestPath)) continue; // a theme without raster assets
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      outputs: Array<{ path: string; variant: string }>;
    };
    for (const { path } of manifest.outputs.filter((o) => o.variant === 'transparent')) {
      it(`${theme.id}/${path}`, () => {
        // An asset is drawn in exact palette colours, so the bar is ΔE 2, not
        // the default 10 meant for exported slides and photos.
        const result = checkImageFile(join(dir, path), theme.id, dir, 2);
        expect(result.colors.filter((c) => !c.onPalette), 'off-palette colours').toEqual([]);
      });
    }
  }
});
