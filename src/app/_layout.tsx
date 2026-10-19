import '@/global.css';
import '@/lib/interop';

import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { IntroOverlay } from '@/components/intro-overlay';
import { navTheme, palette } from '@/lib/theme';
import { useStoreHydrated } from '@/store/booking-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useStoreHydrated();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.ink900 }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.ink900 },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="booking/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="booking/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="client/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <IntroOverlay ready={hydrated} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
