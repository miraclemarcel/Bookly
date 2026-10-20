import { Text, View } from 'react-native';

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-8 flex-row items-center justify-between">
      <Text className="text-lg font-bold text-ink">{title}</Text>
      {right}
    </View>
  );
}
