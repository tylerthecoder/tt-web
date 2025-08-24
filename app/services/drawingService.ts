export type Vector = { x: number; y: number };

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  pos: Vector,
  radius: number,
  color: string,
) {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawRect(ctx: CanvasRenderingContext2D, pos: Vector, size: Vector, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(pos.x, pos.y, size.x, size.y);
}

// Add two vectors together
export function addVectors(v1: Vector, v2: Vector) {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

// Subtract two vectors
export function subtractVectors(v1: Vector, v2: Vector) {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

// Normalize a vector
export function normalizeVector(v: Vector) {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  return { x: v.x / length, y: v.y / length };
}

// Multiply a vector by a scalar
export function multiplyVector(v: Vector, scalar: number) {
  return { x: v.x * scalar, y: v.y * scalar };
}

// distance between two vectors
export function distanceBetweenVectors(v1: Vector, v2: Vector) {
  return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
}

// random normalized vector
export function randomVector() {
  return normalizeVector({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  });
}

// vector magintude
export function vectorMagnitude(v: Vector) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

// Copy vector
export function copyVector(v: Vector) {
  return { x: v.x, y: v.y };
}
