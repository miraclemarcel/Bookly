import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { brand, palette } from '@/lib/theme';

interface BlobProps {
  color: string;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay?: number;
  drift?: number;
}

/** A soft glowing orb faked with stacked translucent circles, slowly drifting */
function Blob({ color, size, x, y, duration, delay = 0, drift = 40 }: BlobProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
      ),
    );
  }, [t, delay, duration]);

  const style = useAnimatedStyle(() => {
    const p = t.get();
    return {
      transform: [
        { translateX: interpolate(p, [0, 1], [-drift, drift]) },
        { translateY: interpolate(p, [0, 1], [drift * 0.6, -drift]) },
        { scale: interpolate(p, [0, 0.5, 1], [0.92, 1.08, 0.95]) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }, style]}>
      {[1, 0.78, 0.56, 0.36].map((k) => (
        <View
          key={k}
          style={{
            position: 'absolute',
            left: (size * (1 - k)) / 2,
            top: (size * (1 - k)) / 2,
            width: size * k,
            height: size * k,
            borderRadius: (size * k) / 2,
            backgroundColor: color,
            opacity: 0.045,
          }}
        />
      ))}
    </Animated.View>
  );
}

/** Ambient animated background used behind every screen */
export function Aurora({ intensity = 1 }: { intensity?: number }) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.canvas }]} />
      <Blob color={brand.violet} size={width * 1.1} x={width * 0.1} y={height * 0.05} duration={9000} />
      <Blob color={brand.pink} size={width * 0.9} x={width * 0.95} y={height * 0.22} duration={11000} delay={800} />
      <Blob color={brand.amber} size={width * 0.7} x={width * 0.3} y={height * 0.85} duration={13000} delay={1600} drift={60} />
    </View>
  );
}
