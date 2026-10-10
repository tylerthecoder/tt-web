import { useEffect, useState } from 'react';

export default function useTypeyText(text: string) {
  const [typedText, setTypedText] = useState('');
  const [cursor, setCursor] = useState(false);
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    setTypedText('');
    const schedule = (at: number, action: () => void) => timers.push(setTimeout(action, at));
    for (let tick = 1; tick <= 5; tick++) schedule(tick * 300, () => setCursor(tick % 2 === 1));
    for (let length = 1; length <= text.length; length++)
      schedule(1500 + length * 100, () => setTypedText(text.slice(0, length)));
    for (let tick = 1; tick <= 3; tick++)
      schedule(1500 + text.length * 100 + tick * 300, () => setCursor(tick % 2 === 0));
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [text]);
  return { typedText, cursor };
}
