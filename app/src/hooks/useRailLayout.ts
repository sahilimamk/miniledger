import { useWindowDimensions } from 'react-native';

/**
 * App-shell breakpoint (wider than a phone, narrower than the full desktop
 * dashboard). At this width the app gains its left navigation rail and the
 * native stack header steps aside. The dashboard grid itself still switches
 * at WIDE_BREAKPOINT (1024) — between 900 and 1024 the single-column layout
 * simply lives inside the rail shell.
 */
export const RAIL_BREAKPOINT = 900;

export function useRailLayout(): boolean {
  const { width } = useWindowDimensions();
  return width >= RAIL_BREAKPOINT;
}
