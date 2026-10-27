import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DriftingBlobs } from './DriftingBlobs';
import { Screen } from './Screen';
import { useIsWide } from '../hooks/useIsWide';
import { sectionInset, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

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
 * Auth screens never get the nav rail (they pass no `nav`), so this is
 * the only wide-width treatment they need.
 */
export function AuthLayout({ form, panel }: AuthLayoutProps) {
  const { colors } = useTheme();
  const isWide = useIsWide();
  const showPanel = isWide && panel !== undefined;

  return (
    <Screen maxWidth={showPanel ? 960 : undefined}>
      <DriftingBlobs />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
      >
        {showPanel ? (
          <View style={styles.row}>
            <View style={styles.formColumn}>{form}</View>
            <View
              style={[
                styles.panel,
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
  formColumn: {
    flex: 1,
    maxWidth: 460,
    gap: spacing.sm,
  },
  panel: {
    width: 360,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.md,
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
