import '@/global.css';
import '@/lib/interop';

import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SplashOverlay } from '@/components/splash-overlay';
import { navTheme, palette } from '@/lib/theme';
import { useStoreHydrated } from '@/store/booking-store';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(palette.canvas);

/** The status bar is transparent (edge-to-edge), so paint a solid white strip behind it */
function StatusBarBackdrop() {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: palette.canvas }}
    />
  );
}

export default function RootLayout() {
  const hydrated = useStoreHydrated();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.canvas }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.canvas },
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="booking/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="booking/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="client/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
          <StatusBarBackdrop />
          <SplashOverlay ready={hydrated} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
