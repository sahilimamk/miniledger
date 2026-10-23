import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { sectionInset, spacing } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

/**
 * Loading placeholder shaped like the loans home (hero card + three rows)
 * with a gentle opacity pulse — reads as "your data is coming" instead of a
 * bare spinner.
 */
export function LoansSkeleton() {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const block = { backgroundColor: colors.separator };

  return (
    <Animated.View style={[styles.wrap, pulseStyle]} accessibilityLabel="Loading your loans">
      <View style={[styles.hero, block]} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.row, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
          <View style={[styles.avatarDot, block]} />
          <View style={styles.rowText}>
            <View style={[styles.lineWide, block]} />
            <View style={[styles.lineNarrow, block]} />
          </View>
          <View style={[styles.amountBlock, block]} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: sectionInset,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    height: 168,
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 12,
    paddingHorizontal: sectionInset,
    paddingVertical: 14,
  },
  avatarDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rowText: {
    flex: 1,
    gap: 8,
  },
  lineWide: {
    height: 12,
    width: '55%',
    borderRadius: 6,
  },
  lineNarrow: {
    height: 10,
    width: '35%',
    borderRadius: 5,
  },
  amountBlock: {
    height: 14,
    width: 56,
    borderRadius: 7,
  },
});
