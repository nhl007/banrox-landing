"use client";

import { useEffect, useRef } from "react";
import { FIELD, unpack } from "./twinkle-data";

/*
 * The stars twinkling, over the still starfield behind it.
 *
 * Only 720 of the field's 11,290 stars are here, and the still image underneath
 * still draws all of them. That split is the whole design:
 *
 *   - Nothing is ever removed, so the sky is complete before this mounts, with
 *     JavaScript off, and under reduced motion. This layer only ever adds.
 *   - Adding is also what makes it look right. Composited with `lighter`, a
 *     sparkle is the star's own light getting stronger, not a white dot
 *     appearing on top of it.
 *   - And it is 720 draws a frame instead of 11,290, which is the difference
 *     between free and a footer that heats the machine.
 *
 * Each star runs on its own period and phase, both hashed off its position, so
 * the sky never pulses as one and never repeats. The curve is cubed: a sine
 * spends most of its time near the middle, which reads as breathing, while a
 * cubed sine sits near dark and spikes — which is what a star actually does.
 */

/** How far past its radius a sparkle blooms, and so how big its sprite is. */
const BLOOM = 4;
/** Below this the star is indistinguishable from unlit; skip the draw. */
const FLOOR = 0.03;

export default function Twinkle({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    /*
     * Checked here rather than in CSS: this is the switch that decides whether a
     * requestAnimationFrame loop exists at all, and a `prefers-reduced-motion`
     * user should not be paying for one that renders nothing.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stars = unpack();
    const phase = new Float32Array(stars.length);
    const rate = new Float32Array(stars.length);
    stars.forEach((s, i) => {
      const h = Math.abs(Math.sin(s.x * 12.9898 + s.y * 78.233) * 43758.5453);
      phase[i] = (h % 1) * Math.PI * 2;
      /* 0.35–1.5 rad/s: slowest ~18s a cycle, fastest ~4s. */
      rate[i] = 0.35 + ((h * 7) % 1) * 1.15;
    });

    /* One sprite, drawn once and stamped per star. Building a gradient per star
       per frame is the one thing that would make this expensive. */
    const sprite = document.createElement("canvas");
    const SPRITE = 64;
    sprite.width = SPRITE;
    sprite.height = SPRITE;
    const sctx = sprite.getContext("2d");
    if (!sctx) return;
    const g = sctx.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(236,248,255,0.85)");
    g.addColorStop(0.45, "rgba(180,214,245,0.28)");
    g.addColorStop(1, "rgba(140,190,235,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, SPRITE, SPRITE);

    /* Artwork space -> device pixels, matching the still image's object-cover. */
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let ok = false;

    const measure = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return (ok = false);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      scale = Math.max(w / FIELD.w, h / FIELD.h) * dpr;
      ox = (w * dpr - FIELD.w * scale) / 2;
      oy = (h * dpr - FIELD.h * scale) / 2;
      return (ok = true);
    };

    /* Fixed per star, so a patch cleared is exactly the patch drawn. */
    const size = (i: number) => Math.max(3, stars[i].r * scale * BLOOM * 2);

    let start = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!ok) return;
      if (!start) start = now;
      const t = (now - start) / 1000;

      /*
       * Clearing every star's own patch rather than the whole canvas. This layer
       * is nothing but 720 sparse dots, so 720 small clears cost nothing where a
       * full-canvas clear is a several-megabyte memset on every frame.
       */
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < stars.length; i++) {
        const d = size(i);
        ctx.clearRect(stars[i].x * scale + ox - d / 2, stars[i].y * scale + oy - d / 2, d, d);
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < stars.length; i++) {
        const w = 0.5 + 0.5 * Math.sin(t * rate[i] + phase[i]);
        const a = w * w * w;
        if (a < FLOOR) continue;
        const d = size(i);
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, stars[i].x * scale + ox - d / 2, stars[i].y * scale + oy - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const resize = new ResizeObserver(() => measure());
    resize.observe(canvas);
    measure();

    /*
     * The footer is the last thing on a very long page, so for most of a visit
     * this is off screen. A loop nobody can see is a ticker callback burning
     * frames for nothing.
     */
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !raf) {
          start = 0;
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "200px" },
    );
    seen.observe(canvas);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      seen.disconnect();
      resize.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
