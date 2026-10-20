import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { BookingView } from '@/hooks/use-bookings';

import { dayKey, formatHour, formatTime, isSameDay } from '@/lib/date';
import { haptic } from '@/lib/haptics';
import { CLOSE_HOUR, OPEN_HOUR } from '@/lib/schedule';
import { palette } from '@/lib/theme';
import { ServiceIcon } from './service-icon';

const HOUR_HEIGHT = 76;
const GUTTER = 52;

function NowLine({ now }: { now: Date }) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(
      withRepeat(withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({
    opacity: 1 - pulse.get(),
    transform: [{ scale: 1 + pulse.get() * 2 }],
  }));

  if (minutes < OPEN_HOUR * 60 || minutes > CLOSE_HOUR * 60) return null;
  const top = ((minutes - OPEN_HOUR * 60) / 60) * HOUR_HEIGHT;

  return (
    <View
      pointerEvents="none"
      className="absolute right-0 flex-row items-center"
      style={{ top: top - 5, left: GUTTER - 5 }}
    >
      <View className="h-2.5 w-2.5 items-center justify-center">
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: palette.coral,
            },
            ring,
          ]}
        />
        <View className="h-2.5 w-2.5 rounded-full bg-coral" />
      </View>
      <View className="h-[2px] flex-1 bg-coral" />
    </View>
  );
}

export function DayTimeline({
  day,
  bookings,
  now,
}: {
  day: Date;
  bookings: BookingView[];
  now: Date;
}) {
  const hours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
  const visible = bookings.filter((b) => b.status !== 'cancelled');

  return (
    <View style={{ height: hours.length * HOUR_HEIGHT + 12 }}>
      {hours.map((h, i) => (
        <Pressable
          key={h}
          className="absolute left-0 right-0 flex-row"
          style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
          onPress={() => {
            haptic.tap();
            router.push({
              pathname: '/booking/new',
              params: { date: dayKey(day), time: `${String(h).padStart(2, '0')}:00` },
            });
          }}
        >
          <Text
            className="w-[52px] text-[11px] font-semibold text-ink-faint"
            style={{ marginTop: -7 }}
          >
            {formatHour(h)}
          </Text>
          <View className="flex-1 border-t border-line" />
        </Pressable>
      ))}

      {visible.map((b) => {
        const startMin = b.startDate.getHours() * 60 + b.startDate.getMinutes();
        const top = ((startMin - OPEN_HOUR * 60) / 60) * HOUR_HEIGHT;
        const height = Math.max(34, (b.service.duration / 60) * HOUR_HEIGHT - 4);
        const done = b.status !== 'confirmed';
        const compact = height < 56;
        return (
          <View
            key={b.id}
            style={{ position: 'absolute', right: 0, top: top + 2, height, left: GUTTER + 6 }}
          >
            <Pressable
              className="flex-1 overflow-hidden rounded-xl border-l-4 px-3 py-1.5"
              style={{
                borderLeftColor: b.service.colors[0],
                backgroundColor: b.service.colors[0] + (done ? '14' : '24'),
              }}
              onPress={() => {
                haptic.tap();
                router.push({ pathname: '/booking/[id]', params: { id: b.id } });
              }}
            >
              <View className="flex-row items-center justify-between">
                <ServiceIcon service={b.service} size={13} bare />
                <Text
                  numberOfLines={1}
                  className={`ml-1.5 flex-1 text-[13px] font-bold ${done ? 'text-ink-muted' : 'text-ink'}`}
                >
                  {b.client.name}
                </Text>
                {compact && (
                  <Text className="ml-2 text-[11px] text-ink-muted">{formatTime(b.startDate)}</Text>
                )}
              </View>
              {!compact && (
                <Text className="mt-0.5 text-[11px] text-ink-muted">
                  {b.service.name} · {formatTime(b.startDate)} – {formatTime(b.endDate)}
                </Text>
              )}
              {b.status === 'completed' && !compact && (
                <View className="mt-1 flex-row items-center">
                  <Ionicons name="checkmark-circle" size={12} color={palette.mint} />
                  <Text className="ml-1 text-[11px] font-semibold" style={{ color: palette.mint }}>
                    Completed
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        );
      })}

      {isSameDay(day, now) && <NowLine now={now} />}
    </View>
  );
}
