import { Text, View } from 'react-native';

import { avatarColor, initials } from '@/lib/format';

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) }}
      className="items-center justify-center">
      <Text className="font-bold text-white" style={{ fontSize: size * 0.36 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
