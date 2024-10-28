import { useMemo } from "react";
import { GravityBackground } from "./GravityBackground";
import { SierpinskiBackground } from "./SierpinskiBackground";
import { GameOfLifeBackground } from "./GameOfLifeBackground";

const backgrounds = [
  GravityBackground,
  SierpinskiBackground,
  GameOfLifeBackground
];

export function RandomBackground() {
  const Background = useMemo(
    () => backgrounds[Math.floor(Math.random() * backgrounds.length)],
    []
  );
  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 pointer-events-none -z-1">
      <Background />
    </div>
  );
}
