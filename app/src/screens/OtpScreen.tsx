import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { requestOtp, verifyOtp } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppIcon } from '../components/AppIcon';
import { AuthLayout, AuthPanelBullet, AuthPanelTitle } from '../components/AuthLayout';
import { Entrance } from '../components/Entrance';
import { GlassFieldCard } from '../components/GlassFieldCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useToast } from '../components/Toast';
import type { AuthStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { maskPhone, validateOtpCode } from '../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

const RESEND_SECONDS = 60;

export function OtpScreen({ route, navigation }: Props) {
  const { phone, code: initialCode } = route.params;
  const { colors } = useTheme();
  const { login } = useAuth();
  const toast = useToast();
  const inputRef = useRef<TextInput>(null);
  const verifyingRef = useRef(false);

  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | undefined>(initialCode);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [boxesFocused, setBoxesFocused] = useState(false);
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
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      // Field-specific failures get an inline message (and the boxes stay
      // editable); anything else is a toast, as before.
      if (err instanceof ApiError && err.message === 'code expired') {
        setCodeError('This code has expired. Request a new one below.');
        // The resend countdown runs from screen mount, not from code issue —
        // an expired code must unlock resend immediately, not after the wait.
        setSecondsLeft(0);
      } else if (err instanceof ApiError && err.message === 'invalid code') {
        setCodeError('That code doesn’t match. Check the digits and try again.');
      } else {
        toast.show({
          variant: 'error',
          title: 'Sign-in failed',
          message: err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
        });
      }
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }

  // Auto-submit on sixth digit
  useEffect(() => {
    if (code.length === 6) {
      void handleVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleResend() {
    if (resending) return;
    setResending(true);
    try {
      const res = await requestOtp(phone);
      setCode('');
      setDemoCode(res.code);
      setCodeError(null);
      setSecondsLeft(RESEND_SECONDS);
      inputRef.current?.focus();
      // A code in the response IS the demo signal: old servers return
      // { code } with no demo flag, new demo servers return { code, demo:
      // true }, and new non-demo servers return no code at all.
      toast.show(
        res.code
          ? { title: 'New code sent', message: 'Your demo code has been updated below.' }
          : { title: 'New code requested', message: 'Enter the new code when it arrives.' },
      );
    } catch (err) {
      toast.show({
        variant: 'error',
        title: 'Could not resend',
        message: err instanceof ApiError ? err.message : 'Try again in a moment.',
      });
    } finally {
      setResending(false);
    }
  }

  function handleUseCode() {
    if (!demoCode) return;
    setCode(demoCode);
    setCodeError(null);
  }

  const activeIndex = Math.min(code.length, 5);

  const panel = (
    <>
      <AuthPanelTitle>About this code</AuthPanelTitle>
      <AuthPanelBullet>6 digits, expires after 5 minutes.</AuthPanelBullet>
      <AuthPanelBullet>Wrong code? Check the digits and try again.</AuthPanelBullet>
      <AuthPanelBullet>Need a new one? Tap Resend below.</AuthPanelBullet>
      {demoCode ? (
        <Text style={[typography.body, styles.panelDemoNote, { color: colors.tintText }]}>
          Demo mode: your code is shown on this screen for testing only.
        </Text>
      ) : null}
    </>
  );

  return (
    <AuthLayout
      panel={panel}
      form={
        <>
          {/* Hero */}
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
            <Text
              accessibilityRole="header"
              style={[typography.title, styles.title, { color: colors.label }]}
            >
              Enter the code
            </Text>
            <Text style={[typography.subhead, styles.subtitle, { color: colors.secondaryLabel }]}>
              Code for {maskPhone(phone)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use a different phone number"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={styles.editNumberWrap}
            >
              <Text style={[typography.subhead, styles.editNumberText, { color: colors.tintText }]}>
                Use a different number
              </Text>
            </Pressable>
          </Entrance>

          {/* Demo code banner — shown whenever the server actually sent a
              code. Old servers return { code } with no demo flag; new demo
              servers return { code, demo: true }; new non-demo servers
              return no code, so this block renders nothing there. The code
              is therefore never shown unless the server sent it, which
              only ever happens in demo mode. */}
          {demoCode ? (
            <Entrance delay={100}>
              <Pressable
                onPress={handleUseCode}
                accessibilityRole="button"
                accessibilityLabel={`Your demo code is ${demoCode.split('').join(' ')}. Tap to fill it in.`}
                style={[
                  styles.demoBanner,
                  { backgroundColor: `${colors.tint}18`, borderColor: `${colors.tint}55` },
                ]}
              >
                <View style={styles.demoBannerTop}>
                  <AppIcon symbol="key.fill" ionicon="key" size={15} color={colors.tint} />
                  <Text style={[typography.footnote, styles.demoLabel, { color: colors.tintText }]}>
                    Demo sign-in code
                  </Text>
                </View>
                <Text style={[styles.demoCodeText, { color: colors.label }]}>
                  {demoCode.slice(0, 3)} {demoCode.slice(3)}
                </Text>
                <Text style={[typography.footnote, styles.demoHint, { color: colors.secondaryLabel }]}>
                  Demo mode — shown for testing only. Tap to fill automatically.
                </Text>
              </Pressable>
            </Entrance>
          ) : null}

          {/* Code boxes */}
          <Entrance delay={200}>
            <GlassFieldCard>
              <Pressable
                accessibilityLabel="Code entry"
                onPress={() => inputRef.current?.focus()}
                style={[
                  styles.boxesRow,
                  // Web keyboard focus ring on the boxes row (the hidden
                  // input itself is invisible, so it cannot show focus).
                  boxesFocused && {
                    outlineStyle: 'solid',
                    outlineWidth: 2,
                    outlineColor: colors.tintText,
                    outlineOffset: 2,
                  },
                ]}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const filled = i < code.length;
                  const active = i === activeIndex && code.length < 6;
                  return (
                    <View
                      key={i}
                      accessibilityLabel={`Digit ${i + 1}${filled ? `, ${code[i]}` : ', empty'}`}
                      style={[
                        styles.box,
                        {
                          backgroundColor: active
                            ? `${colors.tint}1A`
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
                  onFocus={() => setBoxesFocused(true)}
                  onBlur={() => setBoxesFocused(false)}
                  accessibilityLabel="Code"
                  keyboardType="number-pad"
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
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
          </Entrance>

          {/* Verify button */}
          <Entrance delay={300}>
            <View style={styles.buttonWrap}>
              <PrimaryButton
                title="Verify and sign in"
                onPress={() => handleVerify(code)}
                loading={verifying}
                accessibilityLabel="Verify code and sign in"
              />
            </View>
            {verifying ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[typography.subhead, styles.statusText, { color: colors.secondaryLabel }]}
              >
                Verifying code…
              </Text>
            ) : null}
            <View style={styles.resendWrap}>
              {resending ? (
                <Text style={[typography.subhead, { color: colors.secondaryLabel }]}>
                  Sending…
                </Text>
              ) : secondsLeft > 0 ? (
                <Text style={[typography.subhead, { color: colors.secondaryLabel }]}>
                  Resend in {secondsLeft}s
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Resend code"
                  hitSlop={8}
                  onPress={handleResend}
                  style={styles.resendPressable}
                >
                  <Text style={[typography.subhead, styles.resendText, { color: colors.tintText }]}>
                    Resend code
                  </Text>
                </Pressable>
              )}
            </View>
          </Entrance>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  heroIconWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  editNumberWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  editNumberText: {
    fontWeight: '600',
  },
  // Demo code banner
  demoBanner: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  demoBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  demoCodeText: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
    lineHeight: 48,
  },
  demoHint: {
    marginTop: 2,
  },
  // Code boxes
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
  buttonWrap: {
    marginTop: spacing.lg,
  },
  statusText: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  resendWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 44,
  },
  resendPressable: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  resendText: {
    fontWeight: '600',
  },
  panelDemoNote: {
    lineHeight: 21,
    marginTop: spacing.xs,
  },
});
