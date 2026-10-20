import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/lib/theme';

const COLORS = [palette.violet, palette.pink, palette.amber, palette.mint, palette.sky, palette.coral];

function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Piece {
  angle: number;
  distance: number;
  color: string;
  size: number;
  spin: number;
  delay: number;
  round: boolean;
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(withDelay(piece.delay, withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })));
  }, [p, piece.delay]);

  const style = useAnimatedStyle(() => {
    const t = p.get();
    const dx = Math.cos(piece.angle) * piece.distance * t;
    // Burst upward, then fall with gravity
    const dy = Math.sin(piece.angle) * piece.distance * t + 260 * t * t;
    return {
      opacity: interpolate(t, [0, 0.1, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: dx },
        { translateY: dy },
        { rotate: `${piece.spin * t}deg` },
        { scale: interpolate(t, [0, 0.15, 1], [0.2, 1, 0.7]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.45,
          borderRadius: piece.round ? piece.size : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

/** A one-shot burst that radiates from the centre of its container */
export function Confetti({ count = 46, burstKey = 0 }: { count?: number; burstKey?: number }) {
  // Seeded by burstKey so renders stay pure while each burst looks different
  const pieces = useMemo<Piece[]>(() => {
    const rand = seeded(burstKey + 1);
    return Array.from({ length: count }, (_, i) => ({
      angle: -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.6,
      distance: 120 + rand() * 200,
      color: COLORS[i % COLORS.length],
      size: 7 + rand() * 8,
      spin: (rand() - 0.5) * 900,
      delay: rand() * 120,
      round: rand() > 0.6,
    }));
  }, [count, burstKey]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} className="items-center justify-center">
      {pieces.map((piece, i) => (
        <ConfettiPiece key={`${burstKey}-${i}`} piece={piece} />
      ))}
    </View>
  );
}
