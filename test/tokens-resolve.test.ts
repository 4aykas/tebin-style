import { describe, it, expect } from 'vitest';
import { referencePath, resolveToken, resolveString } from '../src/tokens.js';

const tree = {
  color: {
    brand: { $type: 'color', $value: '#DA291C' },
    empty: { $type: 'color' },
  },
  role: {
    primary: { $type: 'color', $value: '{color.brand}' },
    chained: { $type: 'color', $value: '{role.primary}' },
    dangling: { $type: 'color', $value: '{color.nope}' },
    hollow: { $type: 'color', $value: '{color.empty}' },
    loopA: { $type: 'color', $value: '{role.loopB}' },
    loopB: { $type: 'color', $value: '{role.loopA}' },
  },
  lineHeight: { body: { $type: 'number', $value: 1.7 } },
  font: { sans: { $type: 'fontFamily', $value: ['Roboto', 'Arial'] } },
};

describe('referencePath', () => {
  it('reads the path out of a reference', () => {
    expect(referencePath('{color.brand}')).toBe('color.brand');
  });
  it('returns null for a literal, so a caller can tell them apart', () => {
    expect(referencePath('#DA291C')).toBeNull();
    expect(referencePath(1.7)).toBeNull();
    expect(referencePath('{unclosed')).toBeNull();
  });
});

describe('resolveToken', () => {
  it('follows one hop', () => {
    expect(resolveToken(tree, '{color.brand}')).toBe('#DA291C');
  });
  it('follows a chain', () => {
    expect(resolveToken(tree, '{role.chained}')).toBe('#DA291C');
  });
  it('passes a literal through untouched, whatever its type', () => {
    expect(resolveToken(tree, '#FCFBF8')).toBe('#FCFBF8');
    expect(resolveToken(tree, 1.7)).toBe(1.7);
    expect(resolveToken(tree, ['Roboto', 'Arial'])).toEqual(['Roboto', 'Arial']);
  });
  it('returns null for a path that leads nowhere', () => {
    expect(resolveToken(tree, '{color.nope}')).toBeNull();
    expect(resolveToken(tree, '{role.dangling}')).toBeNull();
  });
  it('returns null for a leaf with no value, rather than undefined', () => {
    expect(resolveToken(tree, '{role.hollow}')).toBeNull();
  });
  it('returns null on a cycle instead of running out of stack', () => {
    expect(resolveToken(tree, '{role.loopA}')).toBeNull();
  });
});

describe('resolveString', () => {
  it('narrows to a string', () => {
    expect(resolveString(tree, '{role.primary}')).toBe('#DA291C');
  });
  it('returns null when the value is not a string', () => {
    expect(resolveString(tree, '{lineHeight.body}')).toBeNull();
    expect(resolveString(tree, '{font.sans}')).toBeNull();
  });
});
