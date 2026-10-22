import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthContext';
import { ToastProvider } from './src/components/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { darkPalette } from './src/theme/colors';
import { injectScrollbarStyles } from './src/theme/scrollbar';

enableScreens();
injectScrollbarStyles();

/** App root: fonts first, then session provider + toast host + navigation. */
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    // One frame of the app background instead of a flash of unstyled text.
    return <View style={{ flex: 1, backgroundColor: darkPalette.systemBackground }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
