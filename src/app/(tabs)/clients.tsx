import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aurora } from '@/components/aurora';
import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { SegmentedControl } from '@/components/segmented-control';
import { useBookingViews } from '@/hooks/use-bookings';
import { relativeDay } from '@/lib/date';
import { money } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { palette } from '@/lib/theme';
import { useBookingStore } from '@/store/booking-store';

type Sort = 'recent' | 'spend' | 'az';

function SearchField({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) {
  const focus = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.get(), [0, 1], ['rgba(255,255,255,0.06)', palette.violet]),
    transform: [{ scale: 1 + focus.get() * 0.01 }],
  }));
  return (
    <Animated.View style={style} className="flex-row items-center rounded-2xl border bg-ink-800 px-4">
      <Ionicons name="search" size={18} color={palette.faint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search clients"
        placeholderTextColor={palette.faint}
        onFocus={() => focus.set(withTiming(1, { duration: 200 }))}
        onBlur={() => focus.set(withTiming(0, { duration: 200 }))}
        className="ml-3 flex-1 py-3.5 text-[15px] text-mist"
      />
      {value.length > 0 && (
        <PressableScale onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={palette.faint} />
        </PressableScale>
      )}
    </Animated.View>
  );
}

function NewClientForm({ onDone }: { onDone: () => void }) {
  const addClient = useBookingStore((s) => s.addClient);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const valid = name.trim().length > 1;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutUp.duration(200)}
      className="mt-4 rounded-3xl border border-violet/40 bg-ink-800 p-4">
      <Text className="mb-3 text-sm font-bold text-mist">New client</Text>
      <TextInput
        autoFocus
        value={name}
        onChangeText={setName}
        placeholder="Full name"
        placeholderTextColor={palette.faint}
        className="mb-2 rounded-xl bg-ink-700 px-4 py-3 text-mist"
      />
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone (optional)"
        keyboardType="phone-pad"
        placeholderTextColor={palette.faint}
        className="rounded-xl bg-ink-700 px-4 py-3 text-mist"
      />
      <PressableScale
        disabled={!valid}
        onPress={() => {
          addClient({ name: name.trim(), phone: phone.trim() || undefined });
          haptic.success();
          onDone();
        }}
        className={`mt-3 items-center rounded-xl py-3 ${valid ? 'bg-violet' : 'bg-ink-600'}`}>
        <Text className={`font-bold ${valid ? 'text-white' : 'text-mist-faint'}`}>Save client</Text>
      </PressableScale>
    </Animated.View>
  );
}

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const clients = useBookingStore((s) => s.clients);
  const views = useBookingViews();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const now = new Date();
    const stats = clients.map((c) => {
      const mine = views.filter((b) => b.clientId === c.id);
      const completed = mine.filter((b) => b.status === 'completed');
      const past = mine.filter((b) => b.startDate <= now && b.status !== 'cancelled');
      const next = mine.find((b) => b.status === 'confirmed' && b.startDate > now);
      return {
        client: c,
        visits: completed.length,
        spent: completed.reduce((s, b) => s + b.service.price, 0),
        last: past[past.length - 1]?.startDate,
        next: next?.startDate,
      };
    });
    const q = query.trim().toLowerCase();
    const filtered = q ? stats.filter((s) => s.client.name.toLowerCase().includes(q)) : stats;
    return filtered.sort((a, b) => {
      if (sort === 'az') return a.client.name.localeCompare(b.client.name);
      if (sort === 'spend') return b.spent - a.spent;
      return (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0);
    });
  }, [clients, views, query, sort]);

  return (
    <View className="flex-1">
      <Aurora intensity={0.6} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[30px] font-black tracking-tight text-mist">Clients</Text>
            <Text className="text-sm text-mist-muted">{clients.length} people who love your work</Text>
          </View>
          <PressableScale
            onPress={() => setAdding((a) => !a)}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-ink-700">
            <Ionicons name={adding ? 'close' : 'person-add'} size={20} color={palette.mist} />
          </PressableScale>
        </View>

        {adding && <NewClientForm onDone={() => setAdding(false)} />}

        <View className="mt-5">
          <SearchField value={query} onChangeText={setQuery} />
        </View>
        <View className="mt-3">
          <SegmentedControl
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: 'Recent' },
              { value: 'spend', label: 'Top spend' },
              { value: 'az', label: 'A–Z' },
            ]}
          />
        </View>

        <View className="mt-5">
          {rows.length === 0 ? (
            <EmptyState emoji="🔍" title="No one by that name" subtitle="Try a different search." />
          ) : (
            rows.map(({ client, visits, spent, last, next }, i) => (
              <Animated.View
                key={client.id}
                entering={FadeInDown.delay(Math.min(i, 10) * 45).springify().damping(16)}
                layout={LinearTransition.springify().damping(18)}
                className="mb-2.5">
                <PressableScale
                  onPress={() => router.push({ pathname: '/client/[id]', params: { id: client.id } })}
                  className="flex-row items-center rounded-3xl border border-white/5 bg-ink-800/90 p-3.5">
                  <Avatar name={client.name} size={46} />
                  <View className="ml-3.5 flex-1">
                    <Text numberOfLines={1} className="text-[15px] font-bold text-mist">
                      {client.name}
                    </Text>
                    <Text numberOfLines={1} className="mt-0.5 text-xs text-mist-faint">
                      {visits} visit{visits === 1 ? '' : 's'}
                      {next
                        ? ` · next: ${relativeDay(next)}`
                        : last
                          ? ` · last: ${relativeDay(last)}`
                          : ' · new'}
                    </Text>
                  </View>
                  <Text className="mr-2 text-sm font-bold text-mist">{money(spent)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={palette.faint} />
                </PressableScale>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
