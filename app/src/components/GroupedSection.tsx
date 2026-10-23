import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { sectionInset, sectionRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { cardShadow } from '../theme/elevation';
import { useTheme } from '../theme/useTheme';

interface GroupedSectionProps {
  children: ReactNode;
  /** Small uppercase caption above the card, like iOS Settings. */
  header?: string;
  /** Quiet explanatory text below the card. */
  footer?: string;
}

/**
 * Inset-grouped list container: a rounded card floating on the grouped
 * background, with an optional uppercase header and footer.
 */
export function GroupedSection({ children, header, footer }: GroupedSectionProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      {header ? (
        <Text style={[typography.sectionHeader, styles.header, { color: colors.secondaryLabel }]}>
          {header}
        </Text>
      ) : null}
      <View
        style={[
          styles.card,
          cardShadow(isDark),
          {
            backgroundColor: colors.secondarySystemGroupedBackground,
            borderColor: colors.separator,
          },
        ]}
      >
        {children}
      </View>
      {footer ? (
        <Text style={[typography.footnote, styles.footer, { color: colors.secondaryLabel }]}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

/** Hairline separator to place between rows inside a GroupedSection. */
export function RowSeparator({ inset = sectionInset }: { inset?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        marginLeft: inset,
        backgroundColor: colors.separator,
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: sectionInset,
    marginTop: spacing.xl,
  },
  header: {
    marginLeft: sectionInset,
    marginBottom: spacing.sm,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: sectionRadius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    marginHorizontal: sectionInset,
    marginTop: spacing.sm,
  },
});
