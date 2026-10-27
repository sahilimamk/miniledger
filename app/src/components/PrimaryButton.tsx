import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Destructive renders solid danger red (e.g. Delete) instead of emerald. */
  destructive?: boolean;
  accessibilityLabel?: string;
}

/**
 * The app's primary action: a FLAT emerald pill, 56 tall, that springs to
 * 0.97 while pressed (v13 — the v7–v12 violet→blue gradient is gone;
 * pressed deepens to accentPressed #0B7A5F). Destructive actions stay
 * solid red; disabled flattens to a faint navy wash with muted text.
 */
export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  destructive = false,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const [focused, setFocused] = useState(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const baseColor = destructive ? colors.systemRed : colors.tint;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isDisabled
              ? 'rgba(10, 37, 64, 0.06)'
              : pressed && !destructive
                ? colors.accentPressed
                : baseColor,
          },
          // Web keyboard focus ring (outline props are ignored on native).
          // No layout shift: outlines draw outside the pill.
          focused && {
            outlineStyle: 'solid',
            outlineWidth: 2,
            outlineColor: colors.tintText,
            outlineOffset: 2,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isDisabled ? colors.secondaryLabel : colors.onTint} />
        ) : (
          <Text
            style={[
              typography.headline,
              { color: isDisabled ? colors.secondaryLabel : colors.onTint },
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
