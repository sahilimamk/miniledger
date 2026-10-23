import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/useTheme';

/**
 * The auth screens' ambient background: two large, very faint colour blobs
 * (tint + indigo) that drift slowly on offset Reanimated loops, so the
 * screen feels alive without anything actually moving fast. Blur through
 * the glass field card is what sells it.
 */
export function DriftingBlobs() {
  const { colors } = useTheme();
  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);

  useEffect(() => {
    driftA.value = withRepeat(withTiming(1, { duration: 11000 }), -1, true);
    driftB.value = withRepeat(withTiming(1, { duration: 14000 }), -1, true);
  }, [driftA, driftB]);

  const styleA = useAnimatedStyle(() => ({
    transform: [{ translateX: driftA.value * -26 }, { translateY: driftA.value * 18 }],
  }));
  const styleB = useAnimatedStyle(() => ({
    transform: [{ translateX: driftB.value * 22 }, { translateY: driftB.value * -16 }],
  }));

  return (
    <View pointerEvents="none" style={styles.backdrop}>
      <Animated.View style={[styles.blobBlue, { backgroundColor: colors.tint, opacity: 0.1 }, styleA]} />
      <Animated.View style={[styles.blobIndigo, { backgroundColor: colors.systemIndigo, opacity: 0.08 }, styleB]} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  blobBlue: {
    position: 'absolute',
    top: -210,
    right: -160,
    width: 440,
    height: 440,
    borderRadius: 220,
    opacity: 0.15,
  },
  blobIndigo: {
    position: 'absolute',
    bottom: -200,
    left: -170,
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.11,
  },
});
