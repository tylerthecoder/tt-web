import { useEffect, useEffectEvent } from 'react';

export function useAnimationFrame(callback: (data: { time: number; delta: number }) => void) {
  const onFrame = useEffectEvent(callback);
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    let last = start;
    let frame = 0;
    const animate = (now: number) => {
      onFrame({ time: (now - start) / 1000, delta: Math.min((now - last) / 1000, 0.05) });
      last = now;
      if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      last = performance.now();
      // Draw one still frame for reduced motion; pause completely in hidden tabs.
      if (!document.hidden) frame = requestAnimationFrame(animate);
    };
    restart();
    reducedMotion.addEventListener('change', restart);
    document.addEventListener('visibilitychange', restart);
    return () => {
      cancelAnimationFrame(frame);
      reducedMotion.removeEventListener('change', restart);
      document.removeEventListener('visibilitychange', restart);
    };
  }, []);
}
