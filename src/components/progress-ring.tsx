import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number;
  size?: number;
  stroke?: number;
  colors?: [string, string];
  track?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 84,
  stroke = 8,
  colors = ['#FFFFFF', '#FFFFFF'],
  track = 'rgba(255,255,255,0.18)',
  children,
}: Props) {
  const gradientId = useId().replace(/:/g, '');
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(1, progress)), { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [p, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - p.get()),
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
