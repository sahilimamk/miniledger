import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type IconProps = ComponentProps<typeof AppIcon>;

interface EmptyStateProps {
  title: string;
  message: string;
  /** SF Symbol name for the icon (default: tray). */
  symbol?: IconProps['symbol'];
  /** Ionicons fallback name for the icon. */
  ionicon?: IconProps['ionicon'];
  iconSize?: number;
  /** Icon colour; defaults to the tertiary label colour. */
  iconColor?: string;
}

/** Centered placeholder for lists with nothing in them. */
export function EmptyState({
  title,
  message,
  symbol = 'tray',
  ionicon = 'file-tray-outline',
  iconSize = 44,
  iconColor,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <AppIcon symbol={symbol} ionicon={ionicon} size={iconSize} color={iconColor ?? colors.tertiaryLabel} />
      <Text style={[typography.title, styles.title, { color: colors.label }]}>{title}</Text>
      <Text style={[typography.subhead, styles.message, { color: colors.secondaryLabel }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl * 2,
    gap: spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  message: {
    textAlign: 'center',
  },
});
