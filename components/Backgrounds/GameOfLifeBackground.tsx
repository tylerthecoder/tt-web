import { useEffect, useRef, useState } from "react";
import { Vector, drawRect } from "../../services/drawingService";
import { useAnimationFrame } from "../../hooks/useAnimationFrame";
import { useWindowResize } from "../../hooks/useWindowResize";

type Grid = boolean[][];

const CONFIG = {
  CELL_SIZE: 5,
  CELL_COLOR: "red"
};

const GridService = {
  update: (grid: Grid): Grid => {
    const newCells: Grid = [];
    for (let i = 0; i < grid.length; i++) {
      newCells[i] = [];
      for (let j = 0; j < grid[i].length; j++) {
        const neighbors = GridService.countNeighbors(grid, i, j);
        const isAlive =
          neighbors === 3 ||
          (grid[i][j] && (neighbors === 2 || neighbors === 3));
        newCells[i][j] = isAlive;
      }
    }
    return newCells;
  },

  countNeighbors: (grid: Grid, x: number, y: number) => {
    let count = 0;
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (i === 0 && j === 0) {
          continue;
        }
        const newX = x + i;
        const newY = y + j;
        if (newX < 0 || newX >= grid.length) {
          continue;
        }
        if (newY < 0 || newY >= grid[0].length) {
          continue;
        }
        count += grid[newX][newY] ? 1 : 0;
      }
    }
    return count;
  },

  draw: (grid: Grid, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = CONFIG.CELL_COLOR;
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j]) {
          ctx.fillRect(
            i * CONFIG.CELL_SIZE,
            j * CONFIG.CELL_SIZE,
            CONFIG.CELL_SIZE,
            CONFIG.CELL_SIZE
          );
        }
      }
    }
  },

  makeRandomGrid: (width: number, height: number): Grid => {
    const grid: Grid = [];
    for (let i = 0; i < width; i++) {
      grid[i] = [];
      for (let j = 0; j < height; j++) {
        grid[i][j] = Math.random() > 0.5;
      }
    }
    return grid;
  }
};

const STATE: {
  grid?: Grid;
} = {};

export const GameOfLifeBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useAnimationFrame(() => {
    if (!canvasRef.current) {
      return;
    }

    if (!STATE.grid) {
      STATE.grid = GridService.makeRandomGrid(
        window.innerWidth / CONFIG.CELL_SIZE,
        window.innerHeight / CONFIG.CELL_SIZE
      );
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }

    const canvas = canvasRef.current;

    STATE.grid = GridService.update(STATE.grid);

    GridService.draw(STATE.grid, canvas);
  }, []);

  return <canvas className="w-full h-full" ref={canvasRef}></canvas>;
};
