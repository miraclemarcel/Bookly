import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/haptics';
import { brand, brandGradient, palette } from '@/lib/theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, [IconName, IconName]> = {
  index: ['sunny-outline', 'sunny'],
  calendar: ['calendar-clear-outline', 'calendar-clear'],
  clients: ['people-outline', 'people'],
  insights: ['pulse-outline', 'pulse'],
};

/** Slot positions in a 5-wide row; slot 2 is reserved for the FAB */
const SLOTS = [0, 1, 3, 4];

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (focused) {
      scale.set(withSequence(withSpring(1.28, { damping: 6, stiffness: 400 }), withSpring(1)));
    }
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const [outline, solid] = ICONS[name] ?? ['ellipse-outline', 'ellipse'];
  return (
    <Animated.View style={style}>
      <Ionicons name={focused ? solid : outline} size={23} color={focused ? palette.ink : palette.inkFaint} />
    </Animated.View>
  );
}

function Fab() {
  const rotate = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false));
  }, [pulse]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.get()}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.get()),
    transform: [{ scale: 1 + pulse.get() * 0.55 }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New booking"
      onPress={() => {
        haptic.bump();
        rotate.set(withSequence(withTiming(135, { duration: 220 }), withSpring(0, { damping: 10 })));
        router.push('/booking/new');
      }}
      className="-mt-8 items-center justify-center">
      <Animated.View
        className="absolute h-16 w-16 rounded-full"
        style={[{ backgroundColor: brand.pink }, glowStyle]}
      />
      <LinearGradient
        colors={brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{
          shadowColor: palette.pink,
          shadowOpacity: 0.45,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
        }}>
        <Animated.View style={iconStyle}>
          <Ionicons name="add" size={32} color="#fff" />
        </Animated.View>
      </LinearGradient>
    </Pressable>
  );
}

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const slot = width / 5;
  const x = useSharedValue(0);

  const activeSlot = SLOTS[state.index] ?? 0;
  useEffect(() => {
    x.set(withSpring(activeSlot * slot, { damping: 16, stiffness: 180, mass: 0.8 }));
  }, [x, activeSlot, slot]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  const tabs = state.routes.map((route, i) => {
    const focused = state.index === i;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        className="h-full flex-1 items-center justify-center"
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptic.tap();
            navigation.navigate(route.name);
          }
        }}>
        <TabIcon name={route.name} focused={focused} />
      </Pressable>
    );
  });

  const Background = Platform.OS === 'ios' ? BlurView : View;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 px-5"
      style={{ bottom: Math.max(insets.bottom, 12) }}>
      <Background
        {...(Platform.OS === 'ios' ? { intensity: 50, tint: 'light' as const } : {})}
        className="h-[68px] overflow-visible rounded-full border border-line"
        style={{
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.98)',
          shadowColor: '#2A1B5C',
          shadowOpacity: 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 14,
        }}>
        <View className="h-full flex-row items-center" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 && (
            <Animated.View
              className="absolute items-center justify-center"
              style={[{ width: slot, height: '100%' }, indicatorStyle]}>
              <View className="h-11 w-11 rounded-full bg-violet/10" />
              <View className="absolute bottom-2 h-1 w-1 rounded-full" style={{ backgroundColor: palette.pink }} />
            </Animated.View>
          )}
          {tabs[0]}
          {tabs[1]}
          <View className="h-full flex-1 items-center justify-center">
            <Fab />
          </View>
          {tabs[2]}
          {tabs[3]}
        </View>
      </Background>
    </View>
  );
}
