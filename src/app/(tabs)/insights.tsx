import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BookingStatus } from '@/types';

import { AnimatedNumber } from '@/components/animated-number';
import { Aurora } from '@/components/aurora';
import { PressableScale } from '@/components/pressable-scale';
import { SectionHeader } from '@/components/section-header';
import { SegmentedControl } from '@/components/segmented-control';
import { type BookingView, useBookingViews } from '@/hooks/use-bookings';
import { DAY, addDays, formatHour, monthShort, startOfDay, weekdayShort } from '@/lib/date';
import { money } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { CLOSE_HOUR, OPEN_HOUR } from '@/lib/schedule';
import { STATUS_META } from '@/lib/status';
import { brandGradient, palette } from '@/lib/theme';
import { useBookingStore } from '@/store/booking-store';

type Range = 'week' | 'month';

const CHART_HEIGHT = 150;

const earned = (list: BookingView[]) =>
  list.filter((b) => b.status === 'completed').reduce((s, b) => s + b.service.price, 0);

function Bar({
  ratio,
  index,
  highlight,
  label,
  value,
  selected,
  onPress,
}: {
  ratio: number;
  index: number;
  highlight: boolean;
  label: string;
  value: number;
  selected: boolean;
  onPress: () => void;
}) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.set(withDelay(index * 55, withSpring(Math.max(0.03, ratio), { damping: 13, stiffness: 120 })));
  }, [h, ratio, index]);
  const style = useAnimatedStyle(() => ({ height: h.get() * CHART_HEIGHT }));

  return (
    <Pressable onPress={onPress} className="flex-1 items-center">
      <View style={{ height: CHART_HEIGHT + 22 }} className="w-full items-center justify-end">
        {selected && (
          <Animated.View entering={FadeInDown.springify()} className="mb-1.5 rounded-lg bg-ink px-1.5 py-0.5">
            <Text className="text-[10px] font-black text-white">{money(value)}</Text>
          </Animated.View>
        )}
        <Animated.View style={style} className="w-[70%] overflow-hidden rounded-xl">
          {highlight || selected ? (
            <LinearGradient colors={[palette.pink, palette.violet]} className="flex-1" />
          ) : (
            <View className="flex-1 bg-surface-3" />
          )}
        </Animated.View>
      </View>
      <Text className={`mt-2 text-[10px] font-semibold ${selected ? 'text-ink' : 'text-ink-faint'}`}>{label}</Text>
    </Pressable>
  );
}

