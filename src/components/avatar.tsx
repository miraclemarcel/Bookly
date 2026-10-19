import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';

import { avatarGradient, initials } from '@/lib/format';

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <LinearGradient
      colors={avatarGradient(name)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center">
      <Text className="font-bold text-white" style={{ fontSize: size * 0.36 }}>
        {initials(name)}
      </Text>
    </LinearGradient>
  );
}
