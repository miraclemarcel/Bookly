import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aurora } from '@/components/aurora';
import { BookingCard } from '@/components/booking-card';
import { DayTimeline } from '@/components/day-timeline';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { SegmentedControl } from '@/components/segmented-control';
import { WeekStrip } from '@/components/week-strip';
import { useBookingViews, useNow } from '@/hooks/use-bookings';
import {
  addDays,
  dayKey,
  formatDayLong,
  formatDuration,
  isSameDay,
  monthName,
  startOfDay,
  startOfWeek,
} from '@/lib/date';
import { money } from '@/lib/format';
import { palette } from '@/lib/theme';

type Mode = 'timeline' | 'list';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const all = useBookingViews();
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [mode, setMode] = useState<Mode>('timeline');

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of all) {
      if (b.status === 'cancelled') continue;
      const k = dayKey(b.startDate);
      map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }, [all]);

  const dayBookings = useMemo(() => all.filter((b) => isSameDay(b.startDate, selected)), [all, selected]);
  const active = dayBookings.filter((b) => b.status !== 'cancelled');
  const cancelled = dayBookings.length - active.length;
  const revenue = active.filter((b) => b.status !== 'no-show').reduce((s, b) => s + b.service.price, 0);
  const minutes = active.reduce((s, b) => s + b.service.duration, 0);

  const changeWeek = (dir: 1 | -1) => {
    const next = addDays(weekStart, dir * 7);
    setWeekStart(next);
    setSelected(next);
  };

  const goToday = () => {
    const today = startOfDay(new Date());
    setWeekStart(startOfWeek(today));
    setSelected(today);
  };

  const isToday = isSameDay(selected, now);

  return (
    <View className="flex-1">
      <Aurora intensity={0.7} />
      <View style={{ paddingTop: insets.top + 16 }} className="px-5">
        <View className="flex-row items-center justify-between">
          <Animated.Text
            key={monthName(weekStart)}
            entering={FadeInDown.springify()}
            className="text-[30px] font-black tracking-tight text-mist">
            {monthName(selected)} <Text className="text-mist-faint">{selected.getFullYear()}</Text>
          </Animated.Text>
          <View className="flex-row items-center gap-2">
            {!isToday && (
              <Animated.View entering={FadeIn}>
                <PressableScale onPress={goToday} className="rounded-full bg-ink-700 px-3 py-2">
                  <Text className="text-xs font-bold text-pink">Today</Text>
                </PressableScale>
              </Animated.View>
            )}
            <PressableScale onPress={() => changeWeek(-1)} className="h-9 w-9 items-center justify-center rounded-full bg-ink-700">
              <Ionicons name="chevron-back" size={18} color={palette.mist} />
            </PressableScale>
            <PressableScale onPress={() => changeWeek(1)} className="h-9 w-9 items-center justify-center rounded-full bg-ink-700">
              <Ionicons name="chevron-forward" size={18} color={palette.mist} />
            </PressableScale>
          </View>
        </View>

        <View className="mt-4 rounded-3xl border border-white/5 bg-ink-800/80 px-1">
          <WeekStrip
            weekStart={weekStart}
            selected={selected}
            onSelect={setSelected}
            onWeekChange={changeWeek}
            counts={counts}
          />
        </View>

        <View className="mt-5 flex-row items-end justify-between">
          <View>
            <Text className="text-base font-extrabold text-mist">{formatDayLong(selected)}</Text>
            <Text className="mt-0.5 text-xs text-mist-muted">
              {active.length} booked · {formatDuration(minutes || 0)} · {money(revenue)}
              {cancelled ? ` · ${cancelled} cancelled` : ''}
            </Text>
          </View>
          <View className="w-44">
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                { value: 'timeline', label: 'Timeline' },
                { value: 'list', label: 'List' },
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView
        className="mt-4 flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 }}>
        {selected.getDay() === 0 && active.length === 0 ? (
          <EmptyState emoji="🏖️" title="Closed on Sundays" subtitle="The studio rests. So should you." />
        ) : mode === 'timeline' ? (
          <Animated.View key={dayKey(selected)} entering={FadeIn.duration(250)}>
            <DayTimeline day={selected} bookings={dayBookings} now={now} />
            <Text className="mt-2 text-center text-xs text-mist-faint">Tap an empty hour to book it</Text>
          </Animated.View>
        ) : dayBookings.length === 0 ? (
          <EmptyState emoji="📭" title="Nothing booked" subtitle="This day is wide open.">
            <PressableScale
              onPress={() => router.push({ pathname: '/booking/new', params: { date: dayKey(selected) } })}
              className="rounded-full bg-violet px-5 py-3">
              <Text className="font-bold text-white">Book this day</Text>
            </PressableScale>
          </EmptyState>
        ) : (
          <View key={dayKey(selected)}>
            {dayBookings.map((b, i) => (
              <BookingCard key={b.id} booking={b} index={i} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
