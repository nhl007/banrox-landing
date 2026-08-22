import type gsap from "gsap";

/*
 * Measuring the page as the stylesheet describes it.
 *
 * Two very different things need this and both need it for the same reason.
 *
 * Depth converts px into percentages of a box and works out how much room a
 * section has between its heading and its payload (see parallax.ts); a beat
 * with a trigger of its own needs to know where its subject RESTS, so that the
 * trigger fires when the reader can see it (see Beat.own in sections.ts). Both
 * are measurements of a settled page, and both are taken while the page is
 * anything but:
 *
 *   - An arrival parks its payload low until its section is reached. The
 *     comparison panels sit 100px down and the approve ledger 56px, so a
 *     trigger hung on either records a position that much too far down the
 *     page — measured, the strength rails' trigger came out 118px late and
 *     fired with the rail already two thirds of the way up the window.
 *   - The Early Access card spends its entrance rotated a quarter turn, so its
 *     bounding box is 420px wide where the card is 260 — a stage unit looked
 *     1.62 screen pixels instead of 1.
 *   - The Alone Vs Together panels are SHORTER than they end up: their rails
 *     are brought out by growing the panel (see alonePanels, which explains why
 *     it has to be a height and not a clip), so a percentage of a panel's
 *     height, taken then, was a percentage of 496px on its way to 628. The
 *     percentage was right and the box it applied to grew by a quarter
 *     underneath it, and the panels travelled 26.6% further than asked.
 *
 * So the measurement is taken with every inline transform and height this page
 * has written temporarily removed — from the elements and from their ancestors,
 * since a nested element inherits its parent's offset. What is left is the
 * layout the CSS describes, which is the only stable thing to measure against.
 * Restored in a `finally`, synchronously, so nothing can paint in between, and
 * GSAP is untouched by it: its own transform cache is separate from the inline
 * styles, so it neither notices nor has to be told.
 */
export const asAuthored = <T>(nodes: HTMLElement[], read: () => T): T => {
  const saved: [HTMLElement, string, string][] = [];
  const seen = new Set<HTMLElement>();
  const strip = (el: HTMLElement) => {
    seen.add(el);
    if (!el.style.transform && !el.style.height) return;
    saved.push([el, el.style.transform, el.style.height]);
    el.style.transform = "";
    el.style.height = "";
  };

  for (const n of nodes)
    for (
      let el: HTMLElement | null = n;
      el && el !== document.body;
      el = el.parentElement
    ) {
      /* An ancestor already cleared for an earlier node has cleared the rest of
         the chain above it too. */
      if (seen.has(el)) break;
      strip(el);
    }

  /*
   * And anything the sequence is holding SHORT, wherever on the page it is.
   *
   * The chain above only reaches ancestors, and a height is the one thing here
   * that moves elements that are not descendants of it: the comparison panels
   * are parked 118px short until their strength rail is brought out (see
   * alonePanels), and on a phone — where a section is as tall as its contents
   * rather than one window — everything BELOW a parked panel is 118px too high
   * for as long as it is parked. Measured: the lower panel's own beat fired
   * 118px early and its rail's 118px after that, both derived from a page that
   * was not the page.
   *
   * Nothing above the gate is affected either way, because up there a section
   * is min-height one window and a panel parked short does not shorten it.
   */
  for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (el.style.height && !seen.has(el)) strip(el);

  try {
    return read();
  } finally {
    for (const [el, t, h] of saved) {
      el.style.transform = t;
      el.style.height = h;
    }
  }
};

/** Where an element rests, in viewport coordinates. */
export const authoredRect = (node: HTMLElement) =>
  asAuthored([node], () => node.getBoundingClientRect());

/** Where an element's top edge rests, in page coordinates. */
export const authoredTop = (node: HTMLElement) =>
  authoredRect(node).top + window.scrollY;

/**
 * The first thing a beat moves, in the order the page reads.
 *
 * The phone tier hangs every beat on its own trigger and this is what it hangs
 * it on: a beat should set off as the thing it is about clears the fold, and
 * the thing it is about is whatever it moves that comes first down the page.
 * Derived from the timeline rather than declared beside it, because it is
 * already stated once — in the targets — and a selector repeating it in
 * sections.ts would be one edit away from naming an element the beat no longer
 * touches.
 *
 * Two kinds of target are left out.
 *
 * Anything with no box, because half the markup on this page belongs to the
 * other tier and is `display: none` — a beat's real first element is the first
 * one the reader could see.
 *
 * And the section's ambient light, which is always the earliest thing in the
 * box and never the thing a beat is about: these are blooms placed far outside
 * the content they sit behind (the hero's starts 351px above the fan, Life
 * Inside Squad's aura 152px above its first card), they have no edge to arrive
 * at, and hanging a trigger on one would fire the beat while the card it
 * belongs to was still most of a screen away.
 *
 * Null when a beat moves nothing this tier renders, which is not a fault: the
 * hero holds two arrangements of the same five cards and only one of them is
 * ever the fan.
 */
export const leadOf = (tl: gsap.core.Timeline): HTMLElement | null => {
  const seen = new Set<HTMLElement>();
  for (const child of tl.getChildren(true, true, false))
    for (const target of (child as gsap.core.Tween).targets())
      if (
        target instanceof HTMLElement &&
        !target.hasAttribute("data-glow-from") &&
        target.getClientRects().length
      )
        seen.add(target);

  const nodes = [...seen];
  if (!nodes.length) return null;

  /* One survey for the whole set — where each of them RESTS, not where the beat
     has just parked it. Same reason authoredTop exists. */
  return asAuthored(nodes, () =>
    nodes.reduce((first, n) =>
      n.getBoundingClientRect().top < first.getBoundingClientRect().top
        ? n
        : first,
    ),
  );
};
