import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AppIcon } from './AppIcon';

import { sectionInset, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Validation message shown in rose under the field. */
  error?: string | null;
  /** Optional leading icon inside the well (v9 form polish). */
  icon?: {
    symbol: React.ComponentProps<typeof AppIcon>['symbol'];
    ionicon: React.ComponentProps<typeof AppIcon>['ionicon'];
  };
}

/**
 * A form field in the v7 style: small label above a filled well (elevated
 * surface color, hairline border, 14 radius). The error state turns the
 * border rose and prints the message underneath.
 */
export function TextField({ label, error, icon, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[typography.subhead, styles.label, { color: colors.secondaryLabel }]}>
        {label}
      </Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.secondarySystemBackground,
            borderColor: error ? colors.systemRed : colors.separator,
          },
        ]}
      >
        {icon ? (
          <View style={styles.icon}>
            <AppIcon symbol={icon.symbol} ionicon={icon.ionicon} size={18} color={colors.secondaryLabel} />
          </View>
        ) : null}
        <TextInput
          {...inputProps}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          placeholderTextColor={colors.tertiaryLabel}
          style={[typography.body, styles.input, { color: colors.label }]}
        />
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.footnote, styles.error, { color: colors.systemRed }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: sectionInset,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  label: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  field: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  error: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
