import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { requestOtp } from '../api/auth';
import { ApiError } from '../api/client';
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
import { normalizePhone, validatePhone } from '../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const isWide = useIsWide();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSendCode() {
    const error = validatePhone(phone);
    setPhoneError(error);
    if (error) return;

    setSending(true);
    try {
      const normalized = normalizePhone(phone);
      await requestOtp(normalized);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      navigation.navigate('Otp', { phone: normalized });
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

          <Entrance delay={120}>
            <Text style={[typography.largeTitle2, styles.appName, { color: colors.label }]}>
              MiniLedger
            </Text>
            <Text style={[typography.subhead, styles.tagline, { color: colors.secondaryLabel }]}>
              Track what you're owed
            </Text>
          </Entrance>


          <Entrance delay={240}>
            <GlassFieldCard>
              <View style={styles.fieldRow}>
                <AppIcon symbol="phone.fill" ionicon="call" size={20} color={colors.tint} />
                <TextInput
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (phoneError) setPhoneError(null);
                  }}
                  accessibilityLabel="Phone"
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.tertiaryLabel}
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
            </GlassFieldCard>
            <Text style={[typography.footnote, styles.note, { color: colors.secondaryLabel }]}>
              We'll send a 6-digit sign-in code to this number.
            </Text>
          </Entrance>

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
  heroRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  appName: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  tagline: {
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
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
    marginTop: spacing.xl,
  },
});
