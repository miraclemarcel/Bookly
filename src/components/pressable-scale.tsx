import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { haptic } from '@/lib/haptics';

interface Props extends Omit<PressableProps, 'style'> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  haptics?: boolean;
}

/** A Pressable that dims while touched and gives a light haptic tick */
export function PressableScale({ className = '', style, haptics = true, onPress, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      className={`${className} active:opacity-70`}
      style={style}
      onPress={(e) => {
        if (haptics) haptic.tap();
        onPress?.(e);
      }}
    />
  );
}
