// PROPIQ AI — Design Tokens (matches your color palette exactly)
export const C = {
  primary:    '#1B4F72',
  accent:     '#2E86C1',
  accent2:    '#117A65',
  accent3:    '#9B59B6',
  accent4:    '#D4AC0D',
  danger:     '#C0392B',
  lightBg:    '#D6EAF8',
  lightBg2:   '#D5F5E3',
  lightBg3:   '#F4ECF7',
  lightBg4:   '#FEF9E7',
  headerBg:   '#1B4F72',
  rowAlt:     '#EBF5FB',
  white:      '#FFFFFF',
  black:      '#000000',
  gray:       '#5D6D7E',
  lightGray:  '#F2F3F4',
  borderGray: '#BDC3C7',
} as const;

export type ColorKey = keyof typeof C;
