import { Text, View } from 'react-native';

import type { BookingStatus } from '@/types';

import { STATUS_META } from '@/lib/status';

export function StatusChip({ status, size = 'sm' }: { status: BookingStatus; size?: 'sm' | 'md' }) {
  const meta = STATUS_META[status];
  return (
    <View
      className={`flex-row items-center self-start rounded-full ${size === 'md' ? 'px-3 py-1.5' : 'px-2 py-1'}`}
      style={{ backgroundColor: meta.color + '1A' }}>
      <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      <Text className={`font-semibold ${size === 'md' ? 'text-sm' : 'text-xs'}`} style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
}
