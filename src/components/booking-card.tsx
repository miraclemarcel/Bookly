import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { BookingView } from '@/hooks/use-bookings';

import { formatDuration, formatTime } from '@/lib/date';
import { money } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { palette } from '@/lib/theme';
import { useBookingStore } from '@/store/booking-store';

import { StatusChip } from './status-chip';
import { ServiceIcon } from './service-icon';

const THRESHOLD = 90;

interface Props {
  booking: BookingView;
  index?: number;
  showDate?: string;
}

export function BookingCard({ booking, showDate }: Props) {
  const setStatus = useBookingStore((s) => s.setStatus);
  const swipeable = booking.status === 'confirmed';
  const inactive = booking.status === 'cancelled' || booking.status === 'no-show';

  const x = useSharedValue(0);
  const pressed = useSharedValue(0);
  const crossed = useSharedValue(0);

  const complete = () => {
    haptic.success();
    setStatus(booking.id, 'completed');
  };
  const cancel = () => {
    haptic.warn();
    setStatus(booking.id, 'cancelled');
  };
  const open = () => {
    haptic.tap();
    router.push({ pathname: '/booking/[id]', params: { id: booking.id } });
  };

  const pan = Gesture.Pan()
    .enabled(swipeable)
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      // Rubber-band past the threshold so it feels physical
      const t = e.translationX;
      const over = Math.abs(t) - THRESHOLD;
      x.set(over > 0 ? Math.sign(t) * (THRESHOLD + over * 0.35) : t);
      const zone = t > THRESHOLD ? 1 : t < -THRESHOLD ? -1 : 0;
      if (zone !== crossed.get()) {
        crossed.set(zone);
        if (zone !== 0) scheduleOnRN(haptic.soft);
      }
    })
    .onEnd(() => {
      const zone = crossed.get();
      crossed.set(0);
      if (zone !== 0) {
        x.set(withTiming(zone * 500, { duration: 220 }, () => x.set(withSpring(0))));
        scheduleOnRN(zone === 1 ? complete : cancel);
      } else {
        x.set(withSpring(0, { damping: 15, stiffness: 200 }));
      }
    });

  const tap = Gesture.Tap()
    .maxDuration(400)
    .onBegin(() => pressed.set(withTiming(1, { duration: 120 })))
    .onFinalize((_e, success) => {
      pressed.set(withSpring(0));
      if (success) scheduleOnRN(open);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { rotateZ: `${interpolate(x.get(), [-200, 0, 200], [-3, 0, 3])}deg` },
      { scale: 1 - pressed.get() * 0.02 },
    ],
  }));

  const leftAction = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, 40, THRESHOLD], [0, 0.6, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(
          x.get(),
          [0, THRESHOLD, THRESHOLD + 30],
          [0.6, 1, 1.25],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const rightAction = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-THRESHOLD, -40, 0], [1, 0.6, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(
          x.get(),
          [-THRESHOLD - 30, -THRESHOLD, 0],
          [1.25, 1, 0.6],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: x.get() > 0 ? 'rgba(4,120,87,0.12)' : 'rgba(220,38,38,0.10)',
    opacity: interpolate(Math.abs(x.get()), [0, 30], [0, 1], Extrapolation.CLAMP),
  }));

  const { service, client } = booking;

  return (
    // Plain View on purpose: entering/layout animations on list items misplace them on Android
    <View style={{ marginBottom: 12 }}>
      {swipeable && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
            },
            trackStyle,
          ]}
        >
          <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, leftAction]}>
            <Ionicons name="checkmark-circle" size={28} color={palette.mint} />
            <Text className="ml-2 font-bold text-mint">Done</Text>
          </Animated.View>
          <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, rightAction]}>
            <Text className="mr-2 font-bold text-coral">Cancel</Text>
            <Ionicons name="close-circle" size={28} color={palette.coral} />
          </Animated.View>
        </Animated.View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View style={cardStyle}>
          <View
            className={`flex-row rounded-2xl border border-line bg-canvas p-4 ${inactive ? 'opacity-60' : ''}`}
          >
            <View
              className="mr-3.5 w-1 self-stretch rounded-full"
              style={{ backgroundColor: service.colors[0] }}
            />
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  numberOfLines={1}
                  className={`flex-1 pr-3 text-base font-semibold text-ink ${booking.status === 'cancelled' ? 'line-through' : ''}`}
                >
                  {client.name}
                </Text>
                <Text className="text-base font-bold text-ink">
                  {service.price ? money(service.price) : 'Free'}
                </Text>
              </View>
              <View className="mt-1 flex-row items-center">
                <ServiceIcon service={service} size={15} bare />
                <Text numberOfLines={1} className="ml-1.5 flex-1 text-sm text-ink-muted">
                  {service.name}
                </Text>
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center pr-3">
                  <Ionicons name="time-outline" size={15} color={palette.inkMuted} />
                  <Text numberOfLines={1} className="ml-1.5 text-[13px] font-semibold text-ink">
                    {formatTime(booking.startDate)}
                    <Text className="font-normal text-ink-muted">
                      {'  ·  '}
                      {showDate ?? formatDuration(service.duration)}
                    </Text>
                  </Text>
                </View>
                <StatusChip status={booking.status} />
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
