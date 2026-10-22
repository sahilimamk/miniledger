import type { TextStyle } from 'react-native';

// Inter throughout (loaded in App.tsx via @expo-google-fonts/inter).
// Each weight is its own font family file, so styles name the family for
// the weight they want instead of relying on fontWeight synthesis.

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const typography = {
  /** Hero display numbers (balance card, detail hero). */
  display: {
    fontFamily: font.bold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  largeTitle: {
    fontFamily: font.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  largeTitle2: {
    fontFamily: font.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  numericHero: {
    fontFamily: font.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: font.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  subhead: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  footnote: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily: font.medium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  /** Uppercase group header above sections. */
  sectionHeader: {
    fontFamily: font.semibold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
} satisfies Record<string, TextStyle>;
