import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Loan } from '../api/types';
import { AppIcon } from './AppIcon';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { LoanRow } from './LoanRow';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

interface LoansDesktopProps {
  loans: Loan[];
  error: string | null;
  onRetry: () => void;
  onAddLoan: () => void;
  onOpenLoan: (loan: Loan) => void;
}

/**
 * Desktop layout for the Loans page (v11): the full ledger, nothing else.
 * Until v11 this component was the dashboard (stat cards + list + rail)
 * and the rail's Overview item rendered it too — one page wearing two
 * names. The dashboard now lives in OverviewDesktop; this page is a pure
 * list with a count line, so the two destinations are visibly different.
 */
export function LoansDesktop({
  loans,
  error,
  onRetry,
  onAddLoan,
  onOpenLoan,
}: LoansDesktopProps) {
  const { colors } = useTheme();
  const pending = loans.filter((loan) => !loan.repaid).length;
  const overdue = loans.filter((loan) => loan.isOverdue).length;
  const countLine =
    loans.length === 0
      ? 'Nothing recorded yet'
      : `${loans.length} ${loans.length === 1 ? 'loan' : 'loans'} · ${pending} pending${
          overdue > 0 ? ` · ${overdue} overdue` : ''
        }`;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.pageHead}>
        <View>
          <Text style={[typography.largeTitle, { color: colors.label }]}>Loans</Text>
          <Text
            style={[
              typography.subhead,
              styles.countLine,
              { color: colors.secondaryLabel },
            ]}
          >
            {countLine}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add loan"
          onPress={onAddLoan}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: pressed ? colors.accentPressed : colors.tint },
          ]}
        >
          <AppIcon symbol="plus" ionicon="add" size={16} color={colors.onTint} />
          <Text style={[typography.headline, styles.addButtonText, { color: colors.onTint }]}>
            Add Loan
          </Text>
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} onRetry={onRetry} /> : null}

      {loans.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="No loans yet"
            message="Record the first amount you've lent."
            symbol="person.2.fill"
            ionicon="people-outline"
            iconSize={64}
            iconColor={colors.tint}
          />
          <View style={styles.emptyAction}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add your first loan"
              onPress={onAddLoan}
              style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: pressed ? colors.accentPressed : colors.tint },
          ]}
            >
              <AppIcon symbol="plus" ionicon="add" size={16} color={colors.onTint} />
              <Text style={[typography.headline, styles.addButtonText, { color: colors.onTint }]}>
                Add your first loan
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          {loans.map((loan, index) => (
            <View key={loan.id} style={index > 0 ? styles.cardGap : undefined}>
              <LoanRow loan={loan} index={index} card onPress={onOpenLoan} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  pageHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  countLine: {
    marginTop: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonText: {
    fontSize: 15,
  },
  cardGap: {
    marginTop: spacing.sm,
  },
  emptyWrap: {
    marginTop: spacing.xl,
  },
  emptyAction: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});
