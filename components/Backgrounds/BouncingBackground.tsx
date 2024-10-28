import { useEffect, useRef } from "react";
import {
  Vector,
  addVectors,
  copyVector,
  distanceBetweenVectors,
  drawCircle,
  multiplyVector,
  normalizeVector,
  randomVector,
  subtractVectors
} from "../../services/drawingService";
import { useAnimationFrame } from "../../hooks/useAnimationFrame";

let mouseX = 0;
let mouseY = 0;

const onMouseMove = (event: MouseEvent) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
};

class Ball {
  private oldVel: Vector;

  private a: Vector;

  private accCounter = 0;

  private maxVel = 4;

  private isRunning = false;

  constructor(
    private pos: Vector,
    private vel: Vector,
    private r: number,
    private color: string
  ) {
    this.oldVel = randomVector();

    this.a = multiplyVector(randomVector(), 0.3);
  }

  public update(canvas: HTMLCanvasElement, mousePos: Vector) {
    const distFromMouse = distanceBetweenVectors(this.pos, mousePos);
    const directionOfMouse = normalizeVector(
      subtractVectors(mousePos, this.pos)
    );

    if (distFromMouse < 300) {
      const jerk = multiplyVector(directionOfMouse, -0.1);
      this.a = addVectors(this.a, jerk);
    }

    if (distFromMouse < this.r) {
      alert("You win!");
    } else if (distFromMouse < 100) {
      this.isRunning = true;
      this.oldVel = copyVector(this.vel);
      const newVel = multiplyVector(directionOfMouse, -3);
      this.vel = newVel;
    } else if (distFromMouse < 1000) {
    } else if (this.isRunning) {
      this.vel = copyVector(this.oldVel);
      this.isRunning = false;
    }

    // Update acc
    if (!this.isRunning) {
      this.accCounter++;

      if (this.accCounter > 10) {
        this.a = multiplyVector(randomVector(), 0.3);
        this.accCounter = 0;
      }
    }

    this.vel = addVectors(this.vel, this.a);
    this.pos = addVectors(this.pos, this.vel);

    if (this.vel.x > this.maxVel) {
      this.vel.x = this.maxVel;
    }
    if (this.vel.x < -this.maxVel) {
      this.vel.x = -this.maxVel;
    }
    if (this.vel.y > this.maxVel) {
      this.vel.y = this.maxVel;
    }
    if (this.vel.y < -this.maxVel) {
      this.vel.y = -this.maxVel;
    }

    if (this.pos.x < 0) {
      this.pos.x = 0;
      this.vel.x = -this.vel.x;
      this.a.x = -this.a.x;
    }
    if (this.pos.x > canvas.width) {
      this.pos.x = canvas.width;
      this.vel.x = -this.vel.x;
      this.a.x = -this.a.x;
    }
    if (this.pos.y < 0) {
      this.pos.y = 0;
      this.vel.y = -this.vel.y;
      this.a.y = -this.a.y;
    }
    if (this.pos.y > canvas.height) {
      this.pos.y = canvas.height;
      this.vel.y = -this.vel.y;
      this.a.y = -this.a.y;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    drawCircle(ctx, this.pos, this.r, this.color);
  }
}

class BouncingController {
  private ball1 = new Ball({ x: 100, y: 100 }, { x: 0, y: 0 }, 20, "blue");
  private ball2 = new Ball({ x: 200, y: 100 }, { x: 0, y: 0 }, 20, "yellow");

  loop(canvas: HTMLCanvasElement) {
    const mousePos = { x: mouseX, y: mouseY - 66 };

    this.ball1.update(canvas, mousePos);
    this.ball2.update(canvas, mousePos);

    // Draw
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ball1.draw(ctx);
    this.ball2.draw(ctx);
    // Debugging red circle
    // drawCircle(ctx, mousePos, 5, "red");
  }
}

const drawAll = (canvas: HTMLCanvasElement) => {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
};

const controller = new BouncingController();

export const BouncingBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useAnimationFrame(() => {
    if (canvasRef.current) {
      controller.loop(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const listener = () => {
      drawAll(canvas);
    };

    window.addEventListener("mousemove", onMouseMove);

    listener();

    window.addEventListener("resize", listener);
    return () => {
      window.removeEventListener("resize", listener);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef}></canvas>;
};
