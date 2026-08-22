"use client";

import { useEffect, useRef } from "react";
import { FIELD, unpack } from "./twinkle-data";

/*
 * The footer's sky.
 *
 * 2,993 stars — every one in the artwork bright enough to be worth animating,
 * out of the 11,290 it contains. Composited with `lighter`, so a sparkle is a
 * star's own light getting stronger rather than a white dot appearing on top of
 * one, and each is drawn as a hard core inside a soft bloom: the bloom alone
 * read as fog, because a star of radius 0.6 blooms across eight times its own
 * width and leaves nothing in the middle.
 *
 * NOTE: this is now the only star layer. It used to sit over a still SVG of the
 * whole field, which is what made the sky complete before this mounted, with
 * JavaScript off, and under reduced motion — all three of which now render an
 * empty sky. Restoring that guarantee means putting the still field back behind
 * this (see Footer, where it is commented out) rather than anything here.
 *
 * Each star runs on its own period and phase, both hashed off its position, so
 * the sky never pulses as one and never repeats. The curve is cubed: a sine
 * spends most of its time near the middle, which reads as breathing, while a
 * cubed sine sits near dark and spikes — which is what a star actually does.
 */

/**
 * A sparkle is a point of light with a bloom around it, and it needs to be
 * drawn as both.
 *
 * The bloom alone was the whole sparkle once, and it read as fog: a star of
 * radius 0.6 blooms across eight times its own width, so at the peak of a
 * twinkle the brightest thing on screen was a soft patch several pixels across
 * with no star visible in the middle of it. The core is what it was missing —
 * hard, barely wider than the star itself, and drawn at full alpha over the
 * bloom's half.
 */
const BLOOM = 3.2;
const CORE = 2.4;
/** The bloom is the surround, not the subject; the core carries the light. */
const BLOOM_ALPHA = 0.55;
/** Below this the star is indistinguishable from unlit; skip the draw. */
const FLOOR = 0.03;

/** One radial ramp, baked once. Building these per star per frame is the one
    thing that would make this expensive. */
function ramp(px: number, stops: [number, string][]) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const x = c.getContext("2d");
  if (!x) return null;
  const g = x.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  x.fillStyle = g;
  x.fillRect(0, 0, px, px);
  return c;
}

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

    const bloom = ramp(64, [
      [0, "rgba(255,255,255,1)"],
      [0.18, "rgba(236,248,255,0.85)"],
      [0.45, "rgba(180,214,245,0.28)"],
      [1, "rgba(140,190,235,0)"],
    ]);
    /* Solid to nearly half its own radius, so it lands as a disc with an edge
       rather than as a smaller version of the bloom. */
    const core = ramp(32, [
      [0, "rgba(255,255,255,1)"],
      [0.44, "rgba(255,255,255,1)"],
      [0.72, "rgba(228,241,255,0.5)"],
      [1, "rgba(198,224,255,0)"],
    ]);
    if (!bloom || !core) return;

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
    /* Floored at one device pixel: below that a soft ramp drawn into a fraction
       of a pixel is a grey smudge, which is the opposite of the point. */
    const dot = (i: number) => Math.max(1, stars[i].r * scale * CORE);

    let start = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!ok) return;
      if (!start) start = now;
      const t = (now - start) / 1000;

      /*
       * Clearing every star's own patch rather than the whole canvas. This layer
       * is nothing but sparse dots, so a few thousand small clears cost nothing
       * where a full-canvas clear is a several-megabyte memset every frame.
       */
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < stars.length; i++) {
        const d = size(i);
        ctx.clearRect(
          stars[i].x * scale + ox - d / 2,
          stars[i].y * scale + oy - d / 2,
          d,
          d,
        );
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < stars.length; i++) {
        const w = 0.5 + 0.5 * Math.sin(t * rate[i] + phase[i]);
        const a = w * w * w;
        if (a < FLOOR) continue;
        const x = stars[i].x * scale + ox;
        const y = stars[i].y * scale + oy;
        const d = size(i);
        const k = dot(i);
        ctx.globalAlpha = a * BLOOM_ALPHA;
        ctx.drawImage(bloom, x - d / 2, y - d / 2, d, d);
        ctx.globalAlpha = a;
        ctx.drawImage(core, x - k / 2, y - k / 2, k, k);
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
