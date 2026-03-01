"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackdropProps {
  subtle?: boolean;
}

export function AuroraBackdrop({ subtle = false }: AuroraBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const draw = () => {
      time += subtle ? 0.003 : 0.005;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width * 0.3 + Math.sin(time) * width * 0.1,
        height * 0.4 + Math.cos(time * 0.7) * height * 0.1,
        0,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );

      gradient.addColorStop(0, `rgba(238, 63, 67, ${subtle ? 0.08 : 0.12})`);
      gradient.addColorStop(0.4, `rgba(180, 40, 50, ${subtle ? 0.04 : 0.06})`);
      gradient.addColorStop(1, "rgba(8, 8, 8, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const gradient2 = ctx.createRadialGradient(
        width * 0.7 + Math.cos(time * 0.5) * width * 0.1,
        height * 0.6 + Math.sin(time * 0.8) * height * 0.1,
        0,
        width * 0.5,
        height * 0.5,
        width * 0.6
      );

      gradient2.addColorStop(0, `rgba(238, 63, 67, ${subtle ? 0.05 : 0.08})`);
      gradient2.addColorStop(0.5, `rgba(100, 20, 25, ${subtle ? 0.02 : 0.04})`);
      gradient2.addColorStop(1, "rgba(8, 8, 8, 0)");

      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [subtle]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-background" />
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0",
          subtle ? "opacity-60" : "opacity-80"
        )}
      />
    </div>
  );
}
