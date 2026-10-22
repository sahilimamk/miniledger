import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './colors';

export interface Theme {
  colors: Palette;
  isDark: boolean;
}

/** Returns the active palette based on the system appearance setting. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkPalette : lightPalette, isDark };
}
