// MiniLedger's design palette (v13) — a light navy + emerald fintech
// system: #F6F8FA page, white cards with hairline navy borders, navy ink
// #0A2540, one FLAT emerald accent #0D8F6F. No gradients anywhere — the
// v7–v12 violet→blue gradient system is gone entirely (real fintech runs
// navy for trust + green for energy on light surfaces, not violet on
// black). Key names are kept from the old theme so components keep
// working; every value is new. The product is light-only now: both
// exported palettes carry the same values, so the device's appearance
// setting no longer flips the app.

export interface Palette {
  /** Primary screen background. */
  systemBackground: string;
  /** Elevated content over systemBackground (inputs, wells, toast). */
  secondarySystemBackground: string;
  /** Screen background behind cards. */
  systemGroupedBackground: string;
  /** Card color on top of systemGroupedBackground. */
  secondarySystemGroupedBackground: string;
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  separator: string;
  /** Danger / overdue ink. */
  systemRed: string;
  /** Success / repaid — the accent family. */
  systemGreen: string;
  systemOrange: string;
  systemGray: string;
  systemIndigo: string;
  systemPurple: string;
  systemTeal: string;
  /** Accent / interactive color (flat emerald). */
  tint: string;
  /** Accent while pressed / hovered. */
  accentPressed: string;
  /** Tint wash behind danger content (the overdue stat card). */
  dangerTint: string;
  /** Text and icons drawn on top of the tint color. */
  onTint: string;
}

const palette: Palette = {
  systemBackground: '#F6F8FA',
  secondarySystemBackground: '#F6F8FA',
  systemGroupedBackground: '#F6F8FA',
  secondarySystemGroupedBackground: '#FFFFFF',
  label: '#0A2540',
  secondaryLabel: '#5B6B7D',
  tertiaryLabel: '#93A3B5',
  separator: 'rgba(10, 37, 64, 0.08)',
  systemRed: '#D64545',
  systemGreen: '#0D8F6F',
  systemOrange: '#B7791F',
  systemGray: '#8A99AB',
  systemIndigo: '#33566E',
  systemPurple: '#5B6B7D',
  systemTeal: '#0D8F6F',
  tint: '#0D8F6F',
  accentPressed: '#0B7A5F',
  dangerTint: '#FDECEC',
  onTint: '#FFFFFF',
};

export const lightPalette: Palette = palette;
/** Light-only since v13 — the dark export carries the same light values. */
export const darkPalette: Palette = palette;
