import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function EmptyState({ emoji, title, subtitle, children }: Props) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [t]);

  const bob = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * t.get() }, { rotate: `${-6 + 12 * t.get()}deg` }],
  }));
  const shadow = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - 0.3 * t.get() }],
    opacity: 0.35 - 0.2 * t.get(),
  }));

  return (
    <Animated.View entering={FadeIn.duration(500)} className="items-center px-8 py-10">
      <Animated.Text style={[{ fontSize: 56 }, bob]}>{emoji}</Animated.Text>
      <Animated.View className="mt-2 h-2 w-12 rounded-full bg-black" style={shadow} />
      <Text className="mt-5 text-center text-lg font-bold text-mist">{title}</Text>
      {subtitle ? <Text className="mt-1.5 text-center text-sm text-mist-muted">{subtitle}</Text> : null}
      {children ? <View className="mt-5">{children}</View> : null}
    </Animated.View>
  );
}
