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
  for (const n of nodes)
    for (
      let el: HTMLElement | null = n;
      el && el !== document.body;
      el = el.parentElement
    ) {
      /* An ancestor already cleared for an earlier node has cleared the rest of
         the chain above it too. */
      if (seen.has(el)) break;
      seen.add(el);
      if (el.style.transform || el.style.height) {
        saved.push([el, el.style.transform, el.style.height]);
        el.style.transform = "";
        el.style.height = "";
      }
    }
  try {
    return read();
  } finally {
    for (const [el, t, h] of saved) {
      el.style.transform = t;
      el.style.height = h;
    }
  }
};

/** Where an element's top edge rests, in page coordinates. */
export const authoredTop = (node: HTMLElement) =>
  asAuthored([node], () => node.getBoundingClientRect().top + window.scrollY);
