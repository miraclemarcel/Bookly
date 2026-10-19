import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';

interface Props extends Omit<PressableProps, 'style'> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** How far to shrink while pressed */
  scaleTo?: number;
  haptics?: boolean;
}

/** A Pressable that squishes on touch, springs back, and gives a light tick */
export function PressableScale({
  children,
  className,
  style,
  scaleTo = 0.96,
  haptics = true,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.set(withSpring(scaleTo, { damping: 15, stiffness: 400 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, { damping: 12, stiffness: 300 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptics) haptic.tap();
        onPress?.(e);
      }}>
      <Animated.View className={className} style={[style, animatedStyle]}>
        {children as React.ReactNode}
      </Animated.View>
    </Pressable>
  );
}
