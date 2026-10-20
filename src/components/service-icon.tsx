import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import type { Service } from '@/types';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, IconName> = {
  'svc-cut': 'cut-outline',
  'svc-color': 'color-palette-outline',
  'svc-beard': 'man-outline',
  'svc-spa': 'leaf-outline',
  'svc-style': 'sparkles-outline',
  'svc-consult': 'chatbubbles-outline',
};

/** Icon for a service, keyed by its id so it also works for services saved before icons existed */
export function serviceIconName(service: Pick<Service, 'id'>): IconName {
  return ICONS[service.id] ?? 'bookmark-outline';
}

interface Props {
  service: Pick<Service, 'id' | 'colors'>;
  /** Size of the tinted tile; the glyph scales with it */
  size?: number;
  /** Draw the glyph on its own, without the tinted tile */
  bare?: boolean;
  color?: string;
}

export function ServiceIcon({ service, size = 40, bare = false, color }: Props) {
  const tone = color ?? service.colors[0];
  const glyph = (
    <Ionicons
      name={serviceIconName(service)}
      size={bare ? size : Math.round(size * 0.5)}
      color={tone}
    />
  );
  if (bare) return glyph;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: tone + '1F',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glyph}
    </View>
  );
}
