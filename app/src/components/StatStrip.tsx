import { StyleSheet, Text, View } from 'react-native';

import type { Summary } from '../api/types';
import { AppIcon } from './AppIcon';
import { CountUp } from './CountUp';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { cardShadow, prominentShadow } from '../theme/elevation';
import { useTheme } from '../theme/useTheme';
import { formatINR } from '../utils/format';

interface StatStripProps {
  summary: Summary;
}

type StatVariant = 'hero' | 'standard' | 'alert';

interface StatCardProps {
  label: string;
  value: string;
  countUpTo?: number;
  sub?: string;
  icon: {
    symbol: React.ComponentProps<typeof AppIcon>['symbol'];
    ionicon: React.ComponentProps<typeof AppIcon>['ionicon'];
  };
  /** Icon badge colour: tints the disc and the glyph. */
  badge: string;
  /** Value text colour (independent of the badge since v10). */
  valueColor: string;
  /** Semantic colour of the card's top accent bar. */
  accent: string;
  variant?: StatVariant;
  /** Share bar under the value (0–100): this card's slice of a whole. */
  bar?: { pct: number; color: string };
}

/**
 * One KPI card. v11 breaks the v9/v10 sameness — four identical rounded
 * rectangles in a row is the generic AI-dashboard shape. Now the layout
 * itself ranks the numbers:
 * - every card carries a thin top accent bar in its semantic colour
 *   (the 1px-ring idea from layered fintech systems, moved to the top edge);
 * - the hero (outstanding) and an active overdue card are physically
 *   larger — wider flex, deeper padding, bigger type, deeper shadow;
 * - repaid and overdue carry a share bar (their slice of the money), so
 *   colour does data work instead of only decorating badges.
 * Radius tightens 16 → 12, closer to the ~10px base radius real fintech
 * systems derive their card radius from. Palette tokens are unchanged.
 */
function StatCard({
  label,
  value,
  countUpTo,
  sub,
  icon,
  badge,
  valueColor,
  accent,
  variant = 'standard',
  bar,
}: StatCardProps) {
  const { colors, isDark } = useTheme();
  const prominent = variant !== 'standard';
  const alert = variant === 'alert';
  return (
    <View
      style={[
        styles.card,
        prominent ? prominentShadow(isDark) : cardShadow(isDark),
        {
          flex: prominent ? 1.3 : 1,
          backgroundColor: alert
            ? colors.dangerTint
            : colors.secondarySystemGroupedBackground,
          borderColor: alert ? 'rgba(214, 69, 69, 0.35)' : colors.separator,
        },
      ]}
    >
      <View
        style={[
          styles.accent,
          { backgroundColor: accent, height: alert ? 4 : 3 },
        ]}
      />
      <View style={prominent ? styles.bodyProminent : styles.body}>
        <View
          style={[
            prominent ? styles.iconDiscLarge : styles.iconDisc,
            { backgroundColor: `${badge}26` },
          ]}
        >
          <AppIcon
            symbol={icon.symbol}
            ionicon={icon.ionicon}
            size={prominent ? 18 : 15}
            color={badge}
          />
        </View>
        <Text
          style={[styles.label, { color: colors.secondaryLabel }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {countUpTo !== undefined ? (
          <CountUp
            value={countUpTo}
            format={formatINR}
            style={[
              variant === 'hero' ? styles.heroValue : styles.value,
              { color: valueColor },
            ]}
          />
        ) : (
          <Text
            style={[
              variant === 'hero'
                ? styles.heroValue
                : alert
                  ? styles.alertValue
                  : styles.value,
              { color: valueColor },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        )}
        {bar ? (
          <View
            style={[styles.barTrack, { backgroundColor: `${bar.color}26` }]}
          >
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: bar.color,
                  width: `${Math.max(0, Math.min(100, bar.pct))}%`,
                },
              ]}
            />
          </View>
        ) : null}
        {sub ? (
          <Text
            style={[typography.footnote, { color: colors.secondaryLabel }]}
            numberOfLines={1}
          >
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Desktop KPI row (Overview only since v11 — the Loans page is a pure
 * list). Outstanding is the hero; overdue joins it at hero size only while
 * money is actually late.
 */
export function StatStrip({ summary }: StatStripProps) {
  const { colors } = useTheme();
  const pendingLine = `${summary.counts.pending} of ${summary.counts.total} ${
    summary.counts.total === 1 ? 'loan' : 'loans'
  } pending`;
  const overdueActive = summary.overdueAmount > 0;
  const overdueCount = summary.counts.overdue;
  const repaidPct =
    summary.totalLent > 0
      ? Math.round((summary.totalRepaid / summary.totalLent) * 100)
      : 0;
  const outstandingPct =
    summary.totalLent > 0
      ? Math.round((summary.outstanding / summary.totalLent) * 100)
      : 0;
  const overduePct =
    summary.outstanding > 0
      ? Math.round((summary.overdueAmount / summary.outstanding) * 100)
      : 0;

  return (
    <View
      style={styles.row}
      accessibilityLabel={`Outstanding ${formatINR(summary.outstanding)}. Total lent ${formatINR(summary.totalLent)}, repaid ${formatINR(summary.totalRepaid)}, overdue ${formatINR(summary.overdueAmount)}.`}
    >
      <StatCard
        label="Still to be repaid"
        value={formatINR(summary.outstanding)}
        countUpTo={summary.outstanding}
        sub={pendingLine}
        icon={{ symbol: 'clock.fill', ionicon: 'time' }}
        badge={colors.tint}
        valueColor={colors.label}
        accent={colors.tint}
        variant="hero"
        bar={{ pct: outstandingPct, color: colors.tint }}
      />
      <StatCard
        label="Total lent"
        value={formatINR(summary.totalLent)}
        sub={`across ${summary.counts.total} ${
          summary.counts.total === 1 ? 'loan' : 'loans'
        }`}
        icon={{ symbol: 'wallet.pass.fill', ionicon: 'wallet' }}
        badge="#0A2540"
        valueColor={colors.label}
        accent="#0A2540"
      />
      <StatCard
        label="Repaid"
        value={formatINR(summary.totalRepaid)}
        sub={`${repaidPct}% of everything lent`}
        icon={{ symbol: 'checkmark.circle.fill', ionicon: 'checkmark-circle' }}
        badge={colors.systemGreen}
        valueColor={colors.systemGreen}
        accent={colors.systemGreen}
        bar={{ pct: repaidPct, color: colors.systemGreen }}
      />
      <StatCard
        label="Overdue"
        value={formatINR(summary.overdueAmount)}
        sub={
          overdueActive
            ? `${overduePct}% of what's still out · ${overdueCount} ${
                overdueCount === 1 ? 'loan' : 'loans'
              } late`
            : 'Nothing overdue'
        }
        icon={{ symbol: 'exclamationmark.triangle.fill', ionicon: 'warning' }}
        badge={overdueActive ? colors.systemRed : colors.systemGray}
        valueColor={overdueActive ? colors.systemRed : colors.label}
        accent={overdueActive ? colors.systemRed : colors.systemGray}
        variant={overdueActive ? 'alert' : 'standard'}
        bar={
          overdueActive
            ? { pct: overduePct, color: colors.systemRed }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
  },
  accent: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  bodyProminent: {
    paddingHorizontal: spacing.lg + 4,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg + 4,
  },
  iconDisc: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconDiscLarge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  /** Data-dense fintech label: small, medium, tracked out, uppercase —
   *  hierarchy carried by type, not by another colour. */
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  heroValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.sm,
  },
  alertValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.sm,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
    minWidth: 6,
  },
});
