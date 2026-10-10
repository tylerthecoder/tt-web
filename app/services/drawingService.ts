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
