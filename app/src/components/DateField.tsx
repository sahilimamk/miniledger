
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { sectionInset, spacing } from '../theme/spacing';
import { font, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { formatDate } from '../utils/format';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

interface DateFieldProps {
  label: string;
  /** Current value as YYYY-MM-DD ('' when unset). */
  value: string;
  onChange: (iso: string) => void;
  error?: string | null;
}

/**
 * A due-date field in the v7 form style: label over a filled well that
 * shows the picked date in words ("24 Oct 2026"). Tapping opens a calendar
 * sheet — nobody should have to type an ISO date by hand. The value stays
 * a YYYY-MM-DD string, which is what the API expects.
 */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [triggerFocused, setTriggerFocused] = useState(false);
  const now = new Date();
  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const sel = parsed
    ? { y: Number(parsed[1]), m: Number(parsed[2]) - 1, d: Number(parsed[3]) }
    : null;
  const [view, setView] = useState(() => ({
    y: sel?.y ?? now.getFullYear(),
    m: sel?.m ?? now.getMonth(),
  }));

  function openPicker() {
    setView({ y: sel?.y ?? now.getFullYear(), m: sel?.m ?? now.getMonth() });
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const total = v.y * 12 + v.m + delta;
      return { y: Math.floor(total / 12), m: total % 12 };
    });
  }

  const firstDow = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <View style={styles.wrap}>
      <Text style={[typography.subhead, styles.label, { color: colors.secondaryLabel }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={openPicker}
        onFocus={() => setTriggerFocused(true)}
        onBlur={() => setTriggerFocused(false)}
        style={[
          styles.field,
          {
            backgroundColor: colors.secondarySystemBackground,
            borderColor: error ? colors.systemRed : colors.separator,
          },
          // Web keyboard focus ring (same pattern as PrimaryButton).
          triggerFocused && {
            outlineStyle: 'solid',
            outlineWidth: 2,
            outlineColor: colors.tintText,
            outlineOffset: 2,
          },
        ]}
      >
        <AppIcon symbol="calendar" ionicon="calendar-outline" size={18} color={colors.secondaryLabel} />
        <Text
          style={[
            typography.body,
            { color: value ? colors.label : colors.secondaryLabel },
          ]}
        >
          {value ? formatDate(value) : 'Pick a date'}
        </Text>
      </Pressable>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.footnote, styles.error, { color: colors.systemRed }]}
        >
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.secondarySystemGroupedBackground,
                borderColor: colors.separator,
              },
            ]}
            onPress={() => undefined}
          >
            <View style={styles.sheetHead}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                hitSlop={10}
                onPress={() => shiftMonth(-1)}
              >
                <AppIcon symbol="chevron.left" ionicon="chevron-back" size={20} color={colors.label} />
              </Pressable>
              <Text style={[typography.headline, { color: colors.label }]}>
                {MONTHS[view.m]} {view.y}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                hitSlop={10}
                onPress={() => shiftMonth(1)}
              >
                <AppIcon
                  symbol="chevron.right"
                  ionicon="chevron-forward"
                  size={20}
                  color={colors.label}
                />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((d) => (
                <Text
                  key={d}
                  style={[typography.caption, styles.weekDay, { color: colors.secondaryLabel }]}
                >
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`b${i}`} style={styles.cell} />;
                const iso = toIso(view.y, view.m, day);
                const isSel = sel !== null && iso === value.trim();
                const isToday = iso === todayIso;
                return (
                  <Pressable
                    key={iso}
                    accessibilityRole="button"
                    accessibilityLabel={formatDate(iso)}
                    hitSlop={4}
                    style={styles.cell}
                    onPress={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                  >
                    {isSel ? (
                      <View style={[styles.dayCircle, { backgroundColor: colors.tint }]}>
                        <Text style={[styles.dayText, { color: '#FFFFFF', fontFamily: font.bold }]}>
                          {day}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.dayCircle,
                          isToday && { borderWidth: 1, borderColor: colors.tint },
                        ]}
                      >
                        <Text style={[styles.dayText, { color: colors.label }]}>{day}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sheetFoot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear date"
                hitSlop={8}
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
                style={styles.sheetFootButton}
              >
                <Text style={[typography.subhead, { color: colors.systemRed }]}>Clear</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Jump to today"
                hitSlop={8}
                onPress={() => {
                  onChange(todayIso);
                  setOpen(false);
                }}
                style={styles.sheetFootButton}
              >
                <Text style={[typography.subhead, { color: colors.tint }]}>Today</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  error: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: 340,
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.lg,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: font.medium,
    fontSize: 14,
  },
  sheetFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sheetFootButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
