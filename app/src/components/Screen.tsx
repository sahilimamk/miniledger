import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NavRail, type NavKey } from './NavRail';
import { useRailLayout } from '../hooks/useRailLayout';
import { useTheme } from '../theme/useTheme';

interface ScreenProps {
  children: ReactNode;
  /** When true, the plain system background is used instead of the grouped one. */
  plain?: boolean;
  /** Content column width. Defaults to 680 (forms, auth, phone-style pages).
   *  The desktop dashboard passes a wider value and gets a grid instead. */
  maxWidth?: number;
  /** App-shell navigation. When set and the window is ≥900px, the left nav
   *  rail renders and the content sits beside it; below that width (and on
   *  the auth screens, which pass no nav) the layout is unchanged. */
  nav?: {
    active: NavKey;
    onNavigate: (key: NavKey) => void;
  };
}

/** Screen shell: safe-area aware, grouped (grey) background by default.
 *  Narrow windows: content in a centered column with hairline edges.
 *  Windows ≥900px on the main screens: a left navigation rail plus the
 *  content column centered in the remaining space (the stack header hides
 *  there — the rail carries brand, navigation, and log out). */
export function Screen({ children, plain = false, maxWidth = 680, nav }: ScreenProps) {
  const { colors } = useTheme();
  const rail = useRailLayout() && nav !== undefined;
  const background = plain ? colors.systemBackground : colors.systemGroupedBackground;
  const boxed = maxWidth <= 680 && !rail;

  if (rail) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.systemBackground }]} edges={['bottom', 'left', 'right']}>
        <View style={styles.shell}>
          <NavRail active={nav.active} onNavigate={nav.onNavigate} />
          <View style={[styles.main, { backgroundColor: background }]}>
            <View style={[styles.content, { maxWidth }]}>{children}</View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.systemBackground }]} edges={['bottom', 'left', 'right']}>
      <View
        style={[
          styles.content,
          {
            maxWidth,
            backgroundColor: background,
            borderLeftColor: colors.separator,
            borderRightColor: colors.separator,
            borderLeftWidth: boxed ? StyleSheet.hairlineWidth : 0,
            borderRightWidth: boxed ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
