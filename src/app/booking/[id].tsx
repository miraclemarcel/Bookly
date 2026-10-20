import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BookingStatus } from '@/types';

import { Avatar } from '@/components/avatar';
import { Confetti } from '@/components/confetti';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { StatusChip } from '@/components/status-chip';
import { useBookingView } from '@/hooks/use-bookings';
import { formatDayLong, formatDuration, formatTime, relativeDay } from '@/lib/date';
import { money } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { palette } from '@/lib/theme';
import { useBookingStore } from '@/store/booking-store';

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View className="flex-row items-center border-b border-line py-3.5 last:border-b-0">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-2">
        <Ionicons name={icon} size={17} color={palette.inkMuted} />
      </View>
      <Text className="ml-3 flex-1 text-sm text-ink-muted">{label}</Text>
      <Text className="text-sm font-bold text-ink">{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} className="flex-1 items-center rounded-2xl py-4" style={{ backgroundColor: color + '1F' }}>
      <Ionicons name={icon} size={22} color={color} />
      <Text className="mt-1.5 text-xs font-bold" style={{ color }}>
        {label}
      </Text>
    </PressableScale>
  );
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const booking = useBookingView(id);
  const setStatus = useBookingStore((s) => s.setStatus);
  const removeBooking = useBookingStore((s) => s.removeBooking);
  const [burst, setBurst] = useState(0);

  const float = useSharedValue(0);
  useEffect(() => {
    float.set(withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [float]);
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -12 * float.get() }, { rotate: `${-8 + 16 * float.get()}deg` }],
  }));

  if (!booking) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <EmptyState emoji="👻" title="Booking not found" subtitle="It may have been deleted.">
          <PressableScale onPress={() => router.back()} className="rounded-full bg-surface-2 px-5 py-3">
            <Text className="font-bold text-ink">Go back</Text>
          </PressableScale>
        </EmptyState>
      </View>
    );
  }

  const { service, client } = booking;

  const update = (status: BookingStatus) => {
    setStatus(booking.id, status);
    if (status === 'completed') {
      haptic.success();
      setBurst((b) => b + 1);
    } else {
      haptic.bump();
    }
  };

  const confirmDelete = () =>
    Alert.alert('Delete booking?', `This removes ${client.name}'s ${service.name} for good.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptic.warn();
          router.back();
          // Let the modal close before the data disappears
          setTimeout(() => removeBooking(booking.id), 300);
        },
      },
    ]);

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <LinearGradient
          colors={service.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="overflow-hidden px-5 pb-8"
          style={{ paddingTop: Platform.OS === 'ios' ? 18 : insets.top + 10 }}>
          <Animated.Text
            style={[{ position: 'absolute', right: 10, top: 40, fontSize: 130, opacity: 0.25 }, emojiStyle]}>
            {service.emoji}
          </Animated.Text>
          <View className="flex-row items-center justify-between">
            <PressableScale onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/20">
              <Ionicons name="chevron-down" size={22} color="#fff" />
            </PressableScale>
            <View className="rounded-full bg-black/25 px-1 py-0.5">
              <StatusChip status={booking.status} size="md" />
            </View>
          </View>
          <Animated.View entering={FadeInDown.delay(80).springify()} className="mt-10">
            <Text className="text-sm font-bold uppercase tracking-[2px] text-white/75">
              {relativeDay(booking.startDate)} · {formatTime(booking.startDate)}
            </Text>
            <Text className="mt-2 text-[34px] font-black leading-tight tracking-tight text-white">{service.name}</Text>
          </Animated.View>
        </LinearGradient>

        <View className="-mt-5 rounded-t-4xl bg-canvas px-5 pt-6">
          <Animated.View entering={FadeInDown.delay(140).springify()}>
            <PressableScale
              onPress={() => router.push({ pathname: '/client/[id]', params: { id: client.id } })}
              className="flex-row items-center rounded-3xl border border-line bg-surface p-4">
              <Avatar name={client.name} size={52} />
              <View className="ml-3.5 flex-1">
                <Text className="text-lg font-bold text-ink">{client.name}</Text>
                <Text className="text-xs text-ink-faint">{client.phone ?? client.email ?? 'No contact info'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
            </PressableScale>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-4 rounded-3xl border border-line bg-surface px-4">
            <InfoRow icon="calendar-outline" label="Date" value={formatDayLong(booking.startDate)} />
            <InfoRow icon="time-outline" label="Time" value={`${formatTime(booking.startDate)} – ${formatTime(booking.endDate)}`} />
            <InfoRow icon="hourglass-outline" label="Duration" value={formatDuration(service.duration)} />
            <InfoRow icon="pricetag-outline" label="Price" value={service.price ? money(service.price) : 'Free'} />
          </Animated.View>

          {booking.notes ? (
            <Animated.View entering={FadeInDown.delay(260).springify()} className="mt-4 rounded-3xl border border-amber/20 bg-amber/10 p-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-amber">Note</Text>
              <Text className="mt-1.5 text-[15px] leading-5 text-ink">{booking.notes}</Text>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(320).springify()} className="mt-6">
            <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-muted">Actions</Text>
            {booking.status === 'confirmed' ? (
              <View className="gap-3">
                <View className="flex-row gap-3">
                  <ActionButton icon="checkmark-circle" label="Complete" color={palette.mint} onPress={() => update('completed')} />
                  <ActionButton icon="eye-off" label="No-show" color={palette.amber} onPress={() => update('no-show')} />
                  <ActionButton icon="close-circle" label="Cancel" color={palette.coral} onPress={() => update('cancelled')} />
                </View>
                <PressableScale
                  onPress={() => router.push({ pathname: '/booking/new', params: { rescheduleId: booking.id } })}
                  className="flex-row items-center justify-center rounded-2xl bg-surface-2 py-4">
                  <Ionicons name="swap-horizontal" size={18} color={palette.ink} />
                  <Text className="ml-2 font-bold text-ink">Reschedule</Text>
                </PressableScale>
              </View>
            ) : (
              <Animated.View entering={FadeIn} className="flex-row gap-3">
                <ActionButton icon="arrow-undo" label="Restore" color={palette.sky} onPress={() => update('confirmed')} />
                <ActionButton
                  icon="repeat"
                  label="Book again"
                  color={palette.violet}
                  onPress={() => router.push({ pathname: '/booking/new', params: { clientId: client.id } })}
                />
              </Animated.View>
            )}
          </Animated.View>

          <PressableScale onPress={confirmDelete} className="mt-6 flex-row items-center justify-center py-3">
            <Ionicons name="trash-outline" size={16} color={palette.coral} />
            <Text className="ml-2 font-semibold text-coral">Delete booking</Text>
          </PressableScale>
        </View>
      </ScrollView>
      {burst > 0 && <Confetti key={burst} burstKey={burst} />}
    </View>
  );
}
