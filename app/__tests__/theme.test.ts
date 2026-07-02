import { colors, fontSizes, radii, spacing, theme } from '../src/theme/tokens';

describe('design tokens', () => {
  it('exposes the Pusaka brand palette from the prototype', () => {
    expect(colors.teal).toBe('#0f766e');
    expect(colors.ink).toBe('#13352e');
    expect(colors.gold).toBe('#bf9b3a');
    expect(colors.dangerText).toBe('#b4541f');
  });

  it('uses valid hex colours for every token', () => {
    const hex = /^#[0-9a-f]{6}$/;
    Object.values(colors).forEach((value) => {
      expect(value).toMatch(hex);
    });
  });

  it('exposes an ascending spacing scale', () => {
    const values = Object.values(spacing);
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
    expect(spacing.lg).toBe(16);
  });

  it('exposes radii and font sizes as positive numbers', () => {
    Object.values(radii).forEach((value) => expect(value).toBeGreaterThan(0));
    Object.values(fontSizes).forEach((value) => expect(value).toBeGreaterThan(0));
  });

  it('aggregates all scales under the theme object', () => {
    expect(theme.colors).toBe(colors);
    expect(theme.spacing).toBe(spacing);
    expect(theme.radii).toBe(radii);
    expect(theme.fontSizes).toBe(fontSizes);
  });
});
