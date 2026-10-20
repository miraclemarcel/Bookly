import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { palette } from '@/lib/theme';

import type { IconName } from './service-icon';

interface Props {
  icon: IconName;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, children }: Props) {
  return (
    <View>
      <View className="items-center rounded-2xl border border-line bg-surface px-6 py-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-violet/10">
          <Ionicons name={icon} size={30} color={palette.violet} />
        </View>
        <Text className="mt-4 text-center text-lg font-bold text-ink">{title}</Text>
        {subtitle ? (
          <Text className="mt-1.5 text-center text-sm leading-5 text-ink-muted">{subtitle}</Text>
        ) : null}
        {children ? <View className="mt-5">{children}</View> : null}
      </View>
    </View>
  );
}
