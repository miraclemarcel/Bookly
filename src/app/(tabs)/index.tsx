import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedNumber } from '@/components/animated-number';
import { Aurora } from '@/components/aurora';
import { BookingCard } from '@/components/booking-card';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { SectionHeader } from '@/components/section-header';
import { UpNextCard } from '@/components/up-next-card';
import { useBookingViews, useNow } from '@/hooks/use-bookings';
import { HOUR, formatDayLong, greeting, isSameDay, relativeDay } from '@/lib/date';
import { money } from '@/lib/format';
import { CLOSE_HOUR, OPEN_HOUR } from '@/lib/schedule';
import { brandGradient } from '@/lib/theme';

function StatTile({
  label,
  value,
  format,
  icon,
  delay,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(15)}
      className="flex-1 rounded-3xl border border-white/5 bg-ink-800/80 p-4">
      <Ionicons name={icon} size={16} color="#A3A1BF" />
      <AnimatedNumber value={value} format={format} className="mt-3 text-2xl font-black text-mist" />
      <Text className="mt-0.5 text-xs text-mist-faint">{label}</Text>
    </Animated.View>
  );
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const all = useBookingViews();

  const today = useMemo(() => all.filter((b) => isSameDay(b.startDate, now)), [all, now]);
  const active = today.filter((b) => b.status !== 'cancelled');

  const upNext = useMemo(
    () => all.find((b) => b.status === 'confirmed' && b.endDate > now),
    [all, now],
  );

  const comingUp = useMemo(
    () =>
      all
        .filter((b) => b.status === 'confirmed' && !isSameDay(b.startDate, now) && b.startDate > now)
        .slice(0, 3),
    [all, now],
  );

  const revenue = active
    .filter((b) => b.status !== 'no-show')
    .reduce((sum, b) => sum + b.service.price, 0);
  const bookedHours = active.reduce((sum, b) => sum + b.service.duration, 0) / 60;
  const freeHours = Math.max(0, CLOSE_HOUR - OPEN_HOUR - bookedHours);
  const remaining = today.filter((b) => b.status === 'confirmed' && b.endDate > now).length;

  return (
    <View className="flex-1">
      <Aurora />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}>
        <Animated.View entering={FadeIn.duration(600)} className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm font-medium text-mist-muted">{greeting(now)} 👋</Text>
            <Text className="mt-1 text-[30px] font-black tracking-tight text-mist">{formatDayLong(now)}</Text>
          </View>
          <PressableScale onPress={() => router.push('/insights')}>
            <LinearGradient
              colors={brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-12 w-12 items-center justify-center rounded-2xl">
              <Text className="text-xl font-black text-white">B</Text>
            </LinearGradient>
          </PressableScale>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(200)} className="mt-2 text-[15px] text-mist-muted">
          {remaining > 0
            ? `You have ${remaining} appointment${remaining === 1 ? '' : 's'} left today.`
            : today.length > 0
              ? 'All wrapped up for today. Nice work ✨'
              : 'A clear day. Time to fill it up?'}
        </Animated.Text>

        <View className="mt-6 flex-row gap-3">
          <StatTile label="Bookings" value={active.length} icon="calendar-outline" delay={100} />
          <StatTile label="Expected" value={revenue} format={money} icon="wallet-outline" delay={180} />
          <StatTile label="Free hrs" value={freeHours} format={(n) => n.toFixed(1)} icon="leaf-outline" delay={260} />
        </View>

        <View className="mt-6">
          {upNext ? (
            <UpNextCard booking={upNext} now={now} />
          ) : (
            <Animated.View
              entering={FadeInDown.delay(150)}
              className="items-center rounded-4xl border border-dashed border-white/10 p-6">
              <Text className="text-3xl">🌙</Text>
              <Text className="mt-2 font-bold text-mist">Nothing on the horizon</Text>
              <Text className="mt-1 text-center text-sm text-mist-muted">
                Tap the + button to book your next client.
              </Text>
            </Animated.View>
          )}
        </View>

        <SectionHeader
          title="Today's schedule"
          right={
            today.some((b) => b.status === 'confirmed') ? (
              <Text className="text-xs text-mist-faint">Swipe → done · ← cancel</Text>
            ) : null
          }
        />
        {today.length === 0 ? (
          <EmptyState emoji="🪴" title="No bookings today" subtitle="Enjoy the calm, or add one from the + button." />
        ) : (
          today.map((b, i) => <BookingCard key={b.id} booking={b} index={i} />)
        )}

        {comingUp.length > 0 && (
          <>
            <SectionHeader
              title="Coming up"
              right={
                <PressableScale onPress={() => router.push('/calendar')}>
                  <Text className="text-sm font-semibold text-violet">See calendar</Text>
                </PressableScale>
              }
            />
            {comingUp.map((b, i) => (
              <BookingCard key={b.id} booking={b} index={i + today.length} showDate={relativeDay(b.startDate, now)} />
            ))}
          </>
        )}

        {upNext && upNext.startDate.getTime() - now.getTime() > 3 * HOUR && (
          <Text className="mt-4 text-center text-xs text-mist-faint">
            Next client is more than 3 hours away. Plenty of time for a coffee ☕
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
