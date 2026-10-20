import { Pressable, Text, View } from 'react-native';

import { haptic } from '@/lib/haptics';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Pill tabs; the active option sits on a white chip */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row rounded-xl bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            className={`flex-1 items-center rounded-lg py-2 ${active ? 'bg-canvas' : ''}`}
            style={
              active
                ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }
                : undefined
            }
            onPress={() => {
              if (!active) haptic.tap();
              onChange(o.value);
            }}>
            <Text numberOfLines={1} className={`text-sm font-semibold ${active ? 'text-ink' : 'text-ink-muted'}`}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
