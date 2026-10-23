import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { requestOtp, verifyOtp } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppIcon } from '../components/AppIcon';
import { DriftingBlobs } from '../components/DriftingBlobs';
import { Entrance } from '../components/Entrance';
import { GlassFieldCard } from '../components/GlassFieldCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import type { AuthStackParamList } from '../navigation/types';
import { useIsWide } from '../hooks/useIsWide';
import { sectionInset, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { validateOtpCode } from '../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

const RESEND_SECONDS = 60;

/**
 * Code entry as six individual digit boxes over one hidden input (the input
 * keeps autofill, paste and the number pad working everywhere). The active
 * box carries the tint border + a soft tint fill; entering the sixth digit
 * auto-submits. Resend is gated by a 60s countdown.
 */
export function OtpScreen({ route }: Props) {
  const { phone } = route.params;
  const { colors } = useTheme();
  const isWide = useIsWide();
  const { login } = useAuth();
  const toast = useToast();
  const inputRef = useRef<TextInput>(null);
  const verifyingRef = useRef(false);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  async function handleVerify(raw: string) {
    const error = validateOtpCode(raw);
    setCodeError(error);
    if (error || verifyingRef.current) return;

    verifyingRef.current = true;
    setVerifying(true);
    try {
      const { token, user } = await verifyOtp(phone, raw.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await login(token, user);
      // RootNavigator swaps to the main stack once the token is set.
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      toast.show({
        variant: 'error',
        title: 'Sign-in failed',
        message: err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
      });
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }

  // Sixth digit entered → submit immediately, no button tap needed.
  useEffect(() => {
    if (code.length === 6) {
      void handleVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleResend() {
    try {
      await requestOtp(phone);
      setCode('');
      setCodeError(null);
      setSecondsLeft(RESEND_SECONDS);
      inputRef.current?.focus();
      toast.show({
        title: 'New code sent',
        message: 'Demo build — the code is printed in the server log.',
      });
    } catch (err) {
      toast.show({
        variant: 'error',
        title: 'Could not resend',
        message: err instanceof ApiError ? err.message : 'Try again in a moment.',
      });
    }
  }

  const activeIndex = Math.min(code.length, 5);

  return (
    <Screen>
      <DriftingBlobs />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
      >
        <View style={isWide ? styles.wideCol : undefined}>
          <Entrance delay={0}>
            <View style={styles.heroIconWrap}>
              <View
                style={[
                  styles.heroIcon,
                  {
                    backgroundColor: colors.secondarySystemGroupedBackground,
                    borderColor: colors.separator,
                  },
                ]}
              >
                <AppIcon symbol="envelope.fill" ionicon="mail" size={28} color={colors.tint} />
              </View>
            </View>
            <Text style={[typography.title, styles.title, { color: colors.label }]}>
              Enter the code
            </Text>
            <Text style={[typography.subhead, styles.subtitle, { color: colors.secondaryLabel }]}>
              We sent a 6-digit code to {phone}.
            </Text>
          </Entrance>

          <Entrance delay={150}>
            <GlassFieldCard>
              <Pressable
                accessibilityLabel="Code entry"
                onPress={() => inputRef.current?.focus()}
                style={styles.boxesRow}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const filled = i < code.length;
                  const active = i === activeIndex && code.length < 6;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.box,
                        {
                          backgroundColor: active
                            ? 'rgba(13, 143, 111, 0.10)'
                            : colors.systemGroupedBackground,
                          borderColor: filled || active ? colors.tint : colors.separator,
                        },
                      ]}
                    >
                      <Text style={[styles.digit, { color: colors.label }]}>{code[i] ?? ''}</Text>
                    </View>
                  );
                })}
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={(text) => {
                    setCode(text.replace(/[^\d]/g, '').slice(0, 6));
                    if (codeError) setCodeError(null);
                  }}
                  accessibilityLabel="Code"
                  keyboardType="number-pad"
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                  autoFocus
                  caretHidden
                  style={styles.hiddenInput}
                />
              </Pressable>
              {codeError ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[typography.footnote, styles.fieldError, { color: colors.systemRed }]}
                >
                  {codeError}
                </Text>
              ) : null}
            </GlassFieldCard>
            <Text style={[typography.footnote, styles.note, { color: colors.secondaryLabel }]}>
              Demo build — no SMS; your code prints in the server log.
            </Text>
          </Entrance>

          <Entrance delay={300}>
            <View style={styles.buttonWrap}>
              <PrimaryButton
                title="Verify and sign in"
                onPress={() => handleVerify(code)}
                loading={verifying}
                accessibilityLabel="Verify code and sign in"
              />
            </View>
            <View style={styles.resendWrap}>
              {secondsLeft > 0 ? (
                <Text style={[typography.subhead, { color: colors.tertiaryLabel }]}>
                  Resend in {secondsLeft}s
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Resend code"
                  hitSlop={8}
                  onPress={handleResend}
                >
                  <Text style={[typography.subhead, styles.resendText, { color: colors.tint }]}>
                    Resend code
                  </Text>
                </Pressable>
              )}
            </View>
          </Entrance>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: sectionInset,
    paddingTop: 56,
    paddingBottom: spacing.xxl,
  },
  scrollWide: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 0,
  },
  wideCol: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  heroIconWrap: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  boxesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  digit: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  fieldError: {
    paddingBottom: spacing.xs,
  },
  note: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  buttonWrap: {
    marginTop: spacing.xl,
  },
  resendWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
    minHeight: 20,
  },
  resendText: {
    fontWeight: '600',
  },
});
