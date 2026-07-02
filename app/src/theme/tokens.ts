/**
 * Pusaka design tokens.
 *
 * Values are lifted verbatim from the clickable prototype
 * (`project/design_demo/app_prototype/assets/styles.css`) so that native
 * screens stay visually faithful to the approved design. Do not invent new
 * colours or spacing here — extend the prototype first, then mirror it.
 */

export const colors = {
  teal: '#0f766e',
  tealDark: '#0b5d56',
  tealDarker: '#0a4f49',
  ink: '#13352e',
  inkDark: '#0c2521',
  inkDarker: '#0a1f1b',
  bg: '#f3f6f4',
  canvas: '#eceae3',
  border: '#e7eeeb',
  borderSoft: '#e4ece8',
  muted: '#8a9b95',
  muted2: '#5a726b',
  gold: '#bf9b3a',
  goldLight: '#e7c163',
  warnBg: '#fdf4df',
  warnText: '#9a7716',
  dangerBg: '#fde4e1',
  dangerText: '#b4541f',
  dangerBorder: '#f0d2c8',
  successBg: '#e9f5ef',
  successText: '#1f8a5b',
  white: '#ffffff'
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

export const radii = {
  sm: 9,
  md: 14,
  lg: 16,
  xl: 18,
  pill: 999,
  screen: 38
} as const;

export const fontSizes = {
  caption: 11,
  small: 13.5,
  body: 14.5,
  lead: 15,
  title: 16,
  heading: 26,
  display: 28
} as const;

export const fontFamilies = {
  sans: 'Hanken Grotesk',
  serif: 'Newsreader'
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type FontSizes = typeof fontSizes;

export const theme = {
  colors,
  spacing,
  radii,
  fontSizes,
  fontFamilies
} as const;

export type Theme = typeof theme;
