import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LaunchSplash } from '@/components/launch-splash';
import { useStoreHydrated } from '@/store/booking-store';
import { useLaunchStore } from '@/store/launch-store';

/** The first screen on launch. Plays the animation, then unlocks the app (see _layout.tsx). */
export default function SplashRoute() {
  const insets = useSafeAreaInsets();
  const hydrated = useStoreHydrated();
  const finishSplash = useLaunchStore((s) => s.finishSplash);
  const [played, setPlayed] = useState(false);

  // This screen is mounted, so the native splash can go; the animation takes over seamlessly
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  // Only move on once the animation has played and saved data has loaded
  useEffect(() => {
    if (played && hydrated) finishSplash();
  }, [played, hydrated, finishSplash]);

  // The root view starts below the status bar; nudge up so the mark sits where the native splash drew it
  return <LaunchSplash offsetY={-insets.top / 2} onFinish={() => setPlayed(true)} />;
}
