import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { confirmAction } from '../utils/confirm';
import { AppIcon } from './AppIcon';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

export type NavKey = 'overview' | 'loans' | 'add';

interface NavRailProps {
  /** Which destination is current. Loan Detail passes 'loans'. */
  active: NavKey;
  onNavigate: (key: NavKey) => void;
}

interface RailItemProps {
  label: string;
  symbol: React.ComponentProps<typeof AppIcon>['symbol'];
  ionicon: React.ComponentProps<typeof AppIcon>['ionicon'];
  isActive: boolean;
  onPress: () => void;
}

function RailItem({ label, symbol, ionicon, isActive, onPress }: RailItemProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const tint = isActive ? colors.tint : colors.secondaryLabel;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.item,
        isActive && { backgroundColor: `${colors.tint}24` },
        pressed && styles.pressed,
        focused && {
          outlineStyle: 'solid',
          outlineWidth: 2,
          outlineColor: colors.tintText,
          outlineOffset: 2,
        },
      ]}
    >
      <AppIcon symbol={symbol} ionicon={ionicon} size={19} color={tint} />
      {isActive ? (
        <View style={[styles.activeBar, { backgroundColor: colors.tint }]} />
      ) : null}
      <Text
        style={[
          typography.headline,
          styles.itemLabel,
          { color: isActive ? colors.label : colors.secondaryLabel },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The app shell's left navigation rail (windows ≥ 900px). Below that width
 * the app keeps its phone layout with the native stack header; in rail mode
 * the header hides and this takes over: brand, destinations, account, and
 * log out pinned to the bottom.
 */
export function NavRail({ active, onNavigate }: NavRailProps) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [logoutFocused, setLogoutFocused] = useState(false);

  function confirmLogout() {
    confirmAction({
      title: 'Log out?',
      message: 'You will need your phone number and a code to sign in again.',
      confirmLabel: 'Log out',
      destructive: true,
      onConfirm: () => logout(),
    });
  }

  return (
    <View
      style={[
        styles.rail,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderRightColor: colors.separator,
        },
      ]}
    >
      <View style={styles.brand}>
        <View style={[styles.logoDisc, { backgroundColor: colors.tint }]}>
          <AppIcon symbol="banknote" ionicon="cash-outline" size={18} color={colors.onTint} />
        </View>
        <Text style={[typography.headline, { color: colors.label }]}>MiniLedger</Text>
      </View>

      <View style={styles.items}>
        <RailItem
          label="Overview"
          symbol="square.grid.2x2"
          ionicon="grid-outline"
          isActive={active === 'overview'}
          onPress={() => onNavigate('overview')}
        />
        <RailItem
          label="Loans"
          symbol="list.bullet"
          ionicon="list-outline"
          isActive={active === 'loans'}
          onPress={() => onNavigate('loans')}
        />
        <RailItem
          label="Add Loan"
          symbol="plus.circle"
          ionicon="add-circle-outline"
          isActive={active === 'add'}
          onPress={() => onNavigate('add')}
        />
      </View>

      <View style={styles.spacer} />

      {user ? (
        <Text style={[typography.footnote, styles.account, { color: colors.secondaryLabel }]}>
          Signed in as {user.phone}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={confirmLogout}
        onFocus={() => setLogoutFocused(true)}
        onBlur={() => setLogoutFocused(false)}
        style={({ pressed }) => [
          styles.item,
          pressed && styles.pressed,
          logoutFocused && {
            outlineStyle: 'solid',
            outlineWidth: 2,
            outlineColor: colors.tintText,
            outlineOffset: 2,
          },
        ]}
      >
        <AppIcon
          symbol="rectangle.portrait.and.arrow.right"
          ionicon="log-out-outline"
          size={19}
          color={colors.systemRed}
        />
        <Text style={[typography.headline, styles.itemLabel, { color: colors.label }]}>
          Log out
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 232,
    borderRightWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoDisc: {
    width: 34,
    height: 34,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
    borderRadius: 12,
  },
  itemLabel: {
    fontSize: 15,
  },
  /** Priority cue borrowed from data-dense fintech navs: the current
   *  destination gets a solid accent tick, not just a tint wash. */
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '30%',
    height: '40%',
    width: 3,
    borderRadius: 2,
  },
  pressed: {
    opacity: 0.65,
  },
  spacer: {
    flex: 1,
  },
  account: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
