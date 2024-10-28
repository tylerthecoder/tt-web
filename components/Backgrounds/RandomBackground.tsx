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
  return <Background />;
}
