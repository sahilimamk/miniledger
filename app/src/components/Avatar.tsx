import { StyleSheet, Text, View } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
}

/**
 * Circular initials badge (v13: flat tints — gradients are gone app-wide).
 * A light navy/emerald wash with deep-ink initials; the wash is hashed
 * from the first letter, so the same person always gets the same tint —
 * Splitwise/Contacts style.
 */
const TINTS: { bg: string; fg: string }[] = [
  { bg: '#E6F4EF', fg: '#0B7A5F' },
  { bg: '#E8EEF5', fg: '#0A2540' },
  { bg: '#E4EAF1', fg: '#33566E' },
  { bg: '#E0F0EE', fg: '#0B6B5E' },
  { bg: '#E9EDF2', fg: '#5B6B7D' },
  { bg: '#EAF0E9', fg: '#3E6B34' },
];

export function Avatar({ name, size = 40 }: AvatarProps) {
  const trimmed = name.trim();
  const initial = trimmed ? trimmed.charAt(0).toUpperCase() : '?';
  const tint = TINTS[(initial.charCodeAt(0) || 0) % TINTS.length];

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tint.bg,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.42), color: tint.fg }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10, 37, 64, 0.08)',
  },
  initial: {
    fontWeight: '600',
  },
});
