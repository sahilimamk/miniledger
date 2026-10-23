import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform } from 'react-native';

interface AppIconProps {
  /** SF Symbol name used on iOS. */
  symbol: SFSymbol;
  /** Ionicons glyph used everywhere else (and as the iOS fallback). */
  ionicon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}

/**
 * Renders an SF Symbol on iOS via expo-symbols, with an Ionicons equivalent
 * on Android and web, so iconography stays native-feeling per platform.
 */
export function AppIcon({ symbol, ionicon, size = 22, color }: AppIconProps) {
  const fallback = <Ionicons name={ionicon} size={size} color={color} />;

  if (Platform.OS !== 'ios') {
    return fallback;
  }

  return (
    <SymbolView
      name={symbol}
      size={size}
      tintColor={color}
      fallback={fallback}
      style={{ width: size, height: size }}
    />
  );
}
