import type { ViewStyle } from 'react-native';

/**
 * Shared card elevation (v13, light theme).
 *
 * The dark theme (≤v12) separated cards with a black glow; on white cards
 * over #F6F8FA that would look dirty. Here the hairline border (separator,
 * rgba(10,37,64,0.08)) does most of the separation work and the shadow is
 * only a whisper — soft navy-grey, small offset, low opacity. The
 * `isDark` parameter is kept for call-site compatibility; the app is
 * light-only since v13, so both branches return the light values.
 */
export function cardShadow(isDark: boolean): ViewStyle {
  void isDark;
  return {
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  };
}

/** A touch more lift for the cards that must win the eye (hero stat, an
 *  active overdue stat) — still grey-navy, never black. */
export function prominentShadow(isDark: boolean): ViewStyle {
  void isDark;
  return {
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  };
}
