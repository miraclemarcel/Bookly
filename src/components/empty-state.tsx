import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function EmptyState({ emoji, title, subtitle, children }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View className="items-center rounded-2xl border border-line bg-surface px-6 py-10">
        <Text style={{ fontSize: 44, lineHeight: 54 }}>{emoji}</Text>
        <Text className="mt-3 text-center text-lg font-bold text-ink">{title}</Text>
        {subtitle ? (
          <Text className="mt-1.5 text-center text-sm leading-5 text-ink-muted">{subtitle}</Text>
        ) : null}
        {children ? <View className="mt-5">{children}</View> : null}
      </View>
    </Animated.View>
  );
}
