import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { sectionInset, sectionRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

/** Inline error strip shown above content when a request fails. */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors.secondarySystemGroupedBackground }]}
    >
      <AppIcon
        symbol="exclamationmark.triangle.fill"
        ionicon="warning"
        size={18}
        color={colors.systemRed}
      />
      <Text style={[typography.subhead, styles.message, { color: colors.label }]}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry"
          onPress={onRetry}
          hitSlop={8}
        >
          <Text style={[typography.headline, { color: colors.tint }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: sectionInset,
    marginTop: spacing.lg,
    paddingHorizontal: sectionInset,
    paddingVertical: spacing.md,
    borderRadius: sectionRadius,
  },
  message: {
    flex: 1,
  },
});
