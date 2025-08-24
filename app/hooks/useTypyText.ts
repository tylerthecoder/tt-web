import { useEffect, useState } from 'react';

export async function wait(ms: number) {
  await new Promise<void>((r) => {
    setTimeout(() => {
      r();
    }, ms);
  });
}

export default function useTypeyText(text: string) {
  const [typedText, setTypedText] = useState('');
  const [cursor, setCursor] = useState(Boolean);

  const animate = async () => {
    for (let i = 0; i < 2; i++) {
      await wait(300);
      setCursor(true);
      await wait(300);
      setCursor(false);
    }

    await wait(300);

    setCursor(true);

    for (let i = 1; i < text.length + 1; i++) {
      const str = text.substr(0, i);
      await wait(100);
      setTypedText(str);
    }

    await wait(300);
    setCursor(false);
    await wait(300);
    setCursor(true);
    await wait(300);
    setCursor(false);
  };

  useEffect(() => {
    animate();
  }, []);

  return {
    typedText,
    cursor,
  };
}
