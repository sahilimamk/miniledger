import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

/**
 * Clear, high-contrast surface for the auth fields. The previous blur and
 * translucent gray wash made the controls look disabled on the light theme.
 * When `focused`, the border turns emerald so keyboard focus remains visible.
 */
export function AuthFieldCard({
  children,
  focused = false,
}: {
  children: ReactNode;
  focused?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: focused ? colors.tint : colors.separator,
        },
      ]}
    >
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
