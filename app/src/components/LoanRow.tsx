import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { Loan } from '../api/types';
import { AppIcon } from './AppIcon';
import { Avatar } from './Avatar';
import { sectionInset, spacing } from '../theme/spacing';
import { font, typography } from '../theme/typography';
import { cardShadow } from '../theme/elevation';
import { useTheme } from '../theme/useTheme';
import { formatDate, formatINR, daysUntil } from '../utils/format';

interface LoanRowProps {
  loan: Loan;
  onPress: (loan: Loan) => void;
  /** Position in the list — staggers the entrance cascade (capped). */
  index?: number;
  /** Standalone floating card (own surface, border, radius) vs a row inside a card. */
  card?: boolean;
}

/**
 * One loan in the entries list, Contacts-style: initials avatar, name and
 * due date stacked, status dot + amount on the right. Overdue reads red,
 * repaid green, active tint. Rows cascade in on mount (Reanimated) and the
 * whole row springs to 0.97 while pressed.
 */
export function LoanRow({ loan, onPress, index = 0, card = false }: LoanRowProps) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Money stays neutral (label color) unless status demands attention:
  // repaid green, overdue rose. Color means status, not decoration.
  const amountColor = loan.repaid
    ? colors.systemGreen
    : loan.isOverdue
      ? colors.systemRed
      : colors.label;
  const status = loan.repaid
    ? { label: 'PAID', color: colors.systemGreen }
    : loan.isOverdue
      ? { label: 'OVERDUE', color: colors.systemRed }
      : daysUntil(loan.dueDate) <= 3
        ? { label: 'DUE SOON', color: colors.systemOrange }
        : { label: 'ACTIVE', color: colors.tint };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 50)
        .springify()
        .damping(19)}
      style={[
        animatedStyle,
        card && {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: colors.separator,
          borderWidth: 1,
          borderRadius: 16,
          ...cardShadow(isDark),
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${loan.friendName}, ${formatINR(loan.amount)}, due ${formatDate(loan.dueDate)}${loan.repaid ? ', repaid' : loan.isOverdue ? ', overdue' : ''}`}
        onPress={() => onPress(loan)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: colors.secondarySystemBackground },
          // Web keyboard focus ring: rows are the main interactive element
          // in every list, so they must show focus like buttons do.
          focused && {
            outlineStyle: 'solid',
            outlineWidth: 2,
            outlineColor: colors.tintText,
            outlineOffset: 2,
          },
        ]}
      >
        <Avatar name={loan.friendName} size={40} />
        <View style={styles.main}>
          <Text style={[typography.headline, styles.name, { color: colors.label }]} numberOfLines={1}>
            {loan.friendName}
          </Text>
          {loan.repaid ? (
            <Text style={[typography.subhead, { color: colors.secondaryLabel }]}>Repaid</Text>
          ) : (
            <Text
              style={[
                typography.subhead,
                { color: loan.isOverdue ? colors.systemRed : colors.secondaryLabel },
              ]}
            >
              Due {formatDate(loan.dueDate)}
              {loan.isOverdue ? ' · Overdue' : ''}
            </Text>
          )}
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: amountColor }]}>{formatINR(loan.amount)}</Text>
          <View style={[styles.badge, { backgroundColor: `${status.color}26` }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <AppIcon
          symbol="chevron.right"
          ionicon="chevron-forward"
          size={14}
          color={colors.tertiaryLabel}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sectionInset,
    paddingVertical: 14,
    gap: spacing.md,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  name: {
    flexShrink: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  amount: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
