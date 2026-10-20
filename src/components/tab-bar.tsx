import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/haptics';
import { palette } from '@/lib/theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, [IconName, IconName]> = {
  index: ['sunny-outline', 'sunny'],
  calendar: ['calendar-clear-outline', 'calendar-clear'],
  clients: ['people-outline', 'people'],
  insights: ['pulse-outline', 'pulse'],
};

function Fab() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New booking"
      onPress={() => {
        haptic.bump();
        router.push('/booking/new');
      }}
      className="h-12 w-12 items-center justify-center rounded-full bg-violet active:opacity-80">
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
  );
}

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  const tabs = state.routes.map((route, i) => {
    const focused = state.index === i;
    const [outline, solid] = ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
    const color = focused ? palette.violet : palette.inkFaint;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        className="flex-1 items-center justify-center py-2"
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptic.tap();
            navigation.navigate(route.name);
          }
        }}>
        <Ionicons name={focused ? solid : outline} size={24} color={color} />
        <Text className="mt-1 text-[11px] font-semibold" style={{ color }}>
          {descriptors[route.key].options.title ?? route.name}
        </Text>
      </Pressable>
    );
  });

  return (
    <View
      className="flex-row items-center border-t border-line bg-canvas px-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8), paddingTop: 6 }}>
      {tabs[0]}
      {tabs[1]}
      <View className="flex-1 items-center justify-center">
        <Fab />
      </View>
      {tabs[2]}
      {tabs[3]}
    </View>
  );
}
