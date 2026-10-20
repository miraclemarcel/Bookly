import Ionicons from '@expo/vector-icons/Ionicons';
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
import { PressableScale } from '@/components/pressable-scale';
import { SectionHeader } from '@/components/section-header';
import { SegmentedControl } from '@/components/segmented-control';
import { type BookingView, useBookingViews } from '@/hooks/use-bookings';
import { DAY, addDays, formatHour, monthShort, startOfDay, weekdayShort } from '@/lib/date';
import { money } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { CLOSE_HOUR, OPEN_HOUR } from '@/lib/schedule';
import { STATUS_META } from '@/lib/status';
import { palette } from '@/lib/theme';
import { useBookingStore } from '@/store/booking-store';

type Range = 'week' | 'month';

const CHART_HEIGHT = 140;

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
    h.set(withDelay(index * 40, withSpring(Math.max(0.03, ratio), { damping: 16, stiffness: 120 })));
  }, [h, ratio, index]);
  const style = useAnimatedStyle(() => ({ height: h.get() * CHART_HEIGHT }));

  return (
    <Pressable onPress={onPress} className="flex-1 items-center">
      <View style={{ height: CHART_HEIGHT + 24 }} className="w-full items-center justify-end">
        {selected && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <View className="mb-1.5 rounded-md bg-ink px-1.5 py-0.5">
              <Text numberOfLines={1} className="text-[10px] font-bold text-white">
                {money(value)}
              </Text>
            </View>
          </Animated.View>
        )}
        <Animated.View
          style={[
            { width: '62%', borderRadius: 6, backgroundColor: highlight || selected ? palette.violet : palette.surface3 },
            style,
          ]}
        />
      </View>
      <Text numberOfLines={1} className={`mt-2 text-[11px] font-semibold ${selected ? 'text-ink' : 'text-ink-muted'}`}>
        {label}
      </Text>
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
    <View className="h-2 overflow-hidden rounded-full bg-surface-2">
      <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: color }, style]} />
    </View>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-2xl border border-line bg-canvas p-4 ${className}`}>{children}</View>;
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
  const trendColor = up ? palette.mint : palette.coral;

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
    <View className="flex-1 bg-canvas">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}>
        <Text className="text-[28px] font-bold text-ink">Insights</Text>
        <Text className="mt-0.5 text-sm text-ink-muted">How the studio is doing</Text>

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

        <Animated.View entering={FadeInDown.duration(350)}>
          <Card className="mt-5 p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">Earned</Text>
              <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: trendColor + '1A' }}>
                <Ionicons name={up ? 'trending-up' : 'trending-down'} size={14} color={trendColor} />
                <Text className="ml-1 text-xs font-bold" style={{ color: trendColor }}>
                  {Math.abs(Math.round(data.delta * 100))}%
                </Text>
              </View>
            </View>
            <AnimatedNumber value={data.revenue} format={money} className="mt-2 text-4xl font-bold text-ink" />
            <Text className="mt-1 text-[13px] text-ink-muted">vs. the previous {data.days} days</Text>

            <View className="mt-5 flex-row items-end">
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
          </Card>
        </Animated.View>

        <View className="mt-3 flex-row gap-3">
          <Animated.View entering={FadeInDown.delay(80).duration(350)} className="flex-1">
            <Card>
              <Text className="text-[13px] text-ink-muted">Show-up rate</Text>
              <AnimatedNumber
                value={data.showRate * 100}
                format={(n) => `${Math.round(n)}%`}
                className="mt-1 text-2xl font-bold text-ink"
              />
            </Card>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(140).duration(350)} className="flex-1">
            <Card>
              <Text className="text-[13px] text-ink-muted">Avg. ticket</Text>
              <AnimatedNumber value={data.avgTicket} format={money} className="mt-1 text-2xl font-bold text-ink" />
            </Card>
          </Animated.View>
        </View>

        <SectionHeader title="Booking outcomes" right={<Text className="text-[13px] text-ink-muted">{data.total} total</Text>} />
        <Card>
          <View className="h-3 flex-row overflow-hidden rounded-full bg-surface-2">
            {data.statusCounts.map(({ status, count }) =>
              count ? (
                <Animated.View
                  key={`${range}-${status}`}
                  entering={FadeIn.duration(500)}
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
        </Card>

        <SectionHeader title="Top services" />
        <Card>
          {data.services.length === 0 ? (
            <Text className="text-sm text-ink-muted">No bookings in this period yet.</Text>
          ) : (
            data.services.map((s, i) => (
              <View key={`${range}-${s.name}`} className={i ? 'mt-4' : ''}>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text numberOfLines={1} className="flex-1 pr-2 text-sm font-semibold text-ink">
                    {s.emoji} {s.name}
                  </Text>
                  <Text className="text-[13px] text-ink-muted">
                    {s.count} · {money(s.revenue)}
                  </Text>
                </View>
                <GrowBar ratio={s.count / maxService} color={s.color} delay={i * 80} />
              </View>
            ))
          )}
        </Card>

        <SectionHeader title="Busiest hours" />
        <Card>
          <View className="flex-row gap-1">
            {data.heat.map((v, i) => (
              <View
                key={`${range}-${i}`}
                className="h-10 flex-1 rounded-md"
                style={{ backgroundColor: palette.violet, opacity: 0.08 + (v / maxHeat) * 0.92 }}
              />
            ))}
          </View>
          <View className="mt-2 flex-row justify-between">
            {data.hours
              .filter((_, i) => i % 3 === 0)
              .map((h) => (
                <Text key={h} className="text-[11px] text-ink-muted">
                  {formatHour(h)}
                </Text>
              ))}
          </View>
        </Card>

        <SectionHeader title="Data" />
        <View className="flex-row gap-3">
          <PressableScale
            className="flex-1 flex-row items-center justify-center rounded-xl border border-line py-3.5"
            onPress={() => confirm('Reset demo data?', 'Replaces everything with fresh sample bookings.', resetDemo)}>
            <Ionicons name="refresh" size={16} color={palette.ink} />
            <Text className="ml-2 font-semibold text-ink">Reset demo</Text>
          </PressableScale>
          <PressableScale
            className="flex-1 flex-row items-center justify-center rounded-xl bg-coral/10 py-3.5"
            onPress={() => confirm('Clear everything?', 'Deletes all bookings and clients. This cannot be undone.', clearAll)}>
            <Ionicons name="trash-outline" size={16} color={palette.coral} />
            <Text className="ml-2 font-semibold text-coral">Clear all</Text>
          </PressableScale>
        </View>

        <Text className="mt-8 text-center text-xs text-ink-faint">Bookly · made with care</Text>
      </ScrollView>
    </View>
  );
}