function GrowBar({ ratio, color, delay }: { ratio: number; color: string; delay: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.set(withDelay(delay, withSpring(ratio, { damping: 18 })));
  }, [w, ratio, delay]);
  const style = useAnimatedStyle(() => ({ width: `${w.get() * 100}%` }));
  return (
    <View className="h-2 overflow-hidden rounded-full bg-surface-3">
      <Animated.View style={[style, { backgroundColor: color }]} className="h-full rounded-full" />
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const all = useBookingViews();
  const resetDemo = useBookingStore((s) => s.resetDemo);
  const clearAll = useBookingStore((s) => s.clearAll);
  const [range, setRange] = useState<Range>('week');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const data = useMemo(() => {
    const today = startOfDay(new Date());
    const span = range === 'week' ? 7 : 28;
    const from = addDays(today, -(span - 1));
    const to = addDays(today, 1);
    const prevFrom = addDays(from, -span);

    const inRange = all.filter((b) => b.startDate >= from && b.startDate < to);
    const prev = all.filter((b) => b.startDate >= prevFrom && b.startDate < from);

    // Week → 7 daily bars. Month → 4 weekly bars.
    const bucketDays = range === 'week' ? 1 : 7;
    const buckets = Array.from({ length: span / bucketDays }, (_, i) => {
      const start = addDays(from, i * bucketDays);
      const end = addDays(start, bucketDays);
      const list = inRange.filter((b) => b.startDate >= start && b.startDate < end);
      return {
        label: range === 'week' ? weekdayShort(start).slice(0, 2) : `${monthShort(start)} ${start.getDate()}`,
        value: earned(list),
      };
    });

    const statusCounts = (['completed', 'confirmed', 'no-show', 'cancelled'] as BookingStatus[]).map((s) => ({
      status: s,
      count: inRange.filter((b) => b.status === s).length,
    }));

    const byService = new Map<string, { name: string; emoji: string; color: string; count: number; revenue: number }>();
    for (const b of inRange) {
      if (b.status === 'cancelled') continue;
      const e = byService.get(b.serviceId) ?? {
        name: b.service.name,
        emoji: b.service.emoji,
        color: b.service.colors[0],
        count: 0,
        revenue: 0,
      };
      e.count++;
      if (b.status === 'completed') e.revenue += b.service.price;
      byService.set(b.serviceId, e);
    }
    const services = [...byService.values()].sort((a, b) => b.count - a.count).slice(0, 4);

    const hours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
    const heat = hours.map((h) => inRange.filter((b) => b.status !== 'cancelled' && b.startDate.getHours() === h).length);

    const revenue = earned(inRange);
    const prevRevenue = earned(prev);
    const done = statusCounts.find((s) => s.status === 'completed')!.count;
    const noShow = statusCounts.find((s) => s.status === 'no-show')!.count;

    return {
      revenue,
      delta: prevRevenue ? (revenue - prevRevenue) / prevRevenue : 0,
      buckets,
      statusCounts,
      total: inRange.length,
      services,
      hours,
      heat,
      showRate: done + noShow ? done / (done + noShow) : 1,
      avgTicket: done ? revenue / done : 0,
      days: Math.round((to.getTime() - from.getTime()) / DAY),
    };
  }, [all, range]);

  const maxBar = Math.max(1, ...data.buckets.map((b) => b.value));
  const maxHeat = Math.max(1, ...data.heat);
  const maxService = Math.max(1, ...data.services.map((s) => s.count));
  const peakIndex = data.buckets.findIndex((b) => b.value === maxBar);
  const up = data.delta >= 0;

  const confirm = (title: string, message: string, action: () => void) =>
    Alert.alert(title, message, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Do it',
        style: 'destructive',
        onPress: () => {
          haptic.warn();
          action();
        },
      },
    ]);

  return (
    <View className="flex-1">
      <Aurora intensity={0.8} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}>
        <Text className="text-[30px] font-black tracking-tight text-ink">Insights</Text>
        <Text className="text-sm text-ink-muted">How the studio is doing</Text>

        <View className="mt-5">
          <SegmentedControl
            value={range}
            onChange={(r) => {
              setRange(r);
              setSelectedBar(null);
            }}
            options={[
              { value: 'week', label: 'Last 7 days' },
              { value: 'month', label: 'Last 4 weeks' },
            ]}
          />
        </View>

        <Animated.View entering={FadeInDown.springify().damping(15)} className="mt-5 overflow-hidden rounded-4xl">
          <LinearGradient colors={['#F3EDFF', '#FFF0F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-[2px] text-ink-muted">Earned</Text>
              <View
                className="flex-row items-center rounded-full px-2.5 py-1"
                style={{ backgroundColor: (up ? palette.mint : palette.coral) + '22' }}>
                <Ionicons name={up ? 'trending-up' : 'trending-down'} size={14} color={up ? palette.mint : palette.coral} />
                <Text className="ml-1 text-xs font-bold" style={{ color: up ? palette.mint : palette.coral }}>
                  {Math.abs(Math.round(data.delta * 100))}%
                </Text>
              </View>
            </View>
            <AnimatedNumber value={data.revenue} format={money} className="mt-2 text-5xl font-black tracking-tight text-ink" />
            <Text className="mt-1 text-xs text-ink-faint">vs. the previous {data.days} days</Text>

            <View className="mt-6 flex-row items-end">
              {data.buckets.map((b, i) => (
                <Bar
                  key={`${range}-${i}`}
                  index={i}
                  ratio={b.value / maxBar}
                  value={b.value}
                  label={b.label}
                  highlight={i === peakIndex}
                  selected={selectedBar === i}
                  onPress={() => {
                    haptic.tap();
                    setSelectedBar(selectedBar === i ? null : i);
                  }}
                />
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <View className="mt-3 flex-row gap-3">
          <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-1 rounded-3xl border border-line bg-surface p-4">
            <Text className="text-xs text-ink-faint">Show-up rate</Text>
            <AnimatedNumber value={data.showRate * 100} format={(n) => `${Math.round(n)}%`} className="mt-1 text-2xl font-black text-ink" />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(160).springify()} className="flex-1 rounded-3xl border border-line bg-surface p-4">
            <Text className="text-xs text-ink-faint">Avg. ticket</Text>
            <AnimatedNumber value={data.avgTicket} format={money} className="mt-1 text-2xl font-black text-ink" />
          </Animated.View>
        </View>

        <SectionHeader title="Booking outcomes" right={<Text className="text-xs text-ink-faint">{data.total} total</Text>} />
        <View className="rounded-3xl border border-line bg-surface p-4">
          <View className="h-3 flex-row overflow-hidden rounded-full bg-surface-3">
            {data.statusCounts.map(({ status, count }) =>
              count ? (
                <Animated.View
                  key={`${range}-${status}`}
                  entering={FadeIn.duration(600)}
                  style={{ flex: count, backgroundColor: STATUS_META[status].color }}
                />
              ) : null,
            )}
          </View>
          <View className="mt-4 flex-row flex-wrap">
            {data.statusCounts.map(({ status, count }) => (
              <View key={status} className="mb-2 w-1/2 flex-row items-center">
                <View className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_META[status].color }} />
                <Text className="text-sm text-ink-muted">{STATUS_META[status].label}</Text>
                <Text className="ml-1.5 text-sm font-bold text-ink">{count}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionHeader title="Top services" />
        <View className="rounded-3xl border border-line bg-surface p-4">
          {data.services.length === 0 ? (
            <Text className="text-sm text-ink-faint">No bookings in this period yet.</Text>
          ) : (
            data.services.map((s, i) => (
              <View key={`${range}-${s.name}`} className={i ? 'mt-4' : ''}>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-ink">
                    {s.emoji}  {s.name}
                  </Text>
                  <Text className="text-xs text-ink-muted">
                    {s.count} · {money(s.revenue)}
                  </Text>
                </View>
                <GrowBar ratio={s.count / maxService} color={s.color} delay={i * 90} />
              </View>
            ))
          )}
        </View>

        <SectionHeader title="Busiest hours" />
        <View className="rounded-3xl border border-line bg-surface p-4">
          <View className="flex-row gap-1">
            {data.heat.map((v, i) => (
              <Animated.View key={`${range}-${i}`} entering={FadeIn.delay(i * 40)} className="h-10 flex-1">
                <View
                  className="flex-1 rounded-md"
                  style={{ backgroundColor: palette.pink, opacity: 0.08 + (v / maxHeat) * 0.92 }}
                />
              </Animated.View>
            ))}
          </View>
          <View className="mt-2 flex-row justify-between">
            {data.hours
              .filter((_, i) => i % 3 === 0)
              .map((h) => (
                <Text key={h} className="text-[10px] text-ink-faint">
                  {formatHour(h)}
                </Text>
              ))}
          </View>
        </View>

        <SectionHeader title="Data" />
        <View className="flex-row gap-3">
          <PressableScale
            className="flex-1 flex-row items-center justify-center rounded-2xl bg-surface-2 py-3.5"
            onPress={() => confirm('Reset demo data?', 'Replaces everything with fresh sample bookings.', resetDemo)}>
            <Ionicons name="refresh" size={16} color={palette.ink} />
            <Text className="ml-2 font-semibold text-ink">Reset demo</Text>
          </PressableScale>
          <PressableScale
            className="flex-1 flex-row items-center justify-center rounded-2xl bg-coral/15 py-3.5"
            onPress={() => confirm('Clear everything?', 'Deletes all bookings and clients. This cannot be undone.', clearAll)}>
            <Ionicons name="trash-outline" size={16} color={palette.coral} />
            <Text className="ml-2 font-semibold text-coral">Clear all</Text>
          </PressableScale>
        </View>

        <View className="mt-8 items-center">
          <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-1 w-10 rounded-full" />
          <Text className="mt-2 text-xs text-ink-faint">Bookly · made with care</Text>
        </View>
      </ScrollView>
    </View>
  );
}
