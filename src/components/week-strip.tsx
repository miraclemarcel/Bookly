import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { addDays, dayKey, isSameDay, weekdayShort } from '@/lib/date';
import { haptic } from '@/lib/haptics';
import { brandGradient, palette } from '@/lib/theme';

interface Props {
  weekStart: Date;
  selected: Date;
  onSelect: (day: Date) => void;
  onWeekChange: (direction: 1 | -1) => void;
  /** dayKey → number of active bookings */
  counts: Record<string, number>;
}

export function WeekStrip({ weekStart, selected, onSelect, onWeekChange, counts }: Props) {
  const [width, setWidth] = useState(0);
  const cell = width / 7;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedIndex = days.findIndex((d) => isSameDay(d, selected));

  const x = useSharedValue(0);
  const visible = useSharedValue(selectedIndex >= 0 ? 1 : 0);

  useEffect(() => {
    if (selectedIndex >= 0) x.set(withSpring(selectedIndex * cell, { damping: 16, stiffness: 200 }));
    visible.set(withSpring(selectedIndex >= 0 ? 1 : 0));
  }, [x, visible, selectedIndex, cell]);

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { scale: visible.get() }],
    opacity: visible.get(),
  }));

  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50) scheduleOnRN(onWeekChange, 1);
      else if (e.translationX > 50) scheduleOnRN(onWeekChange, -1);
    });

  return (
    <GestureDetector gesture={swipe}>
      <View className="flex-row" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Animated.View className="absolute bottom-0 top-0 p-1" style={[{ width: cell }, pill]}>
            <LinearGradient
              colors={brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-1 rounded-2xl"
            />
          </Animated.View>
        )}
        {days.map((d, i) => {
          const active = i === selectedIndex;
          const isToday = isSameDay(d, today);
          const count = counts[dayKey(d)] ?? 0;
          return (
            <Pressable
              key={dayKey(d)}
              className="flex-1 items-center py-3"
              onPress={() => {
                haptic.tap();
                onSelect(d);
              }}>
              <Animated.View key={dayKey(weekStart)} entering={FadeIn.delay(i * 35)} className="items-center">
                <Text className={`text-[11px] font-semibold uppercase ${active ? 'text-white/90' : 'text-mist-faint'}`}>
                  {weekdayShort(d)}
                </Text>
                <Text
                  className={`mt-1 text-lg font-black ${active ? 'text-white' : isToday ? 'text-pink' : 'text-mist'}`}>
                  {d.getDate()}
                </Text>
                <View className="mt-1 h-1.5 flex-row gap-0.5">
                  {Array.from({ length: Math.min(count, 4) }).map((_, j) => (
                    <View
                      key={j}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: active ? '#fff' : palette.violet }}
                    />
                  ))}
                </View>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </GestureDetector>
  );
}
