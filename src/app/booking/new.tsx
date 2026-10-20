import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Booking, Service } from '@/types';

import { Avatar } from '@/components/avatar';
import { Confetti } from '@/components/confetti';
import { PressableScale } from '@/components/pressable-scale';
import { useServiceMap } from '@/hooks/use-bookings';
import {
  addDays,
  atTime,
  formatDayLong,
  formatDuration,
  formatTime,
  fromDayKey,
  isSameDay,
  monthShort,
  startOfDay,
  weekdayShort,
} from '@/lib/date';
import { money } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { daySlots } from '@/lib/schedule';
import { brandGradient, palette } from '@/lib/theme';
import { useBookingStore } from '@/store/booking-store';

type Step = 'service' | 'client' | 'when' | 'review';

const STEP_TITLES: Record<Step, [string, string]> = {
  service: ['What are we doing?', 'Pick a service'],
  client: ['Who’s coming in?', 'Choose or add a client'],
  when: ['When works?', 'Grey slots are already taken'],
  review: ['Looks good?', 'Double-check the details'],
};

function ProgressSegment({ filled }: { filled: boolean }) {
  const w = useSharedValue(filled ? 1 : 0);
  useEffect(() => {
    w.set(withSpring(filled ? 1 : 0, { damping: 18 }));
  }, [w, filled]);
  const style = useAnimatedStyle(() => ({ width: `${w.get() * 100}%` }));
  return (
    <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
      <Animated.View style={style} className="h-full overflow-hidden rounded-full">
        <LinearGradient colors={[palette.violet, palette.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="flex-1" />
      </Animated.View>
    </View>
  );
}

function ServiceStep({ services, value, onChange }: { services: Service[]; value?: string; onChange: (id: string) => void }) {
  return (
    <View className="flex-row flex-wrap justify-between">
      {services.map((s, i) => {
        const active = s.id === value;
        return (
          <Animated.View key={s.id} entering={FadeInDown.delay(i * 50).springify().damping(15)} className="mb-3 w-[48.5%]">
            <PressableScale onPress={() => onChange(s.id)} scaleTo={0.95}>
              <LinearGradient
                colors={active ? s.colors : [palette.line, palette.line]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-[2px]">
                <View className={`rounded-[22px] p-4 ${active ? 'bg-white/85' : 'bg-surface'}`} style={{ minHeight: 132 }}>
                  <View className="flex-row items-start justify-between">
                    <Text style={{ fontSize: 30 }}>{s.emoji}</Text>
                    {active && (
                      <Animated.View entering={ZoomIn.springify()} className="h-6 w-6 items-center justify-center rounded-full bg-ink">
                        <Ionicons name="checkmark" size={15} color={palette.canvas} />
                      </Animated.View>
                    )}
                  </View>
                  <Text className="mt-3 text-[15px] font-bold text-ink">{s.name}</Text>
                  <Text className="mt-1 text-xs text-ink-muted">
                    {formatDuration(s.duration)} · {s.price ? money(s.price) : 'Free'}
                  </Text>
                </View>
              </LinearGradient>
            </PressableScale>
          </Animated.View>
        );
      })}
    </View>
  );
}

function ClientStep({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  const clients = useBookingStore((s) => s.clients);
  const addClient = useBookingStore((s) => s.addClient);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  const canCreate = q.length > 1 && !clients.some((c) => c.name.toLowerCase() === q);

  return (
    <View>
      <View className="mb-3 flex-row items-center rounded-2xl border border-line bg-surface px-4">
        <Ionicons name="search" size={18} color={palette.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search or type a new name"
          placeholderTextColor={palette.inkFaint}
          className="ml-3 flex-1 py-3.5 text-[15px] text-ink"
        />
      </View>
      {canCreate && (
        <Animated.View entering={FadeInDown.springify()}>
          <PressableScale
            onPress={() => {
              const c = addClient({ name: query.trim().replace(/\b\w/g, (m) => m.toUpperCase()) });
              haptic.success();
              setQuery('');
              onChange(c.id);
            }}
            className="mb-3 flex-row items-center rounded-2xl border border-dashed border-violet/60 bg-violet/10 p-3.5">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-violet">
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <Text className="ml-3 flex-1 font-semibold text-ink">
              Add “{query.trim()}” as a new client
            </Text>
          </PressableScale>
        </Animated.View>
      )}
      {sorted.map((c, i) => {
        const active = c.id === value;
        return (
          <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i, 10) * 35).springify().damping(16)}>
            <PressableScale
              onPress={() => onChange(c.id)}
              className={`mb-2 flex-row items-center rounded-2xl border p-3 ${active ? 'border-pink bg-pink/10' : 'border-line bg-surface'}`}>
              <Avatar name={c.name} size={40} />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-ink">{c.name}</Text>
                {c.phone ? <Text className="text-xs text-ink-faint">{c.phone}</Text> : null}
              </View>
              <View className={`h-6 w-6 items-center justify-center rounded-full border-2 ${active ? 'border-pink bg-pink' : 'border-line-strong'}`}>
                {active && (
                  <Animated.View entering={ZoomIn}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </Animated.View>
                )}
              </View>
            </PressableScale>
          </Animated.View>
        );
      })}
    </View>
  );
}

function WhenStep({
  day,
  onDay,
  time,
  onTime,
  duration,
  ignoreId,
}: {
  day: Date;
  onDay: (d: Date) => void;
  time?: string;
  onTime: (t: string) => void;
  duration: number;
  ignoreId?: string;
}) {
  const bookings = useBookingStore((s) => s.bookings);
  const services = useServiceMap();
  const today = startOfDay(new Date());
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));
  const slots = daySlots(day, duration, bookings, services, ignoreId);
  const closed = day.getDay() === 0;
  const groups = [
    { label: 'Morning', icon: 'partly-sunny-outline' as const, slots: slots.filter((s) => s.date.getHours() < 12) },
    { label: 'Afternoon', icon: 'sunny-outline' as const, slots: slots.filter((s) => s.date.getHours() >= 12 && s.date.getHours() < 17) },
    { label: 'Evening', icon: 'moon-outline' as const, slots: slots.filter((s) => s.date.getHours() >= 17) },
  ];
  const openCount = slots.filter((s) => s.available).length;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {days.map((d) => {
          const active = isSameDay(d, day);
          const sunday = d.getDay() === 0;
          return (
            <PressableScale key={d.toISOString()} disabled={sunday} onPress={() => onDay(d)} scaleTo={0.92}>
              {active ? (
                <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="w-[58px] items-center rounded-2xl py-3">
                  <Text className="text-[11px] font-semibold uppercase text-white/85">{weekdayShort(d)}</Text>
                  <Text className="mt-0.5 text-xl font-black text-white">{d.getDate()}</Text>
                  <Text className="text-[10px] text-white/75">{monthShort(d)}</Text>
                </LinearGradient>
              ) : (
                <View className={`w-[58px] items-center rounded-2xl border border-line bg-surface py-3 ${sunday ? 'opacity-35' : ''}`}>
                  <Text className="text-[11px] font-semibold uppercase text-ink-faint">{weekdayShort(d)}</Text>
                  <Text className="mt-0.5 text-xl font-black text-ink">{d.getDate()}</Text>
                  <Text className="text-[10px] text-ink-faint">{sunday ? 'Closed' : monthShort(d)}</Text>
                </View>
              )}
            </PressableScale>
          );
        })}
      </ScrollView>

      {closed ? (
        <Animated.View entering={FadeIn} className="mt-10 items-center">
          <Text className="text-4xl">🏖️</Text>
          <Text className="mt-2 font-bold text-ink">Closed on Sundays</Text>
        </Animated.View>
      ) : (
        <Animated.View key={day.toDateString()} entering={FadeIn.duration(250)}>
          <Text className="mt-5 text-xs text-ink-faint">
            {openCount} open slot{openCount === 1 ? '' : 's'} for a {formatDuration(duration)} appointment
          </Text>
          {groups.map((g) => (
            <View key={g.label} className="mt-4">
              <View className="mb-2 flex-row items-center">
                <Ionicons name={g.icon} size={14} color={palette.inkMuted} />
                <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">{g.label}</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {g.slots.map((s) => {
                  const active = s.time === time && s.available;
                  return (
                    <PressableScale
                      key={s.time}
                      disabled={!s.available}
                      onPress={() => onTime(s.time)}
                      scaleTo={0.9}
                      className={`w-[23.3%] items-center rounded-xl py-2.5 ${
                        active ? 'bg-pink' : s.available ? 'border border-line bg-surface' : 'bg-surface/50'
                      }`}>
                      <Text
                        className={`text-[13px] font-bold ${
                          active ? 'text-white' : s.available ? 'text-ink' : 'text-ink-faint/60 line-through'
                        }`}>
                        {formatTime(s.date).replace(' ', '').toLowerCase()}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function TicketRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View className="flex-row items-center py-2">
      <Ionicons name={icon} size={16} color={palette.inkFaint} />
      <Text className="ml-3 flex-1 text-sm text-ink-muted">{label}</Text>
      <Text className="text-sm font-bold text-ink">{value}</Text>
    </View>
  );
}

function ReviewStep({
  service,
  clientName,
  start,
  notes,
  onNotes,
}: {
  service: Service;
  clientName: string;
  start: Date;
  notes: string;
  onNotes: (t: string) => void;
}) {
  const end = new Date(start.getTime() + service.duration * 60_000);
  return (
    <View>
      <Animated.View entering={FadeInDown.springify().damping(14)} className="overflow-hidden rounded-4xl bg-surface">
        <LinearGradient colors={service.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-5">
          <Text style={{ fontSize: 38 }}>{service.emoji}</Text>
          <Text className="mt-2 text-2xl font-black text-white">{service.name}</Text>
          <Text className="text-sm text-white/80">with {clientName}</Text>
        </LinearGradient>
        {/* Ticket perforation */}
        <View className="h-6 flex-row items-center">
          <View className="-ml-3 h-6 w-6 rounded-full bg-canvas" />
          <View className="mx-2 flex-1 border-t-2 border-dashed border-line-strong" />
          <View className="-mr-3 h-6 w-6 rounded-full bg-canvas" />
        </View>
        <View className="px-5 pb-4">
          <TicketRow icon="calendar-outline" label="Date" value={formatDayLong(start)} />
          <TicketRow icon="time-outline" label="Time" value={`${formatTime(start)} – ${formatTime(end)}`} />
          <TicketRow icon="hourglass-outline" label="Duration" value={formatDuration(service.duration)} />
          <TicketRow icon="pricetag-outline" label="Price" value={service.price ? money(service.price) : 'Free'} />
        </View>
      </Animated.View>
      <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-ink-muted">Notes</Text>
      <TextInput
        value={notes}
        onChangeText={onNotes}
        multiline
        placeholder="Anything to remember? (optional)"
        placeholderTextColor={palette.inkFaint}
        className="min-h-[96px] rounded-2xl border border-line bg-surface p-4 text-[15px] text-ink"
        style={{ textAlignVertical: 'top' }}
      />
    </View>
  );
}

function Success({ booking, service, clientName, rescheduled }: { booking: Booking; service: Service; clientName: string; rescheduled: boolean }) {
  const start = new Date(booking.start);
  return (
    <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill} className="items-center justify-center bg-white/95 px-8">
      <Confetti />
      <Animated.View entering={ZoomIn.springify().damping(9).delay(80)}>
        <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="h-28 w-28 items-center justify-center rounded-full">
          <Ionicons name="checkmark" size={60} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(250).springify()} className="mt-7 text-3xl font-black text-ink">
        {rescheduled ? 'Rescheduled!' : 'You’re booked!'}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(330).springify()} className="mt-2 text-center text-[15px] text-ink-muted">
        {service.emoji} {service.name} with {clientName}
        {'\n'}
        {formatDayLong(start)} at {formatTime(start)}
      </Animated.Text>
      <Animated.View entering={FadeInDown.delay(450).springify()} className="mt-10 w-full gap-3">
        <PressableScale onPress={() => router.back()} className="items-center rounded-2xl bg-ink py-4">
          <Text className="font-black text-white">Done</Text>
        </PressableScale>
        <PressableScale
          onPress={() => router.replace({ pathname: '/booking/[id]', params: { id: booking.id } })}
          className="items-center rounded-2xl py-3">
          <Text className="font-semibold text-ink-muted">View booking</Text>
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

export default function NewBookingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string; time?: string; clientId?: string; rescheduleId?: string }>();
  const services = useBookingStore((s) => s.services);
  const clients = useBookingStore((s) => s.clients);
  const allBookings = useBookingStore((s) => s.bookings);
  const addBooking = useBookingStore((s) => s.addBooking);
  const reschedule = useBookingStore((s) => s.reschedule);
  const serviceMap = useServiceMap();

  const original = useMemo(
    () => allBookings.find((b) => b.id === params.rescheduleId),
    // Only look it up once, so the flow doesn't shift after we save
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.rescheduleId],
  );
  const steps: Step[] = original ? ['when', 'review'] : ['service', 'client', 'when', 'review'];

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [serviceId, setServiceId] = useState(original?.serviceId);
  const [clientId, setClientId] = useState(original?.clientId ?? params.clientId);
  const [day, setDay] = useState(() =>
    params.date ? fromDayKey(params.date) : startOfDay(original ? new Date(original.start) : new Date()),
  );
  const [time, setTime] = useState<string | undefined>(params.time);
  const [notes, setNotes] = useState(original?.notes ?? '');
  const [saved, setSaved] = useState<Booking | null>(null);

  const step = steps[stepIndex];
  const service = serviceId ? serviceMap[serviceId] : undefined;
  const client = clients.find((c) => c.id === clientId);
  const duration = service?.duration ?? 60;

  const timeValid =
    !!time && daySlots(day, duration, allBookings, serviceMap, original?.id).some((s) => s.time === time && s.available);

  const canContinue =
    step === 'service' ? !!service : step === 'client' ? !!client : step === 'when' ? timeValid : true;

  const go = (delta: 1 | -1) => {
    setDirection(delta);
    setStepIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
  };

  const submit = () => {
    if (!service || !client || !time) return;
    const start = atTime(day, time).toISOString();
    haptic.success();
    if (original) {
      reschedule(original.id, start);
      setSaved({ ...original, start });
    } else {
      setSaved(addBooking({ serviceId: service.id, clientId: client.id, start, notes: notes.trim() || undefined }));
    }
  };

  const [title, subtitle] = STEP_TITLES[step];
  const entering = (direction > 0 ? SlideInRight : SlideInLeft).springify().damping(20).mass(0.8);
  const exiting = (direction > 0 ? SlideOutLeft : SlideOutRight).duration(220);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-canvas">
      <View style={{ paddingTop: Platform.OS === 'ios' ? 18 : insets.top + 10 }} className="px-5">
        <View className="flex-row items-center justify-between">
          <PressableScale onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
            <Ionicons name="close" size={20} color={palette.ink} />
          </PressableScale>
          <Text className="text-xs font-bold uppercase tracking-[2px] text-ink-faint">
            {original ? 'Reschedule' : 'New booking'} · {stepIndex + 1}/{steps.length}
          </Text>
          <View className="w-10" />
        </View>
        <View className="mt-5 flex-row gap-1.5">
          {steps.map((s, i) => (
            <ProgressSegment key={s} filled={i <= stepIndex} />
          ))}
        </View>
        <Animated.View key={`t-${step}`} entering={FadeInDown.springify().damping(16)} className="mt-6">
          <Text className="text-[28px] font-black tracking-tight text-ink">{title}</Text>
          <Text className="mt-1 text-sm text-ink-muted">{subtitle}</Text>
        </Animated.View>
      </View>

      <View className="mt-5 flex-1 overflow-hidden">
        <Animated.View key={step} entering={entering} exiting={exiting} style={StyleSheet.absoluteFill}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
            {step === 'service' && <ServiceStep services={services} value={serviceId} onChange={setServiceId} />}
            {step === 'client' && <ClientStep value={clientId} onChange={setClientId} />}
            {step === 'when' && (
              <WhenStep
                day={day}
                onDay={(d) => {
                  setDay(d);
                  setTime(undefined);
                }}
                time={time}
                onTime={setTime}
                duration={duration}
                ignoreId={original?.id}
              />
            )}
            {step === 'review' && service && client && time && (
              <ReviewStep service={service} clientName={client.name} start={atTime(day, time)} notes={notes} onNotes={setNotes} />
            )}
          </ScrollView>
        </Animated.View>
      </View>

      <View className="flex-row gap-3 border-t border-line px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {stepIndex > 0 && (
          <PressableScale onPress={() => go(-1)} className="h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
            <Ionicons name="arrow-back" size={22} color={palette.ink} />
          </PressableScale>
        )}
        <PressableScale
          disabled={!canContinue}
          className="flex-1"
          onPress={() => (step === 'review' ? submit() : go(1))}>
          <LinearGradient
            colors={canContinue ? brandGradient : [palette.surface3, palette.surface3, palette.surface3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-14 flex-row items-center justify-center rounded-2xl">
            <Text className={`text-base font-black ${canContinue ? 'text-white' : 'text-ink-faint'}`}>
              {step === 'review' ? (original ? 'Confirm new time' : 'Confirm booking') : 'Continue'}
            </Text>
            <Ionicons
              name={step === 'review' ? 'sparkles' : 'arrow-forward'}
              size={18}
              color={canContinue ? '#fff' : palette.inkFaint}
              style={{ marginLeft: 8 }}
            />
          </LinearGradient>
        </PressableScale>
      </View>

      {saved && service && client && (
        <Success booking={saved} service={service} clientName={client.name} rescheduled={!!original} />
      )}
    </KeyboardAvoidingView>
  );
}
