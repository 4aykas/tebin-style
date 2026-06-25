import { describe, it, expect } from 'vitest';
import { getAsset } from '../mcp/tools.js';

describe('tebin brand assets', () => {
  it('serves the all-white logo (no brand red, no grey)', () => {
    const a = getAsset({ id: 'tebin', assetId: 'logo-full-white' });
    expect(a.type).toBe('logo');
    expect(a.format).toBe('svg');
    expect(a.content).toContain('#fff');
    expect(a.content).not.toContain('#808285');
    expect(a.content).not.toContain('#ee3124');
  });

  it('serves the solid red corner mark', () => {
    const a = getAsset({ id: 'tebin', assetId: 'corner-mark' });
    expect(a.type).toBe('pattern');
    expect(a.content).toContain('#ee3124');
  });

  it('serves the white corner mark (no brand red)', () => {
    const a = getAsset({ id: 'tebin', assetId: 'corner-mark-white' });
    expect(a.content).toContain('#fff');
    expect(a.content).not.toContain('#ee3124');
  });
});
