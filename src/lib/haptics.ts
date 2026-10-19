import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

export const haptic = {
  tap: () => enabled && Haptics.selectionAsync(),
  soft: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  bump: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warn: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
