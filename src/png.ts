import { inflateSync } from 'node:zlib';

/** A decoded image: 8-bit RGBA, row by row. */
export interface Rgba {
  width: number;
  height: number;
  data: Uint8Array;
}

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

/** Largest image decoded, in pixels: 40 MP is 160 MB of RGBA. */
export const MAX_PIXELS = 40_000_000;

/**
 * Decodes a non-interlaced PNG to RGBA. Covers every colour type at 8 bits,
 * 16 bits (kept to the high byte) and indexed images at 1–8 bits — what
 * design tools export. A tRNS colour key on grey or RGB is ignored: those
 * pixels count as opaque. Throws, naming the reason, on anything else.
 */
export function decodePng(file: Uint8Array): Rgba {
  if (file.length < 8 || SIGNATURE.some((b, i) => file[i] !== b)) throw new Error('not a PNG file');
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);

  let width = 0, height = 0, depth = 0, type = 0;
  let palette: Uint8Array | undefined;
  let alpha: Uint8Array | undefined;
  const idat: Uint8Array[] = [];
  for (let at = 8; at + 8 <= file.length;) {
    const length = view.getUint32(at);
    const name = String.fromCharCode(...file.subarray(at + 4, at + 8));
    const body = file.subarray(at + 8, at + 8 + length);
    if (name === 'IHDR') {
      width = view.getUint32(at + 8);
      height = view.getUint32(at + 12);
      depth = body[8]!;
      type = body[9]!;
      if (body[12] !== 0) throw new Error('interlaced PNG is not supported; export it without interlacing');
    } else if (name === 'PLTE') palette = body;
    else if (name === 'tRNS') alpha = body;
    else if (name === 'IDAT') idat.push(body);
    else if (name === 'IEND') break;
    at += 12 + length;
  }

  const channels = CHANNELS[type];
  if (!width || !height || channels === undefined) throw new Error('PNG has no valid header');
  if (width * height > MAX_PIXELS) throw new Error(`PNG is ${width}×${height}; the limit is ${MAX_PIXELS / 1e6} MP`);
  if (type === 3 ? ![1, 2, 4, 8].includes(depth) : ![8, 16].includes(depth)) {
    throw new Error(`PNG colour type ${type} at ${depth} bits is not supported`);
  }
  if (type === 3 && !palette) throw new Error('indexed PNG has no palette');

  const bitsPerPixel = channels * depth;
  const stride = Math.ceil((width * bitsPerPixel) / 8);
  const bpp = Math.max(1, bitsPerPixel >> 3);
  // The header bounds the pixel data, so inflating stops there: a few
  // megabytes of compressed zeros cannot grow into gigabytes.
  const expected = height * (stride + 1);
  let raw: Buffer;
  try {
    raw = inflateSync(Buffer.concat(idat), { maxOutputLength: expected });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ERR_BUFFER_TOO_LARGE') throw e;
    throw new Error(`PNG image data is larger than its ${width}×${height} header allows`);
  }
  if (raw.length < expected) throw new Error('PNG image data is truncated');

  const out = new Uint8Array(width * height * 4);
  let previous = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!;
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp]! : 0;
      const b = previous[x]!;
      const c = x >= bpp ? previous[x - bpp]! : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      else if (filter === 2) predictor = b;
      else if (filter === 3) predictor = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`PNG row ${y} has unknown filter ${filter}`);
      row[x] = (line[x]! + predictor) & 0xff;
    }
    for (let x = 0; x < width; x++) writePixel(row, x, out, (y * width + x) * 4, type, depth, palette, alpha);
    previous = row;
  }
  return { width, height, data: out };
}

function writePixel(
  row: Uint8Array, x: number, out: Uint8Array, o: number,
  type: number, depth: number, palette?: Uint8Array, alpha?: Uint8Array,
): void {
  if (type === 3) {
    const perByte = 8 / depth;
    const index = (row[Math.floor(x / perByte)]! >> ((perByte - 1 - (x % perByte)) * depth)) & ((1 << depth) - 1);
    out[o] = palette![index * 3] ?? 0;
    out[o + 1] = palette![index * 3 + 1] ?? 0;
    out[o + 2] = palette![index * 3 + 2] ?? 0;
    out[o + 3] = alpha?.[index] ?? 255;
    return;
  }
  // 16-bit samples keep their high byte, the first of each pair.
  const step = depth >> 3;
  const sample = (channel: number) => row[(x * CHANNELS[type]! + channel) * step]!;
  if (type === 0 || type === 4) {
    out[o] = out[o + 1] = out[o + 2] = sample(0);
    out[o + 3] = type === 4 ? sample(1) : 255;
  } else {
    out[o] = sample(0);
    out[o + 1] = sample(1);
    out[o + 2] = sample(2);
    out[o + 3] = type === 6 ? sample(3) : 255;
  }
}
