import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError, resolveAssetUrl } from '../api/client';
import { deleteLoan, getLoan, repayLoan, updateLoan } from '../api/loans';
import type { Loan } from '../api/types';
import { AppIcon } from '../components/AppIcon';
import { Avatar } from '../components/Avatar';
import { ErrorBanner } from '../components/ErrorBanner';
import { GroupedSection, RowSeparator } from '../components/GroupedSection';
import { LoadingView } from '../components/LoadingView';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { mainNav } from '../hooks/useMainNav';
import { confirmAction } from '../utils/confirm';
import { useRailLayout } from '../hooks/useRailLayout';
import { useToast } from '../components/Toast';
import { useIsWide } from '../hooks/useIsWide';
import type { MainStackParamList } from '../navigation/types';
import { sectionInset, spacing } from '../theme/spacing';
import { font, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { daysUntil, formatDate, formatDateTime, formatINR } from '../utils/format';
import { normalizePhone, validatePhone } from '../utils/validation';

type Props = NativeStackScreenProps<MainStackParamList, 'LoanDetail'>;

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
  isFirst?: boolean;
}

function DetailRow({ label, value, valueColor, isFirst = false }: DetailRowProps) {
  const { colors } = useTheme();
  return (
    <View>
      {isFirst ? null : <RowSeparator />}
      <View style={styles.detailRow}>
        <Text style={[typography.body, { color: colors.secondaryLabel }]}>{label}</Text>
        <Text
          style={[typography.body, styles.detailValue, { color: valueColor ?? colors.label }]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function LoanDetailScreen({ route, navigation }: Props) {
  const { loanId } = route.params;
  const { colors } = useTheme();
  const toast = useToast();
  const isWide = useIsWide();
  const railMode = useRailLayout();
  const nav = mainNav(navigation, 'loans');
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !railMode });
  }, [navigation, railMode]);

  const [loan, setLoan] = useState<Loan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'repay' | 'delete' | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  // Which action link has keyboard focus (delete/add-phone/cancel/save),
  // for the web focus ring.
  const [actionFocused, setActionFocused] = useState<string | null>(null);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getLoan(loanId);
      setLoan(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this loan.');
    }
  }, [loanId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRepay() {
    if (!loan) return;
    setBusy('repay');
    try {
      const updated = await repayLoan(loan.id);
      setLoan(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      toast.show({
        title: 'Marked repaid',
        message: `${updated.friendName} · ${formatINR(updated.amount)}`,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already repaid elsewhere — refresh to show the current state.
        await load();
      } else {
        toast.show({
          variant: 'error',
          title: 'Could not mark repaid',
          message: err instanceof ApiError ? err.message : 'Try again.',
        });
      }
    } finally {
      setBusy(null);
    }
  }

  /** Opens WhatsApp with a polite, prefilled reminder — never sends by itself. */
  function handleRemind() {
    if (!loan?.friendPhone) return;
    const firstName = loan.friendName.split(' ')[0];
    const days = daysUntil(loan.dueDate);
    const message =
      days < 0
        ? `Hi ${firstName}, hope you're doing well. Friendly reminder about the ${formatINR(loan.amount)} I lent you — it was due on ${formatDate(loan.dueDate)} (${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago). No stress if you need a little more time, just let me know. Thanks!`
        : `Hi ${firstName}, hope you're doing well. Friendly reminder about the ${formatINR(loan.amount)} I lent you — it's due on ${formatDate(loan.dueDate)}. Thanks!`;
    const digits = loan.friendPhone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`).catch(() => {
      toast.show({ variant: 'error', title: 'Could not open WhatsApp', message: 'Try again.' });
    });
  }

  async function handleSavePhone() {
    if (!loan) return;
    const problem = validatePhone(phoneDraft);
    if (problem) {
      toast.show({ variant: 'error', title: 'Check the number', message: problem });
      return;
    }
    setSavingPhone(true);
    try {
      const updated = await updateLoan(loan.id, { friendPhone: normalizePhone(phoneDraft) });
      setLoan(updated);
      setEditingPhone(false);
      setPhoneDraft('');
      toast.show({ title: 'Phone saved', message: 'WhatsApp reminders are on for this loan.' });
    } catch (err) {
      toast.show({
        variant: 'error',
        title: 'Could not save the phone',
        message: err instanceof ApiError ? err.message : 'Try again.',
      });
    } finally {
      setSavingPhone(false);
    }
  }

  function handleDelete() {
    if (!loan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    confirmAction({
      title: 'Delete this loan?',
      message: `The ${formatINR(loan.amount)} loan to ${loan.friendName} will be removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        setBusy('delete');
        try {
          await deleteLoan(loan.id);
          toast.show({
            title: 'Loan deleted',
            message: `${loan.friendName} · ${formatINR(loan.amount)}`,
            symbol: 'trash.fill',
            ionicon: 'trash',
            color: colors.systemRed,
          });
          navigation.goBack();
        } catch (err) {
          toast.show({
            variant: 'error',
            title: 'Could not delete this loan',
            message: err instanceof ApiError ? err.message : 'Try again.',
          });
          setBusy(null);
        }
      },
    });
  }

  if (loan === null && error === null) {
    return (
      <Screen nav={nav}>
        <LoadingView message="Loading loan…" />
      </Screen>
    );
  }

  if (loan === null) {
    return (
      <Screen nav={nav}>
        <ErrorBanner message={error ?? 'Loan not found.'} onRetry={load} />
      </Screen>
    );
  }

  const statusText = loan.repaid ? 'Repaid' : loan.isOverdue ? 'Overdue' : 'Active';
  const statusColor = loan.repaid
    ? colors.systemGreen
    : loan.isOverdue
      ? colors.systemRed
      : colors.tint;

  return (
    <Screen maxWidth={isWide ? 1080 : 680} nav={nav}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.panes, isWide && styles.panesWide]}>
          <View
            style={[
              styles.hero,
              isWide && styles.heroCard,
              isWide && {
                backgroundColor: colors.secondarySystemGroupedBackground,
                borderColor: colors.separator,
              },
            ]}
          >
            <Avatar name={loan.friendName} size={72} />
            <Text style={[typography.largeTitle2, styles.heroName, { color: colors.label }]}>
              {loan.friendName}
            </Text>
            <Text style={[typography.display, { color: statusColor }]}>
              {formatINR(loan.amount)}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}26` }]}>
              <Text style={[typography.caption, styles.statusPillText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>

          <View style={[styles.mainPane, isWide && styles.mainPaneWide]}>
            <GroupedSection header="Details">
              <DetailRow label="Friend" value={loan.friendName} isFirst />
              {loan.friendPhone ? (
                <DetailRow label="Phone" value={loan.friendPhone} />
              ) : null}
              <DetailRow label="Amount" value={formatINR(loan.amount)} />
              <DetailRow
                label="Due date"
                value={formatDate(loan.dueDate)}
                valueColor={!loan.repaid && loan.isOverdue ? colors.systemRed : undefined}
              />
              {loan.note ? <DetailRow label="Note" value={loan.note} /> : null}
              <DetailRow label="Lent on" value={formatDateTime(loan.createdAt)} />
              {loan.repaidAt ? (
                <DetailRow label="Repaid on" value={formatDateTime(loan.repaidAt)} />
              ) : null}
            </GroupedSection>

            {loan.receiptUrl ? (
              <GroupedSection header="Receipt">
                <Image
                  source={{ uri: resolveAssetUrl(loan.receiptUrl) }}
                  style={styles.receiptImage}
                  resizeMode="cover"
                  accessibilityLabel="Receipt photo for this loan"
                />
              </GroupedSection>
            ) : null}

            <View style={styles.actions}>
              {!loan.repaid ? (
                <PrimaryButton
                  title="Mark repaid"
                  onPress={handleRepay}
                  loading={busy === 'repay'}
                  disabled={busy === 'delete'}
                  accessibilityLabel={`Mark the loan to ${loan.friendName} as repaid`}
                />
              ) : null}
              {!loan.repaid && loan.friendPhone ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remind ${loan.friendName} on WhatsApp`}
                  onPress={handleRemind}
                  onFocus={() => setActionFocused('whatsapp')}
                  onBlur={() => setActionFocused(null)}
                  style={({ pressed }) => [
                    styles.remindButton,
                    pressed && styles.pressed,
                    actionFocused === 'whatsapp' && {
                      outlineStyle: 'solid',
                      outlineWidth: 2,
                      outlineColor: colors.tintText,
                      outlineOffset: 2,
                    },
                  ]}
                >
                  {/* WhatsApp green #128C7E is 4.14:1 on white (fails AA);
                      tintText (6.22:1) keeps the green family readable. */}
                  <AppIcon symbol="message.fill" ionicon="logo-whatsapp" size={19} color={colors.tintText} />
                  <Text style={[typography.headline, { color: colors.tintText }]}>
                    Remind on WhatsApp
                  </Text>
                </Pressable>
              ) : null}
              {!loan.repaid && !loan.friendPhone ? (
                editingPhone ? (
                  <View
                    style={[
                      styles.phoneEditor,
                      {
                        backgroundColor: colors.secondarySystemGroupedBackground,
                        borderColor: colors.separator,
                      },
                    ]}
                  >
                    <TextInput
                      value={phoneDraft}
                      onChangeText={setPhoneDraft}
                      placeholder="Friend's phone — 98100 12345"
                      placeholderTextColor={colors.secondaryLabel}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel="Friend's phone number"
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      style={[
                        typography.body,
                        styles.phoneInput,
                        {
                          backgroundColor: colors.secondarySystemBackground,
                          // Emerald focus border, same as TextField — the
                          // old style had outlineWidth 0 and no focus
                          // change at all, so the field looked unfocused.
                          borderColor: phoneFocused ? colors.tint : colors.separator,
                          color: colors.label,
                        },
                      ]}
                    />
                    <View style={styles.phoneEditorActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Cancel adding phone"
                        hitSlop={8}
                        onPress={() => {
                          setEditingPhone(false);
                          setPhoneDraft('');
                        }}
                        onFocus={() => setActionFocused('cancel')}
                        onBlur={() => setActionFocused(null)}
                        style={[
                          styles.phoneAction,
                          actionFocused === 'cancel' && {
                            outlineStyle: 'solid',
                            outlineWidth: 2,
                            outlineColor: colors.tintText,
                            outlineOffset: 2,
                          },
                        ]}
                      >
                        <Text style={[typography.subhead, { color: colors.secondaryLabel }]}>
                          Cancel
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Save phone number"
                        hitSlop={8}
                        disabled={savingPhone}
                        onPress={handleSavePhone}
                        onFocus={() => setActionFocused('save')}
                        onBlur={() => setActionFocused(null)}
                        style={[
                          styles.phoneAction,
                          actionFocused === 'save' && {
                            outlineStyle: 'solid',
                            outlineWidth: 2,
                            outlineColor: colors.tintText,
                            outlineOffset: 2,
                          },
                        ]}
                      >
                        {savingPhone ? (
                          <ActivityIndicator color={colors.tint} />
                        ) : (
                          <Text style={[typography.subhead, styles.savePhoneText, { color: colors.tintText }]}>
                            Save phone
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add a phone number for reminders"
                    onPress={() => setEditingPhone(true)}
                    hitSlop={8}
                    onFocus={() => setActionFocused('addphone')}
                    onBlur={() => setActionFocused(null)}
                    style={[
                      styles.deleteLink,
                      actionFocused === 'addphone' && {
                        outlineStyle: 'solid',
                        outlineWidth: 2,
                        outlineColor: colors.tintText,
                        outlineOffset: 2,
                      },
                    ]}
                  >
                    <Text style={[typography.subhead, { color: colors.tintText }]}>
                      Add a phone number for reminders
                    </Text>
                  </Pressable>
                )
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete this loan"
                onPress={handleDelete}
                disabled={busy !== null}
                hitSlop={8}
                onFocus={() => setActionFocused('delete')}
                onBlur={() => setActionFocused(null)}
                style={[
                  styles.deleteLink,
                  actionFocused === 'delete' && {
                    outlineStyle: 'solid',
                    outlineWidth: 2,
                    outlineColor: colors.tintText,
                    outlineOffset: 2,
                  },
                ]}
              >
                {busy === 'delete' ? (
                  <ActivityIndicator color={colors.systemRed} />
                ) : (
                  <Text style={[typography.subhead, { color: colors.systemRed }]}>Delete loan</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  panes: {},
  panesWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  mainPane: {},
  mainPaneWide: {
    flex: 1,
    // The first section carries its own top margin; cancel it so the two
    // panes start level on wide screens.
    marginTop: -spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: sectionInset,
    gap: spacing.sm,
  },
  heroCard: {
    width: 340,
    marginTop: 0,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: spacing.xxl,
  },
  heroName: {
    marginTop: spacing.xs,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusPillText: {
    fontFamily: font.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingHorizontal: sectionInset,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  detailValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  receiptImage: {
    width: '100%',
    height: 220,
  },
  actions: {
    marginHorizontal: sectionInset,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  deleteLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  remindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.45)',
    backgroundColor: 'rgba(37, 211, 102, 0.13)',
  },
  pressed: {
    opacity: 0.7,
  },
  phoneEditor: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  phoneEditorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  phoneAction: {
    minHeight: 44,
    justifyContent: 'center',
  },
  savePhoneText: {
    fontFamily: 'Inter_600SemiBold',
  },
});
