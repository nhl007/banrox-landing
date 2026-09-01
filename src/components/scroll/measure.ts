import type gsap from "gsap";

/* Measuring the page as the stylesheet describes it. */
export const asAuthored = <T>(nodes: HTMLElement[], read: () => T): T => {
  const saved: [HTMLElement, string, string][] = [];
  const seen = new Set<HTMLElement>();
  /* Transforms come off anything; heights come off [data-reveal] only. */
  const strip = (el: HTMLElement) => {
    seen.add(el);
    const height = el.hasAttribute("data-reveal") ? el.style.height : "";
    if (!el.style.transform && !height) return;
    saved.push([el, el.style.transform, height]);
    el.style.transform = "";
    if (height) el.style.height = "";
  };

  for (const n of nodes)
    for (
      let el: HTMLElement | null = n;
      el && el !== document.body;
      el = el.parentElement
    ) {
      /*
       * An ancestor already cleared for an earlier node has cleared the rest
       * of the chain above it too.
       */
      if (seen.has(el)) break;
      strip(el);
    }

  /* And anything the sequence is holding SHORT, wherever on the page it is. */
  for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (el.style.height && !seen.has(el)) strip(el);

  try {
    return read();
  } finally {
    for (const [el, t, h] of saved) {
      el.style.transform = t;
      if (h) el.style.height = h;
    }
  }
};

/**
 * The four properties a transform can arrive through. `transform` is the one
 * GSAP writes; the other three are the independent CSS properties, and the
 * stylesheet uses `translate` on at least one thing the card measures.
 */
const MOVED = ["transform", "translate", "rotate", "scale"] as const;

/**
 * The same idea as `asAuthored`, but stricter: ALL FOUR movement properties
 * come off, not just `transform`, and every held-short [data-reveal] height in
 * the document is cleared up front rather than only the ones nothing else
 * reached.
 *
 * Still INLINE styles only, and that is the point rather than a shortcut: a
 * transform coming from a class or a custom property stays, so this reports an
 * element at the size the page is currently drawing it while ignoring whatever
 * the sequence has it doing this instant. The travelling card needs both
 * readings — where a slot RESTS, and how big it is ON SCREEN.
 */
export const asDrawn = <T>(nodes: HTMLElement[], read: () => T): T => {
  const saved: [HTMLElement, string[]][] = [];
  const heights: [HTMLElement, string][] = [];
  const seen = new Set<HTMLElement>();

  const strip = (el: HTMLElement) => {
    seen.add(el);
    const was = MOVED.map((p) => el.style.getPropertyValue(p));
    if (was.every((v) => !v)) return;
    saved.push([el, was]);
    for (const p of MOVED) el.style.removeProperty(p);
  };

  for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (el.style.height) {
      heights.push([el, el.style.height]);
      el.style.height = "";
    }

  for (const n of nodes)
    for (
      let el: HTMLElement | null = n;
      el && el !== document.body && !seen.has(el);
      el = el.parentElement
    )
      strip(el);

  try {
    return read();
  } finally {
    for (const [el, was] of saved)
      MOVED.forEach((p, i) => {
        if (was[i]) el.style.setProperty(p, was[i]!);
      });
    for (const [el, h] of heights) el.style.height = h;
  }
};

/** Where an element rests, in viewport coordinates. */
export const authoredRect = (node: HTMLElement) =>
  asAuthored([node], () => node.getBoundingClientRect());

/** ...and the same box with every inline movement taken off it. */
export const drawnRect = (node: HTMLElement) =>
  asDrawn([node], () => node.getBoundingClientRect());

/** Where an element's top edge rests, in page coordinates. */
export const authoredTop = (node: HTMLElement) =>
  authoredRect(node).top + window.scrollY;

/** The first thing a beat moves, in the order the page reads. */
export const leadOf = (tl: gsap.core.Timeline): HTMLElement | null => {
  const seen = new Set<HTMLElement>();
  const light = new Set<HTMLElement>();
  for (const child of tl.getChildren(true, true, false))
    for (const target of (child as gsap.core.Tween).targets())
      if (target instanceof HTMLElement && target.getClientRects().length)
        (target.hasAttribute("data-glow-from") ? light : seen).add(target);

  /* Unless light is all it has. */
  const nodes = [...(seen.size ? seen : light)];
  if (!nodes.length) return null;

  /*
   * One survey for the whole set — where each of them RESTS, not where the
   * beat has just parked it.
   */
  return asAuthored(nodes, () =>
    nodes.reduce((first, n) =>
      n.getBoundingClientRect().top < first.getBoundingClientRect().top
        ? n
        : first,
    ),
  );
};
