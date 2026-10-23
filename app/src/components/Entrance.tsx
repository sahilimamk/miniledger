import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EntranceProps {
  children: ReactNode;
  /** Stagger delay in ms — pass index * 120 for a cascade. */
  delay?: number;
  style?: ViewStyle;
}

/**
 * One-shot entrance on Reanimated (60fps, UI thread): children fade in while
 * rising, spring-settled. Mount-only — it never replays on re-render.
 */
export function Entrance({ children, delay = 0, style }: EntranceProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(19)} style={style}>
      {children}
    </Animated.View>
  );
}
