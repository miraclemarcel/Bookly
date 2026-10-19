import { useEffect, useRef, useState } from 'react';
import { Text, type TextProps } from 'react-native';

interface Props extends TextProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Counts up (or down) to `value` whenever it changes */
export function AnimatedNumber({ value, format = (n) => String(Math.round(n)), duration = 900, ...rest }: Props) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = Date.now();
    const initial = from.current;
    let frame: number;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const next = initial + (value - initial) * easeOutExpo(t);
      setDisplay(next);
      from.current = next;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <Text {...rest}>{format(display)}</Text>;
}
