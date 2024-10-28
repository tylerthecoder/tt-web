import { useRef, useState } from "react";
import { useAnimationFrame } from "../../hooks/useAnimationFrame";
import { drawCircle } from "../../services/drawingService";

interface Planet {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function drawPlanet(ctx: CanvasRenderingContext2D, planet: Planet) {
  drawCircle(ctx, planet, planet.radius, "red");
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  drawCircle(ctx, ball, 10, "yellow");
}

function makePlanets(canvas: HTMLCanvasElement) {
  const planets: Planet[] = [];
  const numPlanets = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i <= numPlanets; i++) {
    const x = Math.random() * (canvas.width - 200) + 100;
    const y = Math.random() * (canvas.height - 200) + 100;
    const radius = Math.random() * 40 + 20;

    // make sure the planent doesn't touch any other ones
    let touching = false;
    for (const planet of planets) {
      const dx = planet.x - x;
      const dy = planet.y - y;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      if (dist < planet.radius + radius + 20) {
        touching = true;
      }
    }
    if (touching) {
      continue;
    }

    planets.push({
      x,
      y,
      radius,
      color: "red"
    });
  }
  return planets;
}

function makeBalls(canvas: HTMLCanvasElement) {
  const balls: Ball[] = [];
  for (let i = 0; i < 15; i++) {
    balls.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.random() * 20 - 10,
      vy: Math.random() * 20 - 10
    });
  }
  return balls;
}

function logicLoop(
  planets: Planet[],
  balls: Ball[],
  canvas: HTMLCanvasElement
) {
  const ballsToRemove: Ball[] = [];

  for (const ball of balls) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x < 0) {
      ball.x = 0;
      ball.vx *= -0.9;
    } else if (ball.x > canvas.width) {
      ball.x = canvas.width;
      ball.vx *= -0.9;
    } else if (ball.y < 0) {
      ball.y = 0;
      ball.vy *= -0.9;
    } else if (ball.y > canvas.height) {
      ball.y = canvas.height;
      ball.vy *= -0.9;
    }

    let forcex = 0;
    let forcey = 0;

    for (const planet of planets) {
      const dx = planet.x - ball.x;
      const dy = planet.y - ball.y;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);

      const mass = 10 * planet.radius ** 2;

      const force = mass / dist ** 2;

      forcey += (force * dy) / dist;
      forcex += (force * dx) / dist;
    }

    ball.vx += forcex;
    ball.vy += forcey;

    // ball can't hit a planet
    for (const planet of planets) {
      const dx = planet.x - ball.x;
      const dy = planet.y - ball.y;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      // kill the ball
      if (dist < planet.radius + 10) {
        ballsToRemove.push(ball);
      }
    }
  }

  for (const ball of ballsToRemove) {
    const index = balls.indexOf(ball);
    if (index !== -1) {
      balls.splice(index, 1);
    }
  }
}

function draw(planets: Planet[], balls: Ball[], canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  logicLoop(planets, balls, canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const planet of planets) {
    drawPlanet(ctx, planet);
  }
  for (const ball of balls) {
    drawBall(ctx, ball);
  }
}

export const GravityBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [balls, setBalls] = useState<Ball[]>([]);

  useAnimationFrame(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    if (planets.length === 0 || balls.length === 0) {
      console.log(
        "making planets and balls",
        makePlanets(canvas),
        canvas.width,
        canvas.height
      );
      setPlanets(makePlanets(canvas));
      setBalls(makeBalls(canvas));
    }

    draw(planets, balls, canvas);
  }, [planets, balls]);

  return <canvas className="w-full h-full" ref={canvasRef}></canvas>;
};
