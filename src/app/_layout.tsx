import '@/global.css';
import '@/lib/interop';

import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SplashOverlay } from '@/components/splash-overlay';
import { navTheme, palette } from '@/lib/theme';
import { useStoreHydrated } from '@/store/booking-store';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(palette.canvas);

export default function RootLayout() {
  const hydrated = useStoreHydrated();
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.canvas }}>
      <ThemeProvider value={navTheme}>
        {/* Dark icons on white. backgroundColor covers devices that aren't edge-to-edge. */}
        <StatusBar barStyle="dark-content" backgroundColor={palette.canvas} />
        {/*
          On edge-to-edge Android the status bar is transparent, so keep every screen below it.
          The strip it leaves is this white root view, so the bar always reads as white.
        */}
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: palette.canvas }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.canvas },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="booking/new"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="booking/[id]"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="client/[id]"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>
        </View>
        <SplashOverlay ready={hydrated} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
