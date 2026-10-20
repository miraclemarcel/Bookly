import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { palette } from '@/lib/theme';

/** Matches `imageWidth` of the expo-splash-screen plugin in app.json */
const IMAGE = 200;
/** The violet circle is 640/1024 of the splash image */
const CIRCLE = (IMAGE * 640) / 1024;

/** Timeline, in ms */
const T = { pulse: 120, lift: 520, text: 640, exit: 1550 };

/**
 * The Bookly mark, drawn on the same 1024 canvas as assets/images/splash-icon.png
 * so the handoff from the native splash is pixel-identical.
 */
function Mark() {
  return (
    <Svg width={IMAGE} height={IMAGE} viewBox="0 0 1024 1024">
      <Circle cx={512} cy={512} r={320} fill={palette.violet} />
      {/* Glyph grid is 100 units centred on 50, scaled ×6 like the generated PNG */}
      <G transform="translate(512 512) scale(6) translate(-50 -50)">
        <Rect x={22} y={28} width={56} height={52} rx={9} fill="#fff" />
        {/* Gaps that separate the binding pegs from the page */}
        <Rect x={30.8} y={25.8} width={11.4} height={2.64} fill={palette.violet} />
        <Rect x={57.8} y={25.8} width={11.4} height={2.64} fill={palette.violet} />
        <Rect x={33} y={19} width={7} height={16} rx={3.5} fill="#fff" />
        <Rect x={60} y={19} width={7} height={16} rx={3.5} fill="#fff" />
        <Path
          d="M36 55 L46 65 L65 45"
          stroke={palette.violet}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

/**
 * Animated launch screen. Picks up exactly where the native splash leaves off:
 * the mark pulses once with a soft ripple, lifts while the wordmark rises in,
 * then everything fades to reveal the app.
 */
export function SplashOverlay({ ready }: { ready: boolean }) {
  const { height } = useWindowDimensions();
  const [done, setDone] = useState(false);

  const pulse = useSharedValue(1);
  const ripple = useSharedValue(0);
  const lift = useSharedValue(0);
  const text = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hide();

    pulse.set(
      withDelay(
        T.pulse,
        withSequence(
          withTiming(0.9, { duration: 160, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 9, stiffness: 220 }),
        ),
      ),
    );
    ripple.set(
      withDelay(T.pulse + 120, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })),
    );
    lift.set(withDelay(T.lift, withSpring(1, { damping: 16, stiffness: 140 })));
    text.set(withDelay(T.text, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })));
    exit.set(
      withDelay(
        T.exit,
        withTiming(1, { duration: 380, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(setDone, true);
        }),
      ),
    );
  }, [ready, pulse, ripple, lift, text, exit]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(lift.get(), [0, 1], [0, -44]) },
      { scale: pulse.get() * interpolate(lift.get(), [0, 1], [1, 0.82]) * (1 + exit.get() * 0.12) },
    ],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ripple.get(), [0, 0.15, 1], [0, 0.35, 0]),
    transform: [{ scale: interpolate(ripple.get(), [0, 1], [1, 1.9]) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: text.get(),
    transform: [{ translateY: interpolate(text.get(), [0, 1], [14, 0]) }],
  }));

  const containerStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.get() }));

  if (done) return null;

  return (
    <Animated.View
      pointerEvents={ready ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
    >
      {ready && (
        <>
          <Animated.View style={[styles.ripple, rippleStyle]} />
          <Animated.View style={markStyle}>
            <Mark />
          </Animated.View>
          <Animated.View style={[styles.textWrap, { top: height / 2 + 26 }, textStyle]}>
            <Animated.Text style={styles.word}>Bookly</Animated.Text>
            <Animated.Text style={styles.tagline}>Your calendar, beautifully kept.</Animated.Text>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 2,
    borderColor: palette.violet,
  },
  textWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  word: {
    fontSize: 34,
    fontWeight: '800',
    color: palette.ink,
  },
  tagline: {
    marginTop: 4,
    fontSize: 15,
    color: palette.inkMuted,
  },
});
