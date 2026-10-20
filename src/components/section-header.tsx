import { Text, View } from 'react-native';

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-7 flex-row items-end justify-between">
      <Text className="text-lg font-extrabold tracking-tight text-ink">{title}</Text>
      {right}
    </View>
  );
}
