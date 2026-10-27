import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../api/client';
import { getSummary, listLoans } from '../api/loans';
import type { Loan, Summary } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { AppIcon } from '../components/AppIcon';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoansSkeleton } from '../components/LoansSkeleton';
import { LoanRow } from '../components/LoanRow';
import { OverviewDesktop } from '../components/OverviewDesktop';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { SummaryCard } from '../components/SummaryCard';
import { mainNav } from '../hooks/useMainNav';
import { useIsWide } from '../hooks/useIsWide';
import { useRailLayout } from '../hooks/useRailLayout';
import type { MainStackParamList } from '../navigation/types';
import { sectionInset, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { confirmAction } from '../utils/confirm';

type Props = NativeStackScreenProps<MainStackParamList, 'Overview'>;

/**
 * Overview (v11): the dashboard and the app's front door — totals, what
 * needs attention, what's due next, and a short recent-loans preview.
 * The full ledger lives on the Loans route; until v11 both rail items
 * rendered this same content because Loans was the only route.
 */
export function OverviewScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const isWide = useIsWide();
  const railMode = useRailLayout();
  const nav = mainNav(navigation, 'overview');

  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [loanData, summaryData] = await Promise.all([listLoans(), getSummary()]);
      const sorted = [...loanData].sort((a, b) => {
        if (a.repaid !== b.repaid) return a.repaid ? 1 : -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      setLoans(sorted);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your loans.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
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
          <Text style={[typography.body, { color: colors.tint }]}>Log out</Text>
        </Pressable>
      ),
    });
  }, [navigation, logout, colors, railMode]);

  if (loans === null && error === null) {
    return (
      <Screen maxWidth={isWide ? 1080 : undefined} nav={nav}>
        <LoansSkeleton />
      </Screen>
    );
  }

  if (loans === null && error !== null) {
    return (
      <Screen maxWidth={isWide ? 1080 : undefined} nav={nav}>
        <ErrorBanner message={error} onRetry={() => load()} />
        <EmptyState
          title="Nothing loaded"
          message="Check your connection, then tap Retry above."
        />
      </Screen>
    );
  }

  const items = loans ?? [];
  const overdueLoans = items.filter((loan) => loan.isOverdue);
  const recentLoans = items.slice(0, 4);
  const nextDueLoan = items
    .filter((loan) => !loan.repaid && !loan.isOverdue)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0];
  const nextDue = nextDueLoan
    ? { friendName: nextDueLoan.friendName, dueDate: nextDueLoan.dueDate }
    : null;
  const openLoan = (loan: Loan) =>
    navigation.navigate('LoanDetail', { loanId: loan.id });

  if (isWide) {
    return (
      <Screen maxWidth={1080} nav={nav}>
        <OverviewDesktop
          loans={items}
          summary={summary}
          error={error}
          onRetry={() => load()}
          onAddLoan={() => navigation.navigate('AddLoan')}
          onOpenLoan={openLoan}
          onViewAllLoans={() => navigation.navigate('Loans')}
        />
      </Screen>
    );
  }

  return (
    <Screen nav={nav}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {error ? <ErrorBanner message={error} onRetry={() => load()} /> : null}
        {summary ? <SummaryCard summary={summary} nextDue={nextDue} /> : null}

        {items.length === 0 ? (
          <View>
            <EmptyState
              title="No loans yet"
              message="Record the first amount you've lent."
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
        ) : (
          <View>
            {overdueLoans.length > 0 ? (
              <View>
                <Text
                  accessibilityRole="header"
                  style={[
                    typography.sectionHeader,
                    styles.sectionTitle,
                    { color: colors.secondaryLabel },
                  ]}
                >
                  Needs attention
                </Text>
                <View style={styles.rowWrap}>
                  {overdueLoans.map((loan, index) => (
                    <View key={loan.id} style={index > 0 ? styles.cardGap : undefined}>
                      <LoanRow loan={loan} index={index} card onPress={openLoan} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <Text
              accessibilityRole="header"
              style={[
                typography.sectionHeader,
                styles.sectionTitle,
                { color: colors.secondaryLabel },
              ]}
            >
              Recent loans
            </Text>
            <View style={styles.rowWrap}>
              {recentLoans.map((loan, index) => (
                <View key={loan.id} style={index > 0 ? styles.cardGap : undefined}>
                  <LoanRow loan={loan} index={index} card onPress={openLoan} />
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all loans"
              onPress={() => navigation.navigate('Loans')}
              style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
            >
              <Text style={[typography.headline, { color: colors.tint }]}>
                View all loans
              </Text>
              <AppIcon
                symbol="chevron.right"
                ionicon="chevron-forward"
                size={14}
                color={colors.tint}
              />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    marginHorizontal: sectionInset * 2,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  rowWrap: {
    marginHorizontal: sectionInset,
  },
  cardGap: {
    marginTop: spacing.sm,
  },
  emptyCta: {
    marginHorizontal: sectionInset,
    marginTop: spacing.lg,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginHorizontal: sectionInset * 2,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
