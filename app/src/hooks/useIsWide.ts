import { useWindowDimensions } from 'react-native';

/**
 * Desktop breakpoint. At this width the app switches from the single-column
 * phone layout to the desktop layout (stat strip + two-column content).
 * Below it — every phone and small window — the layout is unchanged.
 */
export const WIDE_BREAKPOINT = 1024;

export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}
