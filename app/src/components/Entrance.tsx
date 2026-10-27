import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface EntranceProps {
  children: ReactNode;
  /** Stagger delay in ms — pass index * 120 for a cascade. */
  delay?: number;
  style?: ViewStyle;
}

/**
 * One-shot entrance on Reanimated (60fps, UI thread): children fade in while
 * rising, spring-settled. Mount-only — it never replays on re-render.
 * With reduced motion preferred, children render immediately, no animation.
 */
export function Entrance({ children, delay = 0, style }: EntranceProps) {
  const reducedMotion = usePrefersReducedMotion();
  if (reducedMotion) {
    return <View style={style}>{children}</View>;
  }
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(19)} style={style}>
      {children}
    </Animated.View>
  );
}
