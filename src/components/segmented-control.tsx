import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Pill tabs with a highlight that springs between options */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width / options.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(index * segment, { damping: 18, stiffness: 220 }));
  }, [x, index, segment]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View
      className="flex-row rounded-2xl border border-white/5 bg-ink-800 p-1"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - 8)}>
      {width > 0 && (
        <Animated.View
          className="absolute bottom-1 left-1 top-1 rounded-xl bg-ink-600"
          style={[{ width: segment }, pillStyle]}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            className="flex-1 items-center py-2"
            onPress={() => {
              if (!active) haptic.tap();
              onChange(o.value);
            }}>
            <Text className={`text-sm font-semibold ${active ? 'text-mist' : 'text-mist-faint'}`}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
