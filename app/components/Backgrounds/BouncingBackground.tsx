'use client';

import { useEffect, useRef } from 'react';

/** A decorative background. Each mount owns its animation and pointer state. */
export function BouncingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const balls = [
      { x: 100, y: 100, vx: 110, vy: 85, color: '#3b82f6' },
      { x: 200, y: 100, vx: -80, vy: 115, color: '#facc15' },
    ];
    let pointer: { x: number; y: number } | undefined;
    let frame = 0;
    let previous = 0;
    let width = 0;
    let height = 0;
    const radius = 20;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const ball of balls) {
        context.beginPath();
        context.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
        context.fillStyle = ball.color;
        context.fill();
      }
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      for (const ball of balls) {
        ball.x = Math.max(radius, Math.min(width - radius, ball.x));
        ball.y = Math.max(radius, Math.min(height - radius, ball.y));
      }
      draw();
    };
    const animate = (time: number) => {
      const delta = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;
      for (const ball of balls) {
        if (pointer) {
          const dx = ball.x - pointer.x;
          const dy = ball.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 150) {
            ball.vx += (dx / distance) * 350 * delta;
            ball.vy += (dy / distance) * 350 * delta;
          }
        }
        ball.vx = Math.max(-240, Math.min(240, ball.vx));
        ball.vy = Math.max(-240, Math.min(240, ball.vy));
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;
        if (ball.x < radius || ball.x > width - radius) {
          ball.x = Math.max(radius, Math.min(width - radius, ball.x));
          ball.vx *= -1;
        }
        if (ball.y < radius || ball.y > height - radius) {
          ball.y = Math.max(radius, Math.min(height - radius, ball.y));
          ball.vy *= -1;
        }
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate);
      else draw();
    };
    const move = (event: MouseEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const leave = () => {
      pointer = undefined;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    restart();
    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', leave);
    document.addEventListener('visibilitychange', restart);
    reducedMotion.addEventListener('change', restart);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('visibilitychange', restart);
      reducedMotion.removeEventListener('change', restart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      className="h-full w-full"
      data-background="bouncing"
    />
  );
}
