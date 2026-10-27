import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * True when the user prefers reduced motion. Web only: reads
 * `prefers-reduced-motion` via matchMedia and follows changes. Native
 * returns false (no equivalent OS-level query is wired here).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    // Older browsers: Safari < 14 uses addListener.
    query.addListener(onChange);
    return () => query.removeListener(onChange);
  }, []);

  return reduced;
}
