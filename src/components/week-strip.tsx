import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { addDays, dayKey, isSameDay, weekdayShort } from '@/lib/date';
import { haptic } from '@/lib/haptics';
import { palette } from '@/lib/theme';

interface Props {
  weekStart: Date;
  selected: Date;
  onSelect: (day: Date) => void;
  onWeekChange: (direction: 1 | -1) => void;
  /** dayKey → number of active bookings */
  counts: Record<string, number>;
}

export function WeekStrip({ weekStart, selected, onSelect, onWeekChange, counts }: Props) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50) scheduleOnRN(onWeekChange, 1);
      else if (e.translationX > 50) scheduleOnRN(onWeekChange, -1);
    });

  return (
    <GestureDetector gesture={swipe}>
      <View className="flex-row gap-1">
        {days.map((d) => {
          const active = isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          const count = counts[dayKey(d)] ?? 0;
          return (
            <Pressable
              key={dayKey(d)}
              className={`flex-1 items-center rounded-xl py-2.5 ${active ? 'bg-violet' : ''}`}
              onPress={() => {
                haptic.tap();
                onSelect(d);
              }}>
              <Text className={`text-[11px] font-semibold uppercase ${active ? 'text-white' : 'text-ink-faint'}`}>
                {weekdayShort(d)}
              </Text>
              <Text
                className={`mt-1 text-lg font-bold ${active ? 'text-white' : isToday ? 'text-violet' : 'text-ink'}`}>
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
            </Pressable>
          );
        })}
      </View>
    </GestureDetector>
  );
}
