// From https://github.com/franciscop/use-animation-frame/blob/master/index.js
// Based off a tweet and codesandbox:
// https://mobile.twitter.com/hieuhlc/status/1164369876825169920
import { useEffect, useRef } from 'react';

const getNow = () => {
  if (typeof window !== 'undefined' && window.performance) {
    return window.performance.now();
  } else {
    return Date.now();
  }
};

// Reusable component that also takes dependencies
export const useAnimationFrame = (
  cb: (data: { time: number; delta: number }) => void,
  deps: any[],
) => {
  const frame = useRef<number>();
  const last = useRef(getNow());
  const init = useRef(getNow());

  const animate = () => {
    const now = getNow();
    const time = (now - init.current) / 1000;
    const delta = (now - last.current) / 1000;
    // In seconds ~> you can do ms or anything in userland
    cb({ time, delta });
    last.current = now;
    frame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current ?? 0);
  }, deps); // Make sure to change it if the deps change
};
