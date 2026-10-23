import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

/**
 * Real glassmorphism for the auth field cards (expo-blur): the backdrop
 * gradient blobs blur through a translucent wash of the grouped-background
 * color, clipped to the card radius. Replaces the flat solid card — same
 * padding and border, so layouts don't move.
 */
export function GlassFieldCard({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.card, { borderColor: colors.separator }]}>
      <BlurView intensity={55} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `${colors.secondarySystemGroupedBackground}8C` },
        ]}
      />
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
