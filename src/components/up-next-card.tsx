import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { BookingView } from '@/hooks/use-bookings';

import { HOUR, formatCountdown, formatTime, relativeDay } from '@/lib/date';

import { PressableScale } from './pressable-scale';
import { ProgressRing } from './progress-ring';

function LiveDot() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [t]);
  const ring = useAnimatedStyle(() => ({
    opacity: 1 - t.get(),
    transform: [{ scale: 1 + t.get() * 1.6 }],
  }));
  return (
    <View className="mr-2 h-2.5 w-2.5 items-center justify-center">
      <Animated.View
        style={[
          { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
          ring,
        ]}
      />
      <View className="h-2.5 w-2.5 rounded-full bg-white" />
    </View>
  );
}

export function UpNextCard({ booking, now }: { booking: BookingView; now: Date }) {
  const inProgress = booking.startDate <= now && now < booking.endDate;
  const msUntil = booking.startDate.getTime() - now.getTime();

  // In progress → how far through the appointment; upcoming → closeness within a 2h window
  const progress = inProgress
    ? (now.getTime() - booking.startDate.getTime()) /
      (booking.endDate.getTime() - booking.startDate.getTime())
    : 1 - Math.min(1, msUntil / (2 * HOUR));

  const ringLabel = inProgress
    ? `${Math.max(1, Math.round((booking.endDate.getTime() - now.getTime()) / 60000))}m`
    : formatCountdown(msUntil).replace('in ', '');

  return (
    <Animated.View entering={FadeInUp.delay(100).duration(350)}>
      <PressableScale
        onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}
        className="rounded-3xl bg-violet p-5"
      >
        <View className="flex-row items-center">
          {inProgress && <LiveDot />}
          <Text className="text-xs font-bold uppercase tracking-wider text-white">
            {inProgress ? 'In session' : `Up next · ${relativeDay(booking.startDate, now)}`}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center">
          <View className="flex-1 pr-4">
            <Text numberOfLines={1} className="text-2xl font-bold text-white">
              {booking.client.name}
            </Text>
            <Text numberOfLines={1} className="mt-1 text-[15px] text-white">
              {booking.service.emoji} {booking.service.name}
            </Text>
            <View className="mt-4 self-start rounded-full bg-white px-3 py-1.5">
              <Text className="text-[13px] font-bold text-violet">
                {formatTime(booking.startDate)} – {formatTime(booking.endDate)}
              </Text>
            </View>
          </View>
          <ProgressRing progress={progress} size={84} stroke={7} track="rgba(255,255,255,0.25)">
            <Text className="text-base font-bold text-white">{ringLabel}</Text>
            <Text className="text-[10px] font-semibold uppercase text-white">
              {inProgress ? 'left' : 'to go'}
            </Text>
          </ProgressRing>
        </View>
      </PressableScale>
    </Animated.View>
  );
}
