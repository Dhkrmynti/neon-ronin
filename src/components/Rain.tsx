import { useEffect, useRef } from "react";
import { MOTION_OK } from "../lib/motion";

type Props = { density?: number; color?: string; accent?: string; className?: string };

// Slanted rain on a canvas. Stops drawing while it is off screen, and is never drawn with reduced motion.
export function Rain({ density = 1, color = "rgba(170, 190, 255, 0.32)", accent = "rgba(34, 227, 255, 0.55)", className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    if (!window.matchMedia(MOTION_OK).matches) return;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, raf = 0, visible = true;
    let drops: { x: number; y: number; len: number; speed: number; hot: boolean }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(((w * h) / 9000) * density);
      drops = Array.from({ length: n }, () => ({
        x: Math.random() * (w + 200),
        y: Math.random() * h,
        len: 10 + Math.random() * 22,
        speed: 7 + Math.random() * 9,
        hot: Math.random() < 0.08,
      }));
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.4;
      for (const d of drops) {
        ctx.strokeStyle = d.hot ? accent : color;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.3, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        d.x -= d.speed * 0.3;
        if (d.y > h) {
          d.y = -d.len;
          d.x = Math.random() * (w + 200);
        }
      }
    };

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    frame();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [density, color, accent]);

  return <canvas ref={ref} className={`rain ${className}`} aria-hidden="true" />;
}
