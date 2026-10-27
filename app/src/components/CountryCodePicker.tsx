import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

export interface CountryCode {
  code: string;
  name: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'United States / Canada' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+61', name: 'Australia' },
  { code: '+49', name: 'Germany' },
  { code: '+33', name: 'France' },
  { code: '+31', name: 'Netherlands' },
  { code: '+27', name: 'South Africa' },
  { code: '+971', name: 'UAE' },
  { code: '+65', name: 'Singapore' },
  { code: '+880', name: 'Bangladesh' },
  { code: '+92', name: 'Pakistan' },
  { code: '+234', name: 'Nigeria' },
  { code: '+55', name: 'Brazil' },
];

interface CountryCodePickerProps {
  code: string;
  onChange: (code: string) => void;
}

/**
 * Explicit country-code selector for the phone field (no new dependency —
 * RN's built-in Modal). Defaults to +91; the national number is typed
 * separately, so the code is never ambiguous. Typing a full "+…" number
 * still works: the submit path lets a leading "+" win outright.
 */
export function CountryCodePicker({ code, onChange }: CountryCodePickerProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [triggerFocused, setTriggerFocused] = useState(false);
  const [rowFocused, setRowFocused] = useState<string | null>(null);
  const [cancelFocused, setCancelFocused] = useState(false);
  const selected = COUNTRY_CODES.find((c) => c.code === code);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Country code, currently ${code}${selected ? ` ${selected.name}` : ''}. Tap to change.`}
        onPress={() => setOpen(true)}
        onFocus={() => setTriggerFocused(true)}
        onBlur={() => setTriggerFocused(false)}
        style={({ pressed }) => [
          styles.trigger,
          { borderColor: colors.separator, opacity: pressed ? 0.7 : 1 },
          // Web keyboard focus ring (same pattern as PrimaryButton).
          triggerFocused && {
            outlineStyle: 'solid',
            outlineWidth: 2,
            outlineColor: colors.tintText,
            outlineOffset: 2,
          },
        ]}
      >
        <Text style={[typography.body, { color: colors.label }]}>{code}</Text>
        <AppIcon symbol="chevron.down" ionicon="chevron-down" size={14} color={colors.secondaryLabel} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          {/* Dismiss layer sits BEHIND the sheet (sibling, not parent), so
              taps inside the sheet never bubble into a close. It is not
              focusable: keyboard users tab straight to the list and
              Cancel instead of landing on an invisible full-screen
              control first. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close country code list"
            focusable={false}
            tabIndex={-1}
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityLabel="Country code list"
            style={[styles.sheet, { backgroundColor: colors.secondarySystemGroupedBackground }]}
          >
            <Text style={[typography.title, styles.sheetTitle, { color: colors.label }]}>
              Country code
            </Text>
            <ScrollView style={styles.list}>
              {COUNTRY_CODES.map((c) => {
                const active = c.code === code;
                return (
                  <Pressable
                    key={c.code}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.name}, ${c.code}`}
                    onPress={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    onFocus={() => setRowFocused(c.code)}
                    onBlur={() => setRowFocused(null)}
                    style={[
                      styles.row,
                      { backgroundColor: active ? `${colors.tint}14` : 'transparent' },
                      rowFocused === c.code && {
                        outlineStyle: 'solid',
                        outlineWidth: 2,
                        outlineColor: colors.tintText,
                        outlineOffset: 2,
                      },
                    ]}
                  >
                    <Text style={[typography.body, { color: colors.label }]}>{c.name}</Text>
                    <Text
                      style={[
                        typography.body,
                        { color: active ? colors.tintText : colors.secondaryLabel },
                      ]}
                    >
                      {c.code}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close country code list"
              onPress={() => setOpen(false)}
              onFocus={() => setCancelFocused(true)}
              onBlur={() => setCancelFocused(false)}
              style={[
                styles.cancel,
                { borderColor: colors.separator },
                cancelFocused && {
                  outlineStyle: 'solid',
                  outlineWidth: 2,
                  outlineColor: colors.tintText,
                  outlineOffset: 2,
                },
              ]}
            >
              <Text style={[typography.headline, { color: colors.tintText }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    padding: spacing.lg,
  },
  sheetTitle: {
    marginBottom: spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: 12,
  },
});
