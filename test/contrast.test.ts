import { describe, it, expect } from 'vitest';
import { relativeLuminance, contrastRatio } from '../src/contrast.js';

describe('contrastRatio', () => {
  it('puts black on white at the maximum', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('puts a colour against itself at the minimum', () => {
    expect(contrastRatio('#DA291C', '#DA291C')).toBeCloseTo(1, 5);
  });

  it('is symmetric — order of the pair does not matter', () => {
    expect(contrastRatio('#EA6359', '#242830')).toBeCloseTo(contrastRatio('#242830', '#EA6359'), 10);
  });

  it('reproduces the figure the theme publishes for brand-on-dark', () => {
    // themes/tebin/tokens.json says "4.5:1 on #242830". This test is what
    // stops that sentence drifting away from the value beside it.
    expect(contrastRatio('#EA6359', '#242830')).toBeCloseTo(4.52, 2);
  });

  it('reproduces the figure published for brand-on-light', () => {
    expect(contrastRatio('#C7251A', '#EFEEE9')).toBeCloseTo(4.88, 2);
  });

  it('refuses a value it cannot measure rather than guessing', () => {
    expect(() => relativeLuminance('rgba(255,255,255,0.9)')).toThrow(/opaque hex/);
  });
});
