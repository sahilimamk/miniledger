import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Summary } from '../api/types';
import { AppIcon } from './AppIcon';
import { CountUp } from './CountUp';
import { sectionInset, spacing } from '../theme/spacing';
import { cardShadow } from '../theme/elevation';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { formatDate, formatINR } from '../utils/format';

type IconProps = ComponentProps<typeof AppIcon>;

interface SummaryCardProps {
  summary: Summary;
  /** Soonest upcoming repayment, shown as a tinted strip on the hero. */
  nextDue?: { friendName: string; dueDate: string } | null;
}

interface MiniStatProps {
  symbol: IconProps['symbol'];
  ionicon: IconProps['ionicon'];
  iconColor: string;
  value: string;
  label: string;
}

function MiniStat({ symbol, ionicon, iconColor, value, label }: MiniStatProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.miniStat}>
      <AppIcon symbol={symbol} ionicon={ionicon} size={20} color={iconColor} />
      <Text style={[typography.headline, styles.miniValue, { color: colors.label }]}>
        {value}
      </Text>
      <Text style={[typography.footnote, { color: colors.secondaryLabel }]}>{label}</Text>
    </View>
  );
}

/**
 * Wallet-style balance card (v13: a white card with navy ink — the
 * gradient hero is gone): outstanding amount with count-up, a repayment
 * progress bar, and the three totals as an icon stat row below.
 * (Phones only — the desktop layout has its own StatStrip.)
 */
export function SummaryCard({ summary, nextDue }: SummaryCardProps) {
  const { colors, isDark } = useTheme();
  const repaidPct =
    summary.totalLent > 0 ? Math.round((summary.totalRepaid / summary.totalLent) * 100) : 0;

  return (
    <View>
      <View
        style={[
          styles.heroCard,
          cardShadow(isDark),
          {
            backgroundColor: colors.secondarySystemGroupedBackground,
            borderColor: colors.separator,
          },
        ]}
        accessibilityLabel={`Outstanding ${formatINR(summary.outstanding)}. Total lent ${formatINR(summary.totalLent)}, repaid ${formatINR(summary.totalRepaid)}, overdue ${formatINR(summary.overdueAmount)}.`}
      >
        <View style={styles.heroContent}>
          <Text style={[typography.subhead, { color: colors.secondaryLabel }]}>
            Still to be repaid
          </Text>
          <CountUp
            value={summary.outstanding}
            format={formatINR}
            style={[typography.display, styles.heroAmount, { color: colors.label }]}
          />
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${repaidPct}%`, backgroundColor: colors.systemGreen },
              ]}
            />
          </View>
          <View style={styles.heroFoot}>
            <Text style={[typography.footnote, { color: colors.secondaryLabel }]}>
              {summary.counts.pending} of {summary.counts.total}{' '}
              {summary.counts.total === 1 ? 'loan' : 'loans'} pending
            </Text>
            <Text style={[typography.footnote, { color: colors.secondaryLabel }]}>
              {repaidPct}% repaid
            </Text>
          </View>
          {nextDue ? (
            <View style={styles.nextDueStrip}>
              <AppIcon symbol="clock.fill" ionicon="time" size={13} color={colors.systemGreen} />
              <Text
                style={[typography.footnote, styles.nextDueText, { color: colors.label }]}
                numberOfLines={1}
              >
                Next due: {nextDue.friendName} · {formatDate(nextDue.dueDate)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.miniRow}>
        <MiniStat
          symbol="indianrupeesign.circle"
          ionicon="cash-outline"
          iconColor={colors.tint}
          value={formatINR(summary.totalLent)}
          label="Total lent"
        />
        <MiniStat
          symbol="checkmark.circle.fill"
          ionicon="checkmark-circle"
          iconColor={colors.systemGreen}
          value={formatINR(summary.totalRepaid)}
          label="Repaid"
        />
        <MiniStat
          symbol="exclamationmark.circle.fill"
          ionicon="alert-circle"
          iconColor={summary.overdueAmount > 0 ? colors.systemRed : colors.systemGray}
          value={formatINR(summary.overdueAmount)}
          label="Overdue"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: sectionInset,
    marginTop: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  heroAmount: {
    marginVertical: spacing.sm,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(10, 37, 64, 0.08)',
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    minWidth: 12,
  },
  heroFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  /** Tinted strip along the hero's foot: soonest upcoming repayment. */
  nextDueStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 143, 111, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 111, 0.16)',
  },
  nextDueText: {
    flex: 1,
  },
  miniRow: {
    flexDirection: 'row',
    marginHorizontal: sectionInset,
    marginTop: spacing.lg,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniValue: {
    fontVariant: ['tabular-nums'],
  },
});
