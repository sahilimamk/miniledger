import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

/**
 * Solid field card for the auth screens. This used to be a translucent
 * glass card (expo-blur over the drifting blobs); on top of the gray page
 * background it read as a disabled field, so it is now plain white with a
 * visible separator border. When `focused`, the border turns emerald and a
 * branded outline ring appears, so keyboard focus is unmistakable (RN Web
 * has no :focus pseudo-class, so the parent field drives this from
 * onFocus). Same padding and radius as before, so layouts don't move.
 */
export function FieldCard({
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
        focused && {
          outlineStyle: 'solid',
          outlineWidth: 2,
          outlineColor: colors.tintText,
          outlineOffset: 2,
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
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
