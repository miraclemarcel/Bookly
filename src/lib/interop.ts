/**
 * Teach NativeWind how to style third-party components via `className`.
 * Imported once from the root layout.
 */
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import Animated from 'react-native-reanimated';

cssInterop(LinearGradient, { className: 'style' });
cssInterop(BlurView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
cssInterop(Animated.Text, { className: 'style' });
cssInterop(Animated.ScrollView, { className: 'style', contentContainerClassName: 'contentContainerStyle' });
