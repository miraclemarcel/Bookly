import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeInDown,
  type SharedValue,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { palette } from '@/lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TILE = 104;
const CHECK_LENGTH = 640; // ≈ length of the check path below, in viewBox units
const WORD = 'Bookly'.split('');
const ORBIT_COLORS = [palette.violet, palette.pink, palette.amber];

/** Timeline, in ms */
const T = {
  pop: 0,
  check: 380,
  rings: 300,
  orbit: 450,
  lift: 900,
  word: 1000,
  tagline: 1500,
  exit: 2500,
};

function Ripple({ delay, start }: { delay: number; start: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!start) return;
    p.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), 2, false),
      ),
    );
  }, [p, delay, start]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.get(), [0, 0.1, 1], [0, 0.45, 0]),
    transform: [{ scale: interpolate(p.get(), [0, 1], [1, 2.8]) }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-[30px] border-2"
      style={[{ width: TILE, height: TILE, borderColor: palette.violet }, style]}
    />
  );
}

function OrbitDot({
  index,
  orbit,
  exit,
}: {
  index: number;
  orbit: SharedValue<number>;
  exit: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const angle = orbit.get() * Math.PI * 2 + (index * Math.PI * 2) / 3;
    const radius = 84 + exit.get() * 420;
    const shown = interpolate(orbit.get(), [0, 0.12], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: shown * (1 - exit.get()),
      transform: [
        { translateX: Math.cos(angle) * radius },
        { translateY: Math.sin(angle) * radius },
        { scale: shown },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute h-3.5 w-3.5 rounded-full"
      style={[{ backgroundColor: ORBIT_COLORS[index] }, style]}
    />
  );
}

/**
 * Animated launch screen. The native splash is plain white, so this picks up seamlessly:
 * a brand tile pops in, a checkmark draws itself, rings ripple out, booking "dots" orbit,
 * the wordmark rises, then the tile zooms through the screen to reveal the app.
 */
export function SplashOverlay({ ready }: { ready: boolean }) {
  const { height } = useWindowDimensions();
  const [done, setDone] = useState(false);

  const pop = useSharedValue(0);
  const check = useSharedValue(0);
  const bump = useSharedValue(1);
  const orbit = useSharedValue(0);
  const lift = useSharedValue(0);
  const exit = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hide();

    pop.set(withDelay(T.pop, withSpring(1, { damping: 11, stiffness: 140 })));
    check.set(
      withDelay(T.check, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })),
    );
    // A little "confirmed!" bounce right after the check lands
    bump.set(
      withDelay(
        T.check + 480,
        withSequence(
          withTiming(1.12, { duration: 130 }),
          withSpring(1, { damping: 7, stiffness: 260 }),
        ),
      ),
    );
    orbit.set(
      withDelay(
        T.orbit,
        withTiming(1.6, { duration: T.exit - T.orbit + 500, easing: Easing.inOut(Easing.cubic) }),
      ),
    );
    lift.set(withDelay(T.lift, withSpring(1, { damping: 14, stiffness: 120 })));
    exit.set(withDelay(T.exit, withTiming(1, { duration: 600, easing: Easing.in(Easing.cubic) })));
    fade.set(
      withDelay(
        T.exit + 380,
        withTiming(0, { duration: 320 }, (finished) => {
          if (finished) scheduleOnRN(setDone, true);
        }),
      ),
    );
  }, [ready, pop, check, bump, orbit, lift, exit, fade]);

  // Tile: pop + spin in, lift for the wordmark, then zoom through the screen on exit
  const tileStyle = useAnimatedStyle(() => {
    const zoom = interpolate(exit.get(), [0, 1], [1, (height / TILE) * 2.4]);
    return {
      transform: [
        { translateY: interpolate(lift.get(), [0, 1], [0, -46]) * (1 - exit.get()) },
        { scale: pop.get() * bump.get() * zoom },
        { rotate: `${interpolate(pop.get(), [0, 1], [-120, 0])}deg` },
      ],
    };
  });

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - check.get()),
  }));
  const checkFade = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, exit.get() * 3) }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, exit.get() * 2.5),
    transform: [{ translateY: interpolate(lift.get(), [0, 1], [24, 0]) + exit.get() * 24 }],
  }));

  const containerStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));

  if (done) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.canvas }, containerStyle]}
    >
      {ready && (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center">
          <Ripple delay={T.rings} start={ready} />
          <Ripple delay={T.rings + 450} start={ready} />

          {[0, 1, 2].map((i) => (
            <OrbitDot key={i} index={i} orbit={orbit} exit={exit} />
          ))}

          <Animated.View style={tileStyle}>
            <View
              style={{
                width: TILE,
                height: TILE,
                borderRadius: TILE * 0.28,
                backgroundColor: palette.violet,
                shadowColor: palette.violet,
                shadowOpacity: 0.35,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
                elevation: 10,
              }}
            >
              <Animated.View style={[StyleSheet.absoluteFill, checkFade]}>
                <Svg width={TILE} height={TILE} viewBox="0 0 1024 1024">
                  <AnimatedPath
                    d="M300 530 L450 680 L740 380"
                    stroke="#fff"
                    strokeWidth={110}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`}
                    animatedProps={checkProps}
                  />
                </Svg>
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            className="absolute left-0 right-0 items-center"
            style={[{ top: height / 2 + TILE / 2 - 46 + 22 }, textStyle]}
          >
            <View className="flex-row">
              {WORD.map((ch, i) => (
                <Animated.Text
                  key={i}
                  entering={FadeInDown.delay(T.word + i * 60)
                    .springify()
                    .damping(11)}
                  className="text-[40px] font-bold text-ink"
                >
                  {ch}
                </Animated.Text>
              ))}
            </View>
            <Animated.View entering={FadeInDown.delay(T.tagline).springify()}>
              <Text className="mt-1 text-[15px] text-ink-muted">
                Your calendar, beautifully kept.
              </Text>
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}
