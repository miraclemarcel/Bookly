import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedNumber } from '@/components/animated-number';
import { Aurora } from '@/components/aurora';
import { Avatar } from '@/components/avatar';
import { BookingCard } from '@/components/booking-card';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { useBookingViews } from '@/hooks/use-bookings';
import { monthShort, relativeDay } from '@/lib/date';
import { avatarGradient, money } from '@/lib/format';
import { brandGradient, palette } from '@/lib/theme';
import { useBookingStore } from '@/store/booking-store';

/** Avatar wrapped in a slowly spinning gradient halo */
function HaloAvatar({ name }: { name: string }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.set(withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false));
  }, [spin]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get()}deg` }] }));
  const colors = avatarGradient(name);
  return (
    <View className="h-[116px] w-[116px] items-center justify-center">
      <Animated.View style={style} className="absolute h-[116px] w-[116px]">
        <LinearGradient colors={[colors[0], 'transparent', colors[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1 rounded-full" />
      </Animated.View>
      <View className="h-[106px] w-[106px] items-center justify-center rounded-full bg-canvas">
        <Avatar name={name} size={96} />
      </View>
    </View>
  );
}

function Stat({ label, value, format, delay }: { label: string; value: number; format?: (n: number) => string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} className="flex-1 items-center rounded-3xl border border-line bg-surface py-4">
      <AnimatedNumber value={value} format={format} className="text-xl font-black text-ink" />
      <Text className="mt-0.5 text-[11px] text-ink-faint">{label}</Text>
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
      <Aurora intensity={0.7} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 18 : insets.top + 10, paddingBottom: insets.bottom + 32, paddingHorizontal: 20 }}>
        <PressableScale onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
          <Ionicons name="chevron-down" size={22} color={palette.ink} />
        </PressableScale>

        <View className="mt-2 items-center">
          <Animated.View entering={FadeInDown.springify().damping(12)}>
            <HaloAvatar name={client.name} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(80).springify()} className="mt-4 text-[28px] font-black tracking-tight text-ink">
            {client.name}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(120).springify()} className="mt-1 text-sm text-ink-muted">
            Client since {monthShort(since)} {since.getFullYear()}
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(160).springify()} className="mt-3 flex-row flex-wrap justify-center gap-2">
            {client.phone ? (
              <View className="flex-row items-center rounded-full bg-surface-2 px-3 py-1.5">
                <Ionicons name="call-outline" size={13} color={palette.inkMuted} />
                <Text className="ml-1.5 text-xs text-ink">{client.phone}</Text>
              </View>
            ) : null}
            {client.email ? (
              <View className="flex-row items-center rounded-full bg-surface-2 px-3 py-1.5">
                <Ionicons name="mail-outline" size={13} color={palette.inkMuted} />
                <Text className="ml-1.5 text-xs text-ink">{client.email}</Text>
              </View>
            ) : null}
          </Animated.View>
        </View>

        <View className="mt-6 flex-row gap-3">
          <Stat label="Visits" value={completed.length} delay={200} />
          <Stat label="Spent" value={spent} format={money} delay={260} />
          <Stat label="No-shows" value={noShows} delay={320} />
        </View>

        {favorite && (
          <Animated.View entering={FadeInDown.delay(380).springify()} className="mt-3 overflow-hidden rounded-3xl">
            <LinearGradient colors={favorite.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-row items-center p-4">
              <Text style={{ fontSize: 30 }}>{favorite.emoji}</Text>
              <View className="ml-3">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-white/75">Usual order</Text>
                <Text className="text-base font-black text-white">{favorite.name}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(420).springify()} className="mt-4">
          <PressableScale onPress={() => router.push({ pathname: '/booking/new', params: { clientId: client.id } })}>
            <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-14 flex-row items-center justify-center rounded-2xl">
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text className="ml-2 text-base font-black text-white">Book {client.name.split(' ')[0]}</Text>
            </LinearGradient>
          </PressableScale>
        </Animated.View>

        <Text className="mb-3 mt-8 text-lg font-extrabold tracking-tight text-ink">History</Text>
        {history.length === 0 ? (
          <EmptyState emoji="🌱" title="No visits yet" subtitle="Their story starts with the first booking." />
        ) : (
          history.map((b, i) => <BookingCard key={b.id} booking={b} index={i} showDate={relativeDay(b.startDate)} />)
        )}
      </ScrollView>
    </View>
  );
}
