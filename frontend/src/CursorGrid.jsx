import { useEffect, useRef } from "react";
import "./CursorGrid.css";

export default function CursorGrid({
  color = "#f5bd3f",
  radius = 150,
  fadeDuration = 800,
  spotlight = 0.18,
  children,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let active = true;
    let lastMove = 0;

    const mouse = { x: -1000, y: -1000 };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const move = (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      lastMove = performance.now();
    };

    const draw = (now) => {
      if (!active) return;

      ctx.clearRect(0, 0, width, height);

      const elapsed = now - lastMove;
      const fade =
        elapsed < 250
          ? 1
          : Math.max(
              0,
              1 - (elapsed - 250) / Math.max(1, fadeDuration)
            );

      // Soft golden glow only — no circular outline.
      if (fade > 0 && mouse.x >= 0 && mouse.y >= 0) {
        const glow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          radius
        );

        glow.addColorStop(
          0,
          `rgba(245, 189, 63, ${spotlight * fade})`
        );
        glow.addColorStop(
          0.45,
          `rgba(245, 189, 63, ${spotlight * fade * 0.35})`
        );
        glow.addColorStop(1, "rgba(245, 189, 63, 0)");

        ctx.fillStyle = glow;
        ctx.fillRect(
          mouse.x - radius,
          mouse.y - radius,
          radius * 2,
          radius * 2
        );
      }

      frame = requestAnimationFrame(draw);
    };

    resize();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });

    frame = requestAnimationFrame(draw);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, [radius, fadeDuration, spotlight]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="cursor-grid-canvas"
        aria-hidden="true"
      />
      {children}
    </>
  );
}