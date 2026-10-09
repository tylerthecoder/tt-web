'use client';

import { useState } from 'react';
import { BouncingBackground } from './BouncingBackground';
import { GameOfLifeBackground } from './GameOfLifeBackground';
import { GravityBackground } from './GravityBackground';
import { SierpinskiBackground } from './SierpinskiBackground';

const backgrounds = [
  BouncingBackground,
  GravityBackground,
  SierpinskiBackground,
  GameOfLifeBackground,
];

export function RandomBackground() {
  const [index, setIndex] = useState(0);
  const Background = backgrounds[index];
  return (
    <>
      <div className="fixed inset-0 bg-black pointer-events-none -z-1" aria-hidden="true">
        <Background />
      </div>
      <button
        type="button"
        className="fixed bottom-3 right-3 z-10 rounded-md bg-gray-900/80 px-3 py-2 text-xs text-gray-300 hover:text-white"
        onClick={() =>
          setIndex(
            (current) =>
              (current + 1 + Math.floor(Math.random() * (backgrounds.length - 1))) %
              backgrounds.length,
          )
        }
      >
        Change background
      </button>
    </>
  );
}
