"use client";

import { useEffect } from "react";

/**
 * THE ARTBOARDS' FIT — worked out here because Safari will not do it in CSS.
 *
 * Three of the page's layouts are an ARTBOARD: a box of a fixed size whose
 * contents are placed at coordinates measured against that size. Each one is
 * drawn at its own size and scaled to fit the fluid column it sits in, which
 * needs exactly one number — the column's width over the artboard's own.
 *
 * CSS cannot divide one length by another; `tan(atan2(a, b))` is the way
 * around it, and it is what the stylesheet asks for. But Safari only computes
 * that correctly when BOTH lengths are static. Measured on iOS 26.5:
 *
 *     tan(atan2(339.3px, 360px))   0.9425   correct
 *     tan(atan2(100vw,   360px))   1.6688   should be 1.1167 — it reads the
 *                                           angle's degrees as radians
 *     tan(atan2(100cqw,  360px))   0.0000   should be 1.0500 — it resolves the
 *                                           container unit as nothing
 *
 * A scale of zero is the whole artboard gone: the box it reserves collapses,
 * and `scale(0)` — or worse, the negative this returns at some widths, which
 * MIRRORS it — puts the drawing somewhere off its own corner. Registering the
 * property, inverting the division and bridging through a font-size all fail
 * the same way, because they all end with a container unit inside `tan()`.
 *
 * So the number is measured. The stylesheet keeps its own version, which is
 * right everywhere except Safari and so costs those browsers nothing; this
 * writes over the top of it either way, and is what makes Safari agree.
 */

type Family = {
  /** The element that reserves the scaled box, and reads the property. */
  sizer: string;
  /** The property its rule is written in terms of. */
  prop: string;
  /**
   * The artboard's own size: the two custom properties the markup sets, or a
   * pair of numbers where the stylesheet hard-codes it.
   */
  size: [string, string] | [number, number];
  /**
   * The narrowest width worth shrinking to. Under it the artboard keeps this
   * size and is allowed to overhang instead — the stylesheet's `--stage-min`.
   */
  floor?: number;
  /** Where the column's HEIGHT is a constraint as well as its width. */
  boxed?: string;
};

const FAMILIES: Family[] = [
  {
    sizer: ".stage-sizer",
    prop: "--stage-scale",
    size: ["--stage-w", "--stage-h"],
    floor: 312,
    boxed: "(min-width: 641px) and (min-height: 480px)",
  },
  {
    sizer: ".panel-sizer",
    prop: "--panel-scale",
    size: ["--panel-w", "--panel-h"],
  },
  { sizer: ".figure-sizer", prop: "--figure-scale", size: [360, 260] },
];

export default function ArtboardFit() {
  useEffect(() => {
    /* The box a `cqw` would have been measured against: the sizer's own. */
    const roomFor = (sizer: HTMLElement) => sizer.parentElement;

    /**
     * A container query measures its container's CONTENT box, and `width` as
     * the browser reports it is the BORDER box wherever `box-sizing` says so —
     * which here is everywhere. The stages carry 64px of bleed above and below
     * them, so reading the reported number would make every one of them 128px
     * taller than the room it actually has.
     */
    const inside = (of: CSSStyleDeclaration, axis: "width" | "height") => {
      const box = parseFloat(of[axis]);
      if (of.boxSizing !== "border-box") return box;
      const edges =
        axis === "width"
          ? [
              of.paddingLeft,
              of.paddingRight,
              of.borderLeftWidth,
              of.borderRightWidth,
            ]
          : [
              of.paddingTop,
              of.paddingBottom,
              of.borderTopWidth,
              of.borderBottomWidth,
            ];
      return edges.reduce((left, edge) => left - parseFloat(edge), box);
    };

    const fit = () => {
      for (const family of FAMILIES) {
        const boxed = family.boxed
          ? window.matchMedia(family.boxed).matches
          : false;

        for (const sizer of document.querySelectorAll<HTMLElement>(
          family.sizer,
        )) {
          const room = roomFor(sizer);
          if (!room) continue;

          const own = getComputedStyle(sizer);
          /*
           * Both this and the column are `display: contents` wherever the
           * layout is fluid rather than an artboard, and then there is no box
           * to fit and no property being read.
           */
          if (own.display === "contents") continue;

          const [wide, tall] = family.size;
          const artW =
            typeof wide === "number"
              ? wide
              : Number(own.getPropertyValue(wide));
          const artH =
            typeof tall === "number"
              ? tall
              : Number(own.getPropertyValue(tall));
          if (!artW || !artH) continue;

          /*
           * An element that is not being laid out reports back whatever was
           * ASKED for rather than what it got, and `100%` read as a length is
           * a hundred pixels — which would quietly scale an artboard to
           * nothing. There is nothing to fit in that case anyway.
           */
          const had = getComputedStyle(room);
          if (!had.width.endsWith("px") || !had.height.endsWith("px")) continue;

          let scale = Math.min(inside(had, "width") / artW, 1);
          if (family.floor) scale = Math.max(scale, family.floor / artW);
          if (boxed) scale = Math.min(scale, inside(had, "height") / artH);
          if (!Number.isFinite(scale) || scale <= 0) continue;

          /* Quantised and only written when it moves: this runs on resize. */
          const next = String(Math.round(scale * 1e4) / 1e4);
          if (sizer.style.getPropertyValue(family.prop) !== next)
            sizer.style.setProperty(family.prop, next);
        }
      }
    };

    fit();

    /*
     * The columns, not the sizers: a sizer's size is what this WRITES, and
     * watching what you are about to change is how you get a loop.
     */
    const watch = new ResizeObserver(fit);
    for (const family of FAMILIES)
      for (const sizer of document.querySelectorAll<HTMLElement>(
        family.sizer,
      )) {
        const room = roomFor(sizer);
        if (room) watch.observe(room);
      }

    /* Fonts land after this runs and move the columns they are measured in. */
    document.fonts?.ready.then(fit).catch(() => {});

    return () => watch.disconnect();
  }, []);

  return null;
}
