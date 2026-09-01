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

/** Where an element rests, in viewport coordinates. */
export const authoredRect = (node: HTMLElement) =>
  asAuthored([node], () => node.getBoundingClientRect());

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
