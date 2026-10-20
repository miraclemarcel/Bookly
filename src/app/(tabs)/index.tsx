import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AnimatedNumber } from '@/components/animated-number';
import { BookingCard } from '@/components/booking-card';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { SectionHeader } from '@/components/section-header';
import { UpNextCard } from '@/components/up-next-card';
import { useBookingViews, useNow } from '@/hooks/use-bookings';
import { HOUR, formatDayLong, greeting, isSameDay, relativeDay } from '@/lib/date';
import { money } from '@/lib/format';
import { CLOSE_HOUR, OPEN_HOUR } from '@/lib/schedule';
import { palette } from '@/lib/theme';

function StatTile({
  label,
  value,
  format,
  icon,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={{ flex: 1 }}>
      <View className="rounded-2xl border border-line bg-surface p-3.5">
        <Ionicons name={icon} size={18} color={palette.violet} />
        <AnimatedNumber
          value={value}
          format={format}
          numberOfLines={1}
          adjustsFontSizeToFit
          className="mt-2.5 text-xl font-bold text-ink"
        />
        <Text numberOfLines={1} className="mt-0.5 text-xs font-medium text-ink-muted">
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function TodayScreen() {
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
        .filter(
          (b) => b.status === 'confirmed' && !isSameDay(b.startDate, now) && b.startDate > now,
        )
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
    <View className="flex-1 bg-canvas">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 32,
          paddingHorizontal: 20,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-medium text-ink-muted">{greeting(now)}</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              className="mt-1 text-[28px] font-bold text-ink"
            >
              {formatDayLong(now)}
            </Text>
          </View>
          <PressableScale
            onPress={() => router.push('/insights')}
            className="h-11 w-11 items-center justify-center rounded-full bg-violet"
          >
            <Text className="text-lg font-bold text-white">B</Text>
          </PressableScale>
        </View>

        <Text className="mt-2 text-[15px] leading-5 text-ink-muted">
          {remaining > 0
            ? `You have ${remaining} appointment${remaining === 1 ? '' : 's'} left today.`
            : today.length > 0
              ? 'All wrapped up for today. Nice work.'
              : 'A clear day. Time to fill it up?'}
        </Text>

        <View className="mt-6 flex-row gap-3">
          <StatTile label="Bookings" value={active.length} icon="calendar-outline" />
          <StatTile label="Expected" value={revenue} format={money} icon="wallet-outline" />
          <StatTile
            label="Free hrs"
            value={freeHours}
            format={(n) => n.toFixed(1)}
            icon="leaf-outline"
          />
        </View>

        <View className="mt-6">
          {upNext ? (
            <UpNextCard booking={upNext} now={now} />
          ) : (
            <EmptyState
              icon="moon-outline"
              title="Nothing on the horizon"
              subtitle="Tap the + button to book your next client."
            />
          )}
        </View>

        <SectionHeader
          title="Today's schedule"
          right={
            today.some((b) => b.status === 'confirmed') ? (
              <Text className="text-xs text-ink-muted">Swipe → done · ← cancel</Text>
            ) : null
          }
        />
        {today.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No bookings today"
            subtitle="Enjoy the calm, or add one from the + button."
          />
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
              <BookingCard
                key={b.id}
                booking={b}
                index={i + today.length}
                showDate={relativeDay(b.startDate, now)}
              />
            ))}
          </>
        )}

        {upNext && upNext.startDate.getTime() - now.getTime() > 3 * HOUR && (
          <Text className="mt-4 text-center text-xs text-ink-muted">
            Next client is more than 3 hours away. Plenty of time for a coffee.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
