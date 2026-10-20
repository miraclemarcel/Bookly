import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedNumber } from '@/components/animated-number';
import { Avatar } from '@/components/avatar';
import { BookingCard } from '@/components/booking-card';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { useBookingViews } from '@/hooks/use-bookings';
import { monthShort, relativeDay } from '@/lib/date';
import { money } from '@/lib/format';
import { palette } from '@/lib/theme';
import { useBookingStore } from '@/store/booking-store';

function Stat({
  label,
  value,
  format,
  delay,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={{ flex: 1 }}>
      <View className="items-center rounded-2xl border border-line bg-surface px-2 py-4">
        <AnimatedNumber
          value={value}
          format={format}
          numberOfLines={1}
          adjustsFontSizeToFit
          className="text-xl font-bold text-ink"
        />
        <Text className="mt-0.5 text-xs font-medium text-ink-muted">{label}</Text>
      </View>
    </Animated.View>
  );
}

export default function ClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const client = useBookingStore((s) => s.clients.find((c) => c.id === id));
  const views = useBookingViews();

  const history = useMemo(() => views.filter((b) => b.clientId === id).reverse(), [views, id]);

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <EmptyState emoji="🫥" title="Client not found" />
      </View>
    );
  }

  const completed = history.filter((b) => b.status === 'completed');
  const spent = completed.reduce((s, b) => s + b.service.price, 0);
  const noShows = history.filter((b) => b.status === 'no-show').length;
  const favorite = (() => {
    const counts = new Map<string, number>();
    for (const b of completed) counts.set(b.service.name, (counts.get(b.service.name) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? completed.find((b) => b.service.name === top[0])!.service : undefined;
  })();
  const since = new Date(client.createdAt);

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 18 : 10,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
      >
        <PressableScale
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full border border-line"
        >
          <Ionicons name="chevron-down" size={22} color={palette.ink} />
        </PressableScale>

        <View className="mt-2 items-center">
          <Animated.View entering={FadeInDown.duration(300)} style={{ alignItems: 'center' }}>
            <Avatar name={client.name} size={88} />
            <Text className="mt-4 text-center text-[26px] font-bold text-ink">{client.name}</Text>
            <Text className="mt-1 text-sm text-ink-muted">
              Client since {monthShort(since)} {since.getFullYear()}
            </Text>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.delay(80).duration(300)}
            style={{
              marginTop: 12,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {client.phone ? (
              <View className="flex-row items-center rounded-full bg-surface-2 px-3 py-1.5">
                <Ionicons name="call-outline" size={13} color={palette.inkMuted} />
                <Text className="ml-1.5 text-[13px] text-ink">{client.phone}</Text>
              </View>
            ) : null}
            {client.email ? (
              <View className="flex-row items-center rounded-full bg-surface-2 px-3 py-1.5">
                <Ionicons name="mail-outline" size={13} color={palette.inkMuted} />
                <Text className="ml-1.5 text-[13px] text-ink">{client.email}</Text>
              </View>
            ) : null}
          </Animated.View>
        </View>

        <View className="mt-6 flex-row gap-3">
          <Stat label="Visits" value={completed.length} delay={120} />
          <Stat label="Spent" value={spent} format={money} delay={160} />
          <Stat label="No-shows" value={noShows} delay={200} />
        </View>

        {favorite && (
          <Animated.View entering={FadeInDown.delay(240).duration(300)}>
            <View
              className="mt-3 flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: favorite.colors[0] + '1F' }}
            >
              <Text style={{ fontSize: 28, lineHeight: 36 }}>{favorite.emoji}</Text>
              <View className="ml-3 flex-1">
                <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Usual order
                </Text>
                <Text className="mt-0.5 text-base font-bold text-ink">{favorite.name}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(280).duration(300)} style={{ marginTop: 16 }}>
          <PressableScale
            onPress={() =>
              router.push({ pathname: '/booking/new', params: { clientId: client.id } })
            }
            className="h-14 flex-row items-center justify-center rounded-xl bg-violet"
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text className="ml-2 text-base font-bold text-white">
              Book {client.name.split(' ')[0]}
            </Text>
          </PressableScale>
        </Animated.View>

        <Text className="mb-3 mt-8 text-lg font-bold text-ink">History</Text>
        {history.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="No visits yet"
            subtitle="Their story starts with the first booking."
          />
        ) : (
          history.map((b, i) => (
            <BookingCard key={b.id} booking={b} index={i} showDate={relativeDay(b.startDate)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
