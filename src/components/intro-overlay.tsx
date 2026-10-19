import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { brandGradient, palette } from '@/lib/theme';

const WORD = 'Bookly'.split('');

/** Branded launch animation that plays once the store has hydrated, then dissolves */
export function IntroOverlay({ ready }: { ready: boolean }) {
  const [done, setDone] = useState(false);
  const orb = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();
    orb.set(withSpring(1, { damping: 9, stiffness: 90 }));
    fade.set(
      withDelay(
        1300,
        withTiming(0, { duration: 450, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(setDone, true);
        }),
      ),
    );
  }, [ready, orb, fade]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orb.get() + (1 - fade.get()) * 6 }, { rotate: `${orb.get() * 180}deg` }],
  }));
  const containerStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));

  if (done) return null;

  return (
    <Animated.View
      pointerEvents={ready ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.ink900 }, containerStyle]}
      className="items-center justify-center">
      {ready && (
        <>
          <Animated.View style={orbStyle}>
            <LinearGradient
              colors={brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-20 w-20 items-center justify-center rounded-[28px]">
              <Text className="text-4xl font-black text-white">B</Text>
            </LinearGradient>
          </Animated.View>
          <View className="mt-6 flex-row">
            {WORD.map((ch, i) => (
              <Animated.Text
                key={i}
                entering={FadeInDown.delay(200 + i * 70).springify().damping(10)}
                className="text-4xl font-black tracking-tight text-mist">
                {ch}
              </Animated.Text>
            ))}
          </View>
          <Animated.Text entering={FadeInDown.delay(750)} className="mt-2 text-sm text-mist-muted">
            Your calendar, beautifully kept.
          </Animated.Text>
        </>
      )}
    </Animated.View>
  );
}
