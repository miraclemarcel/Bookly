import { LinearGradient } from 'expo-linear-gradient';
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
    t.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false));
  }, [t]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - t.get(), transform: [{ scale: 1 + t.get() * 1.6 }] }));
  return (
    <View className="mr-2 h-2.5 w-2.5 items-center justify-center">
      <Animated.View className="absolute h-2.5 w-2.5 rounded-full bg-white" style={ring} />
      <View className="h-2.5 w-2.5 rounded-full bg-white" />
    </View>
  );
}

function FloatingEmoji({ emoji }: { emoji: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -8 * t.get() }, { rotate: `${-18 + t.get() * 10}deg` }],
  }));
  return (
    <Animated.Text style={[{ position: 'absolute', right: -14, bottom: -22, fontSize: 120, opacity: 0.22 }, style]}>
      {emoji}
    </Animated.Text>
  );
}

export function UpNextCard({ booking, now }: { booking: BookingView; now: Date }) {
  const inProgress = booking.startDate <= now && now < booking.endDate;
  const msUntil = booking.startDate.getTime() - now.getTime();

  // In progress → how far through the appointment; upcoming → closeness within a 2h window
  const progress = inProgress
    ? (now.getTime() - booking.startDate.getTime()) / (booking.endDate.getTime() - booking.startDate.getTime())
    : 1 - Math.min(1, msUntil / (2 * HOUR));

  const ringLabel = inProgress
    ? `${Math.max(1, Math.round((booking.endDate.getTime() - now.getTime()) / 60000))}m`
    : formatCountdown(msUntil).replace('in ', '');

  return (
    <Animated.View entering={FadeInUp.delay(150).springify().damping(14)}>
      <PressableScale
        scaleTo={0.97}
        onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}>
        <LinearGradient
          colors={booking.service.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="overflow-hidden rounded-4xl p-5"
          style={{ minHeight: 170 }}>
          <FloatingEmoji emoji={booking.service.emoji} />
          <View className="flex-row items-center">
            {inProgress && <LiveDot />}
            <Text className="text-xs font-bold uppercase tracking-[2px] text-white/80">
              {inProgress ? 'In session' : `Up next · ${relativeDay(booking.startDate, now)}`}
            </Text>
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text numberOfLines={1} className="text-[28px] font-black tracking-tight text-white">
                {booking.client.name}
              </Text>
              <Text className="mt-1 text-[15px] font-medium text-white/85">
                {booking.service.name}
              </Text>
              <View className="mt-4 self-start rounded-full bg-black/20 px-3 py-1.5">
                <Text className="text-[13px] font-bold text-white">
                  {formatTime(booking.startDate)} – {formatTime(booking.endDate)}
                </Text>
              </View>
            </View>
            <ProgressRing progress={progress} size={92} stroke={8} colors={['#ffffff', '#ffffffAA']}>
              <Text className="text-lg font-black text-white">{ringLabel}</Text>
              <Text className="text-[10px] font-semibold uppercase text-white/70">
                {inProgress ? 'left' : 'to go'}
              </Text>
            </ProgressRing>
          </View>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}
