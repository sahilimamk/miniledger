import { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

interface CountUpProps {
  /** Target value; animates from the previous value (0 on first mount). */
  value: number;
  format: (n: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

/**
 * Money figure that counts up with an ease-out cubic (Revolut-style hero
 * numbers). requestAnimationFrame-driven, so it behaves identically on web
 * and native; ~60fps for one number is free.
 */
export function CountUp({ value, format, style, duration = 650 }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = value;
    };
  }, [value, duration]);

  return (
    <Text style={style} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {format(display)}
    </Text>
  );
}
