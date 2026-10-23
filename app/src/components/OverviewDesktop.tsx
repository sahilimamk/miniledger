import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Loan, Summary } from '../api/types';
import { AppIcon } from './AppIcon';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { LoanRow } from './LoanRow';
import { StatStrip } from './StatStrip';
import { sectionInset, sectionRadius, spacing } from '../theme/spacing';
import { cardShadow } from '../theme/elevation';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { daysUntil, formatDate, formatINR } from '../utils/format';

interface OverviewDesktopProps {
  loans: Loan[];
  summary: Summary | null;
  error: string | null;
  onRetry: () => void;
  onAddLoan: () => void;
  onOpenLoan: (loan: Loan) => void;
  onViewAllLoans: () => void;
}

export function GroupedCard({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        cardShadow(isDark),
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: colors.separator,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typography.sectionHeader,
        styles.sectionTitle,
        { color: colors.secondaryLabel },
      ]}
    >
      {children}
    </Text>
  );
}

/**
 * Compact overdue row for "Needs attention" — deliberately NOT a clone of
 * the main list row: name, how late it is, and the amount, so it reads as
 * an alert summary instead of a copy of the list.
 */
export function AttentionRow({
  loan,
  onPress,
}: {
  loan: Loan;
  onPress: (loan: Loan) => void;
}) {
  const { colors, isDark } = useTheme();
  const days = Math.max(0, -daysUntil(loan.dueDate));
  const late =
    days === 0 ? 'Due today' : days === 1 ? '1 day overdue' : `${days} days overdue`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${loan.friendName}, ${formatINR(loan.amount)}, ${late}`}
      onPress={() => onPress(loan)}
      style={({ pressed }) => [
        styles.attentionRow,
        cardShadow(isDark),
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: colors.separator,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.attentionMain}>
        <Text style={[typography.headline, { color: colors.label }]} numberOfLines={1}>
          {loan.friendName}
        </Text>
        <Text style={[typography.footnote, { color: colors.systemRed }]}>{late}</Text>
      </View>
      <Text style={[typography.headline, { color: colors.systemRed }]}>
        {formatINR(loan.amount)}
      </Text>
      <AppIcon
        symbol="chevron.right"
        ionicon="chevron-forward"
        size={13}
        color={colors.tertiaryLabel}
      />
    </Pressable>
  );
}

/**
 * The Overview page (v11): the dashboard. KPI cards across the top, then
 * what needs attention and what's coming up — NOT the full ledger. The
 * complete list lives on the Loans page; this page ends the recent-loans
 * preview with a "View all" jump so the two pages never blur together.
 */
export function OverviewDesktop({
  loans,
  summary,
  error,
  onRetry,
  onAddLoan,
  onOpenLoan,
  onViewAllLoans,
}: OverviewDesktopProps) {
  const { colors } = useTheme();
  const overdueLoans = loans.filter((loan) => loan.isOverdue);
  const recentLoans = loans.slice(0, 4);
  const nextDue =
    loans
      .filter((loan) => !loan.repaid && !loan.isOverdue)
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0] ?? null;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.pageHead}>
        <Text style={[typography.largeTitle, { color: colors.label }]}>Overview</Text>
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
      {summary ? <StatStrip summary={summary} /> : null}

      {loans.length === 0 ? (
        <View style={styles.emptyWrap}>
          <GroupedCard>
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
          </GroupedCard>
        </View>
      ) : (
        <View style={styles.columns}>
          <View style={styles.mainColumn}>
            {overdueLoans.length > 0 ? (
              <View>
                <SectionTitle>Needs attention</SectionTitle>
                <View>
                  {overdueLoans.map((loan, index) => (
                    <View key={loan.id} style={index > 0 ? styles.cardGap : undefined}>
                      <AttentionRow loan={loan} onPress={onOpenLoan} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={overdueLoans.length > 0 ? styles.blockGap : undefined}>
              <SectionTitle>Recent loans</SectionTitle>
              <View>
                {recentLoans.map((loan, index) => (
                  <View key={loan.id} style={index > 0 ? styles.cardGap : undefined}>
                    <LoanRow loan={loan} index={index} card onPress={onOpenLoan} />
                  </View>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View all loans"
                onPress={onViewAllLoans}
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
          </View>

          <View style={styles.rail}>
            {nextDue ? (
              <View>
                <SectionTitle>Next due</SectionTitle>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${nextDue.friendName}, ${formatINR(nextDue.amount)}, due ${formatDate(nextDue.dueDate)}`}
                  onPress={() => onOpenLoan(nextDue)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <GroupedCard>
                    <View style={styles.nextDueBody}>
                      <Text
                        style={[typography.headline, { color: colors.label }]}
                        numberOfLines={1}
                      >
                        {nextDue.friendName}
                      </Text>
                      <Text style={[typography.footnote, { color: colors.secondaryLabel }]}>
                        Due {formatDate(nextDue.dueDate)}
                      </Text>
                      <Text
                        style={[typography.title, styles.nextDueAmount, { color: colors.label }]}
                      >
                        {formatINR(nextDue.amount)}
                      </Text>
                    </View>
                  </GroupedCard>
                </Pressable>
              </View>
            ) : (
              <View>
                <SectionTitle>Status</SectionTitle>
                <GroupedCard>
                  <View style={styles.allClear}>
                    <AppIcon
                      symbol="checkmark.circle.fill"
                      ionicon="checkmark-circle"
                      size={22}
                      color={colors.systemGreen}
                    />
                    <Text
                      style={[typography.body, styles.allClearText, { color: colors.secondaryLabel }]}
                    >
                      All clear — nothing overdue, nothing coming up.
                    </Text>
                  </View>
                </GroupedCard>
              </View>
            )}
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
  emptyWrap: {
    marginTop: spacing.xl,
  },
  emptyAction: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  mainColumn: {
    flex: 1,
  },
  rail: {
    width: 320,
  },
  blockGap: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    marginLeft: sectionInset,
    marginBottom: spacing.sm,
  },
  cardGap: {
    marginTop: spacing.sm,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  attentionMain: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginLeft: sectionInset,
    alignSelf: 'flex-start',
  },
  card: {
    borderRadius: sectionRadius,
    overflow: 'hidden',
    borderWidth: 1,
  },
  nextDueBody: {
    paddingHorizontal: sectionInset,
    paddingVertical: spacing.lg,
    gap: 2,
  },
  nextDueAmount: {
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  allClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: sectionInset,
    paddingVertical: spacing.lg,
  },
  allClearText: {
    flex: 1,
  },
});
