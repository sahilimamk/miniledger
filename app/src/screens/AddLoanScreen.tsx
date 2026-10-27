import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLayoutEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '../api/client';
import { createLoan, uploadReceipt } from '../api/loans';
import { AppIcon } from '../components/AppIcon';
import { DateField } from '../components/DateField';
import { GroupedSection } from '../components/GroupedSection';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { mainNav } from '../hooks/useMainNav';
import { useRailLayout } from '../hooks/useRailLayout';
import { TextField } from '../components/TextField';
import { useToast } from '../components/Toast';
import type { MainStackParamList } from '../navigation/types';
import { sectionInset, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import {
  normalizePhone,
  parseAmount,
  validateAmount,
  validateDueDate,
  validateFriendName,
  validatePhone,
} from '../utils/validation';
import { formatINR } from '../utils/format';

type Props = NativeStackScreenProps<MainStackParamList, 'AddLoan'>;

interface FieldErrors {
  friendName?: string | null;
  amount?: string | null;
  dueDate?: string | null;
  friendPhone?: string | null;
}

export function AddLoanScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const railMode = useRailLayout();
  const nav = mainNav(navigation, 'add');
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !railMode });
  }, [navigation, railMode]);

  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [dropFocused, setDropFocused] = useState(false);
  const [removeFocused, setRemoveFocused] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      // Toast, not Alert: Alert.alert is unimplemented on web and silently
      // does nothing there, which used to leave the user with no feedback.
      toast.show({
        variant: 'error',
        title: 'Photo access needed',
        message: 'Allow photo library access to attach a receipt, or skip the receipt.',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    const fieldErrors: FieldErrors = {
      friendName: validateFriendName(friendName),
      amount: validateAmount(amount),
      dueDate: validateDueDate(dueDate),
      friendPhone: friendPhone.trim() ? validatePhone(friendPhone) : null,
    };
    setErrors(fieldErrors);
    if (
      fieldErrors.friendName ||
      fieldErrors.amount ||
      fieldErrors.dueDate ||
      fieldErrors.friendPhone
    ) {
      return;
    }

    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) {
      setErrors({ amount: 'Enter a valid amount.' });
      return;
    }

    setSaving(true);
    try {
      const loan = await createLoan({
        friendName: friendName.trim(),
        amount: parsedAmount,
        dueDate: dueDate.trim(),
        note: note.trim() ? note.trim() : undefined,
        friendPhone: friendPhone.trim() ? normalizePhone(friendPhone) : undefined,
      });

      let receiptFailed = false;
      if (photoUri) {
        try {
          await uploadReceipt(loan.id, photoUri);
        } catch {
          receiptFailed = true;
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (receiptFailed) {
        // Toast + unconditional navigation: the old Alert.alert path only
        // navigated back from the alert's OK button, and Alert is a no-op
        // on web — so a saved loan stranded the user on this screen with
        // no feedback and an inviting duplicate Save. The toast host sits
        // above the navigator, so it survives the goBack.
        toast.show({
          title: 'Loan saved',
          message: 'The loan was saved, but the receipt photo could not be uploaded.',
        });
        navigation.goBack();
      } else {
        toast.show({
          title: 'Loan saved',
          message: `${loan.friendName} · ${formatINR(loan.amount)}`,
        });
        navigation.goBack();
      }
    } catch (err) {
      toast.show({
        variant: 'error',
        title: 'Could not save the loan',
        message: err instanceof ApiError ? err.message : 'Try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen nav={nav}>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scrollFlex} contentContainerStyle={styles.scroll}>
        <GroupedSection header="Loan details">
          <TextField
            label="Friend"
            icon={{ symbol: 'person', ionicon: 'person-outline' }}
            value={friendName}
            onChangeText={setFriendName}
            error={errors.friendName}
            placeholder="Aman's name"
            autoCapitalize="words"
            autoFocus
          />
          <TextField
            label="Friend's phone"
            icon={{ symbol: 'phone', ionicon: 'call-outline' }}
            value={friendPhone}
            onChangeText={setFriendPhone}
            error={errors.friendPhone}
            placeholder="98100 12345 — optional"
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Amount ₹"
            icon={{ symbol: 'indianrupeesign', ionicon: 'cash-outline' }}
            value={amount}
            onChangeText={setAmount}
            error={errors.amount}
            placeholder="250.00"
            keyboardType="decimal-pad"
          />
          <DateField
            label="Due date"
            value={dueDate}
            onChange={setDueDate}
            error={errors.dueDate}
          />
          <TextField
            label="Note"
            icon={{ symbol: 'note.text', ionicon: 'document-text-outline' }}
            value={note}
            onChangeText={setNote}
            placeholder="Optional — e.g. for books"
            autoCapitalize="sentences"
          />
        </GroupedSection>

        <GroupedSection header="Receipt" footer="Optional. A photo of the bill or payment, up to 5 MB.">
          {photoUri ? (
            <View style={styles.photoRow}>
              <Image source={{ uri: photoUri }} style={styles.thumbnail} accessibilityLabel="Selected receipt photo" />
              <Text style={[typography.body, styles.photoLabel, { color: colors.label }]}>
                Receipt attached
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove receipt photo"
                hitSlop={8}
                onPress={() => setPhotoUri(null)}
                onFocus={() => setRemoveFocused(true)}
                onBlur={() => setRemoveFocused(false)}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.pressed,
                  removeFocused && {
                    outlineStyle: 'solid',
                    outlineWidth: 2,
                    outlineColor: colors.tintText,
                    outlineOffset: 2,
                  },
                ]}
              >
                <Text style={[typography.body, { color: colors.systemRed }]}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add receipt photo"
              onPress={pickPhoto}
              onFocus={() => setDropFocused(true)}
              onBlur={() => setDropFocused(false)}
              style={({ pressed }) => [
                styles.dropzone,
                { borderColor: `${colors.tint}66` },
                pressed && styles.pressed,
                dropFocused && {
                  outlineStyle: 'solid',
                  outlineWidth: 2,
                  outlineColor: colors.tintText,
                  outlineOffset: 2,
                },
              ]}
            >
              <AppIcon symbol="photo.on.rectangle.angled" ionicon="image-outline" size={20} color={colors.tint} />
              <Text style={[typography.body, styles.dropzoneLabel, { color: colors.tintText }]}>Attach receipt</Text>
              <Text style={[typography.footnote, { color: colors.secondaryLabel }]}>Photo · up to 5 MB</Text>
            </Pressable>
          )}
        </GroupedSection>

      </ScrollView>
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.separator, backgroundColor: colors.systemGroupedBackground },
        ]}
      >
        <PrimaryButton
          title="Save loan"
          onPress={handleSave}
          loading={saving}
          accessibilityLabel="Save loan"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: sectionInset,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  /** Slim dashed affordance for the receipt picker — a row, not a block:
   *  the receipt is a bonus and shouldn't outweigh the loan fields. */
  dropzone: {
    minHeight: 54,
    margin: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dropzoneLabel: {
    flex: 1,
  },
  photoLabel: {
    flex: 1,
  },
  removeButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  pressed: {
    opacity: 0.6,
  },
  scrollFlex: {
    flex: 1,
  },
  /** Sticky Save bar: always visible, no scrolling to reach the action. */
  footer: {
    paddingHorizontal: sectionInset,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
