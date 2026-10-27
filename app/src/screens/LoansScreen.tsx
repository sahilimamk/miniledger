import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../api/client';
import { listLoans } from '../api/loans';
import type { Loan } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { AppIcon } from '../components/AppIcon';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoansDesktop } from '../components/LoansDesktop';
import { LoansSkeleton } from '../components/LoansSkeleton';
import { LoanRow } from '../components/LoanRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useRailLayout } from '../hooks/useRailLayout';
import { mainNav } from '../hooks/useMainNav';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { confirmAction } from '../utils/confirm';
import type { MainStackParamList } from '../navigation/types';
import { useIsWide } from '../hooks/useIsWide';
import { sectionInset, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type Props = NativeStackScreenProps<MainStackParamList, 'Loans'>;

export function LoansScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const isWide = useIsWide();
  const railMode = useRailLayout();
  const screenMax = isWide ? 1080 : undefined;
  const nav = mainNav(navigation, 'loans');
  const fabScale = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));
  // The pulsing ring is decorative motion: under prefers-reduced-motion it
  // is omitted entirely (Entrance/DriftingBlobs already honor the same).
  const reduceMotion = usePrefersReducedMotion();
  const fabPulse = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    fabPulse.value = withRepeat(withTiming(1, { duration: 2100 }), -1, false);
  }, [fabPulse, reduceMotion]);
  const fabRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(fabPulse.value, [0, 1], [1, 1.45]) }],
    opacity: interpolate(fabPulse.value, [0, 1], [0.45, 0]),
  }));

  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fabFocused, setFabFocused] = useState(false);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    try {
      const loanData = await listLoans();
      // Urgency order: overdue first (oldest due date first), then unpaid by
      // due date, repaid last. The list should read like a to-do list.
      const sorted = [...loanData].sort((a, b) => {
        if (a.repaid !== b.repaid) return a.repaid ? 1 : -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      setLoans(sorted);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your loans.');
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !railMode,
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          hitSlop={8}
          style={[styles.logoutButton, { minHeight: 44, justifyContent: 'center' }]}
          onPress={() => {
            confirmAction({
              title: 'Log out?',
              message: 'You will need your phone number and a code to sign in again.',
              confirmLabel: 'Log out',
              destructive: true,
              onConfirm: () => logout(),
            });
          }}
        >
          <Text style={[typography.body, { color: colors.tintText }]}>Log out</Text>
        </Pressable>
      ),
    });
  }, [navigation, logout, colors, railMode]);

  if (loans === null && error === null) {
    return (
      <Screen maxWidth={screenMax} nav={nav}>
        <LoansSkeleton />
      </Screen>
    );
  }

  if (loans === null && error !== null) {
    return (
      <Screen maxWidth={screenMax} nav={nav}>
        <ErrorBanner message={error} onRetry={() => load(false)} />
        <EmptyState title="Nothing loaded" message="Check your connection, then tap Retry above." />
      </Screen>
    );
  }

  const items = loans ?? [];

  if (isWide) {
    return (
      <Screen maxWidth={1080} nav={nav}>
        <LoansDesktop
          loans={items}
          error={error}
          onRetry={() => load(false)}
          onAddLoan={() => navigation.navigate('AddLoan')}
          onOpenLoan={(loan) => navigation.navigate('LoanDetail', { loanId: loan.id })}
        />
      </Screen>
    );
  }

  return (
    <Screen nav={nav}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.tint}
          />
        }
        ListHeaderComponent={
          <View>
            {error ? <ErrorBanner message={error} onRetry={() => load(false)} /> : null}
            {items.length > 0 ? (
              <Text
                accessibilityRole="header"
                style={[
                  typography.sectionHeader,
                  styles.listHeader,
                  { color: colors.secondaryLabel },
                ]}
              >
                Loans
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View>
            <EmptyState
              title="No loans yet"
              message="Tap the + button to record the first amount you've lent."
              symbol="person.2.fill"
              ionicon="people-outline"
              iconSize={64}
              iconColor={colors.tint}
            />
            <View style={styles.emptyCta}>
              <PrimaryButton
                title="Add your first loan"
                onPress={() => navigation.navigate('AddLoan')}
                accessibilityLabel="Add your first loan"
              />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.rowWrap}>
            <LoanRow
              loan={item}
              index={index}
              card
              onPress={(loan) => navigation.navigate('LoanDetail', { loanId: loan.id })}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.listContent}
      />

      <View style={[styles.fabWrap, { bottom: insets.bottom + spacing.lg }]}>
        {!reduceMotion ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.fabRing, { borderColor: colors.tint }, fabRingStyle]}
          />
        ) : null}
        <Animated.View style={fabAnimatedStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add loan"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
              navigation.navigate('AddLoan');
            }}
            onFocus={() => setFabFocused(true)}
            onBlur={() => setFabFocused(false)}
            onPressIn={() => {
              fabScale.value = withSpring(0.88, { damping: 13 });
            }}
            onPressOut={() => {
              fabScale.value = withSpring(1, { damping: 13 });
            }}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: colors.tint },
              pressed && styles.fabPressed,
              fabFocused && {
                outlineStyle: 'solid',
                outlineWidth: 2,
                outlineColor: colors.tintText,
                outlineOffset: 2,
              },
            ]}
          >
            <AppIcon symbol="plus" ionicon="add" size={28} color={colors.onTint} />
          </Pressable>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingBottom: 110,
  },
  listHeader: {
    marginHorizontal: sectionInset * 2,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  rowWrap: {
    marginHorizontal: sectionInset,
  },
  fabWrap: {
    position: 'absolute',
    right: spacing.lg,
  },
  fabRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  emptyCta: {
    marginHorizontal: sectionInset,
    marginTop: spacing.lg,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.8,
  },
});
