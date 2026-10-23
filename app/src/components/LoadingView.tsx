import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

interface LoadingViewProps {
  message?: string;
}

/** Full-screen centered spinner. */
export function LoadingView({ message }: LoadingViewProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]}>
      <ActivityIndicator size="large" color={colors.tint} />
      {message ? (
        <Text style={[typography.subhead, { color: colors.secondaryLabel }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
