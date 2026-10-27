import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { requestOtp } from '../api/auth';
import { ApiError } from '../api/client';
import { AppIcon } from '../components/AppIcon';
import { AuthLayout, AuthPanelBullet, AuthPanelTitle } from '../components/AuthLayout';
import { CountryCodePicker } from '../components/CountryCodePicker';
import { Entrance } from '../components/Entrance';
import { AuthFieldCard } from '../components/AuthFieldCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useToast } from '../components/Toast';
import type { AuthStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { buildFullPhone, validatePhone } from '../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const [countryCode, setCountryCode] = useState('+91');
  const [national, setNational] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSendCode() {
    const full = buildFullPhone(countryCode, national);
    const error = validatePhone(full);
    setPhoneError(error);
    if (error) return;

    setSending(true);
    try {
      const res = await requestOtp(full);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      navigation.navigate('Otp', { phone: full, code: res.code, demo: res.demo });
    } catch (err) {
      toast.show({
        variant: 'error',
        title: 'Could not send code',
        message: err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
      });
    } finally {
      setSending(false);
    }
  }

  const panel = (
    <>
      <AuthPanelTitle>Why MiniLedger?</AuthPanelTitle>
      <AuthPanelBullet>Record what you lend in seconds.</AuthPanelBullet>
      <AuthPanelBullet>See what&apos;s overdue at a glance.</AuthPanelBullet>
      <AuthPanelBullet>Mark loans repaid when money comes back.</AuthPanelBullet>
      <View style={[styles.panelDivider, { backgroundColor: colors.separator }]} />
      <Text style={[typography.body, styles.panelNote, { color: colors.secondaryLabel }]}>
        How sign-in works: enter your number, then the 6-digit code on the next screen. Codes
        expire after 5 minutes, and you can request a new one any time.
      </Text>
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
              <View style={[styles.heroRing, { borderColor: colors.tint }]}>
                <View
                  style={[
                    styles.heroIcon,
                    { backgroundColor: colors.tint, shadowColor: colors.tint },
                  ]}
                >
                  <AppIcon symbol="banknote.fill" ionicon="wallet" size={38} color={colors.onTint} />
                </View>
              </View>
            </View>
          </Entrance>

          {/* Title */}
          <Entrance delay={120}>
            <Text
              accessibilityRole="header"
              style={[typography.largeTitle2, styles.appName, { color: colors.label }]}
            >
              MiniLedger
            </Text>
            <Text style={[typography.body, styles.tagline, { color: colors.secondaryLabel }]}>
              Track what you&apos;ve lent — see who owes you and what&apos;s overdue.
            </Text>
          </Entrance>

          {/* Phone field: visible label (not placeholder-only) + explicit
              country-code selector + national number. The card border turns
              emerald while the input is focused — that is the focus ring. */}
          <Entrance delay={240}>
            <Text style={[typography.subhead, styles.fieldLabel, { color: colors.secondaryLabel }]}>
              Phone number
            </Text>
            <AuthFieldCard focused={phoneFocused}>
              <View style={styles.fieldRow}>
                <CountryCodePicker code={countryCode} onChange={setCountryCode} />
                <TextInput
                  value={national}
                  onChangeText={(text) => {
                    setNational(text);
                    if (phoneError) setPhoneError(null);
                  }}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  accessibilityLabel="Phone number without country code"
                  placeholder="98765 43210"
                  placeholderTextColor={colors.secondaryLabel}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={handleSendCode}
                  style={[typography.body, styles.input, { color: colors.label }]}
                />
              </View>
              {phoneError ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[typography.footnote, styles.fieldError, { color: colors.systemRed }]}
                >
                  {phoneError}
                </Text>
              ) : null}
            </AuthFieldCard>
            <Text style={[typography.footnote, styles.note, { color: colors.secondaryLabel }]}>
              You&apos;ll enter a 6-digit code on the next screen.
            </Text>
          </Entrance>

          {/* Button */}
          <Entrance delay={360}>
            <View style={styles.buttonWrap}>
              <PrimaryButton
                title="Send code"
                onPress={handleSendCode}
                loading={sending}
                accessibilityLabel="Send sign-in code"
              />
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
    marginBottom: spacing.lg,
  },
  heroRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  appName: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tagline: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  fieldLabel: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  fieldError: {
    paddingBottom: spacing.xs,
  },
  note: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  buttonWrap: {
    marginTop: spacing.lg,
  },
  panelDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  panelNote: {
    lineHeight: 21,
  },
});
