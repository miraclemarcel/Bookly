import '@/global.css';
import '@/lib/interop';

import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SplashOverlay } from '@/components/splash-overlay';
import { navTheme, palette } from '@/lib/theme';
import { useStoreHydrated } from '@/store/booking-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useStoreHydrated();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.canvas }}>
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
        <SplashOverlay ready={hydrated} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
