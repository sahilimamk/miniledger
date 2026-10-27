import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Screen } from './Screen';
import { useIsWide } from '../hooks/useIsWide';
import { sectionInset, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/** Above this width the auth shell scales up (see below). */
export const AUTH_VERY_WIDE_BREAKPOINT = 1440;

interface AuthLayoutProps {
  /** The form column (hero, fields, buttons). */
  form: ReactNode;
  /** Side panel, rendered only at desktop widths (≥1024px). */
  panel?: ReactNode;
}

/**
 * Shared auth shell. Narrow screens: the form centered in the 680 shell,
 * exactly as before. Desktop widths: the shell widens to 960 and the form
 * sits beside a product-info panel, so the page reads as a deliberate
 * two-column layout instead of a narrow strip adrift in empty space.
 * On very wide screens (≥1440px) the shell scales up again — form 620,
 * panel 460 — because the 960 shell left the content occupying barely
 * half of a 1920px screen, which read as broken rather than centered.
 * Auth screens never get the nav rail (they pass no `nav`), so this is
 * the only wide-width treatment they need.
 */
export function AuthLayout({ form, panel }: AuthLayoutProps) {
  const { colors } = useTheme();
  const isWide = useIsWide();
  const { width: windowWidth } = useWindowDimensions();
  const veryWide = windowWidth >= AUTH_VERY_WIDE_BREAKPOINT;
  const showPanel = isWide && panel !== undefined;

  return (
    <Screen maxWidth={showPanel ? (veryWide ? 1240 : 960) : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
      >
        {showPanel ? (
          <View style={[styles.row, veryWide && styles.rowVeryWide]}>
            <View style={[styles.formColumn, veryWide && styles.formColumnVeryWide]}>{form}</View>
            <View
              style={[
                styles.panel,
                veryWide && styles.panelVeryWide,
                {
                  backgroundColor: colors.secondarySystemGroupedBackground,
                  borderColor: colors.separator,
                },
              ]}
            >
              {panel}
            </View>
          </View>
        ) : (
          <View style={styles.singleColumn}>{form}</View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: sectionInset,
    paddingVertical: spacing.xxl,
  },
  scrollWide: {
    justifyContent: 'center',
  },
  singleColumn: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  row: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
  },
  // Very wide screens: the row grows so the content stops reading as a
  // narrow strip in the middle of the screen (form 620 + gap 48 + panel
  // 460 = 1128 inside the 1180 row).
  rowVeryWide: {
    maxWidth: 1180,
    gap: 48,
  },
  formColumn: {
    flex: 1,
    maxWidth: 460,
    gap: spacing.sm,
  },
  formColumnVeryWide: {
    maxWidth: 620,
  },
  panel: {
    width: 360,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.md,
  },
  panelVeryWide: {
    width: 460,
  },
  panelTitle: {
    marginBottom: spacing.xs,
  },
  panelBullet: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  panelDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  panelNote: {
    lineHeight: 21,
  },
});

/** Shared side-panel pieces for the auth screens (desktop widths only). */
export function AuthPanelTitle({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[typography.title, styles.panelTitle, { color: colors.label }]}
    >
      {children}
    </Text>
  );
}

export function AuthPanelBullet({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.panelBullet}>
      <Text style={[typography.body, { color: colors.tintText }]}>•</Text>
      <Text style={[typography.body, { color: colors.secondaryLabel, flex: 1 }]}>{children}</Text>
    </View>
  );
}
