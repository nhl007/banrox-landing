import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PARALLAX, SCENE, type DepthLayer } from "./depth";

/*
 * The engine behind depth.ts, and nothing else.
 *
 * Every decision about WHAT moves and WHY is in that file. This one only knows
 * how to take a layer, a distance and a section, and turn them into a scrubbed
 * ScrollTrigger — so a new transition is an entry in the scene and never an
 * edit here, which is the same bargain sections.ts and timelines.ts already
 * make with the controller.
 *
 * ---------------------------------------------------------------------------
 * THE WINDOW A SECTION IS ANIMATED ACROSS
 *
 * From the moment its top edge reaches the bottom of the window to the moment
 * its bottom edge leaves the top. For a full-height section that is two
 * windows of scrolling, and the halfway point — where every layer here is at
 * rest — is exactly where the section fills the window.
 *
 * That midpoint is load-bearing. It means depth can never be blamed for a
 * layout that does not line up: whenever a section is the thing you are
 * looking at, every part of it is exactly where the stylesheet put it, and all
 * of this is happening on the way in and on the way out.
 */

/** Per-element value from a scalar or an array, in document order. */
const pick = (v: number | number[] | undefined, i: number): number =>
  v === undefined
    ? 0
    : Array.isArray(v)
      ? (v[Math.min(i, v.length - 1)] ?? 0)
      : v;

/**
 * How long a layer takes to catch up with the wheel, from how far away it is.
 *
 * See PARALLAX.lag. Quantised, so that the layers of one section collapse into
 * two or three scrub values and therefore two or three ScrollTriggers rather
 * than one per element.
 */
const lagOf = (depth: number) => {
  const { base, per, max, step } = PARALLAX.lag;
  const raw = Math.min(max, base + Math.abs(depth) * per);
  return Math.round(raw / step) * step;
};

/**
 * As much of `want` px sideways as this element's clip will actually give it.
 *
 * The vertical axis is handled once, in the stylesheet: every stage carries
 * 64px of clip bleed that costs its scale nothing (see --stage-bleed, which is
 * also where the one layer that deliberately overruns it is accounted for). The
 * horizontal axis cannot be solved that way, because the slack is not a constant —
 * it is whatever is left over between the window and the artboard once the
 * stage has been fitted, and on a window near a stage's own width that is
 * exactly nothing. Measured: the approve diagram has 161px either side at
 * 1440 and none at all at 1024.
 *
 * So the distance is a wish rather than an instruction. Where there is room the
 * layer gets what depth.ts asked for; where there is not it gets what there is,
 * down to nothing — which is the same bargain --stage-scale already strikes,
 * and much better than the alternative, which is a hard vertical edge sliced
 * down a card for as long as the section is on screen.
 *
 * NOT applied when the thing doing the clipping is the section itself. That is
 * the case for every ambient layer on the page, and there the clip is not a
 * frame the artwork has to stay inside — it is the edge of the window, the
 * light is a bloom with no edge of its own, and reaching it is the point. See
 * .screen-glow.
 */
const room = (node: HTMLElement, section: HTMLElement, want: number) => {
  if (!want) return want;

  let clip: HTMLElement | null = node.parentElement;
  while (
    clip &&
    clip !== section &&
    getComputedStyle(clip).overflowX === "visible"
  )
    clip = clip.parentElement;
  if (!clip || clip === section) return want;

  const r = node.getBoundingClientRect();
  const c = clip.getBoundingClientRect();
  /* Screen px per local px. Anything inside a stage is in that stage's own
     coordinates, and the stage is scaled to the window; `want` is in those
     coordinates and the rects are not. */
  const k = r.width / (node.offsetWidth || r.width) || 1;
  /*
   * Where the element would be with nothing written on it. Both halves of the
   * translate have to come off, not just this system's: the arrivals park the
   * request card and the vote list 80px off to the sides until their section is
   * reached, and measuring the slack while they are parked there would report a
   * stage far tighter than it is.
   */
  const cur =
    ((Number(gsap.getProperty(node, "x")) || 0) +
      ((Number(gsap.getProperty(node, "xPercent")) || 0) / 100) *
        (node.offsetWidth || 0)) *
    k;
  const slack = Math.min(r.left - cur - c.left, c.right - (r.right - cur));

  return Math.sign(want) * Math.min(Math.abs(want), Math.max(0, slack) / k);
};

/*
 * ---------------------------------------------------------------------------
 * MEASURING A SECTION AS THE STYLESHEET DESCRIBES IT
 *
 * Everything below this line needs to know where things REST — where a heading
 * sits, how tall a panel is, how many screen pixels one of a stage's units is
 * worth. None of that can be read off the live page, because at the moment
 * these measurements are taken the page is mid-animation and lying about all
 * three:
 *
 *   - An arrival parks its payload `lift` px low until its section is reached,
 *     so every gap in a section that has not arrived yet reads 56px short.
 *   - The Early Access card spends its entrance rotated a quarter turn, so its
 *     bounding box is 420px wide where the card is 260 — measured, that made a
 *     stage unit look 1.62 screen pixels instead of 1.
 *   - The Alone Vs Together panels are SHORTER than they end up: their rails
 *     are brought out by growing the panel (see alonePanels, which explains why
 *     it has to be a height and not a clip), so at the moment depth converts
 *     its px into a percentage of the panel's height, that height is 496px on
 *     its way to 628. The percentage was right and the box it applied to grew
 *     by a quarter underneath it, so the panels travelled 26.6% further than
 *     depth.ts asks for. Reported by three independent readings of the page.
 *
 * So the measurements are taken with every inline transform and height this
 * page has written temporarily removed — from the elements and from their
 * ancestors, since a nested layer inherits its parent's offset. What is left is
 * the layout the CSS describes, which is the only stable thing to convert
 * against. Restored in a `finally`, synchronously, so nothing can paint in
 * between, and GSAP is untouched by it: its own transform cache is separate
 * from the inline styles, so it neither notices nor has to be told.
 */
const asAuthored = <T>(nodes: HTMLElement[], read: () => T): T => {
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

/**
 * Bumped every time ScrollTrigger re-measures the page, which is the only thing
 * that can invalidate a survey — so each section is surveyed once per refresh
 * rather than once per layer per side, and the reflow that taking one costs is
 * paid seven times on a resize instead of seventy.
 */
let generation = 0;
ScrollTrigger.addEventListener("refreshInit", () => generation++);

/** One section, as authored: where each layer rests and how big it really is. */
type Survey = {
  top: Map<HTMLElement, number>;
  bottom: Map<HTMLElement, number>;
  /** Screen px per local px — the scale of the stage the element lives in. */
  k: Map<HTMLElement, number>;
  /** Layout height, which is what depth's px are turned into a percentage of. */
  h: Map<HTMLElement, number>;
  secTop: number;
};

const surveyor = (section: HTMLElement, nodes: HTMLElement[]) => {
  let gen = -1;
  let out: Survey | null = null;
  return (): Survey => {
    if (out && gen === generation) return out;
    gen = generation;
    out = asAuthored(nodes, () => {
      const s: Survey = {
        top: new Map(),
        bottom: new Map(),
        k: new Map(),
        h: new Map(),
        secTop: section.getBoundingClientRect().top,
      };
      for (const n of nodes) {
        const r = n.getBoundingClientRect();
        const h = n.offsetHeight;
        s.top.set(n, r.top);
        s.bottom.set(n, r.bottom);
        s.k.set(n, r.height / (h || r.height) || 1);
        s.h.set(n, h || 1);
      }
      return s;
    });
    return out;
  };
};

/** One thing the guard below has to keep out of the heading's way. */
type Content = { node: HTMLElement; d: number };

/**
 * How much of a section's declared depth actually fits between its heading and
 * its payload — see PARALLAX.spend for why there is a limit at all.
 *
 * The heading and the payload are two blocks with --screen-gap between them and
 * NOTHING else, and depth moves them independently. Three of the seven sections
 * give the heading a near depth and something at the top of the payload a far
 * one, which means that as the section rises into the window those two travel
 * towards each other: measured at 1440x720, the approve diagram's Squad card
 * came 30px into the sub-paragraph above it.
 *
 * Returns a multiplier per side, applied to depth and to nothing else. One
 * factor for the whole section rather than one per element, so that clamping
 * the offender does not quietly rearrange the diagram's parts relative to each
 * other on the way in and back again on the way out.
 *
 * ---------------------------------------------------------------------------
 * WHY THE EXTREMES ARE NOT WHAT IS MEASURED AGAINST
 *
 * A layer only reaches its full offset at the very ends of the crossing, and
 * both ends are moments when the section is off screen — at progress 0 its top
 * edge is at the bottom of the window and its payload is a windowful below
 * that. Clamping the extreme would spend the whole budget on a frame nobody
 * sees, and would bite hard on a 1080-tall window that has no problem at all:
 * measured, nothing on this page is clamped at 1920x1080 and every layer there
 * still travels its full declared distance in both directions.
 *
 * So what is measured is the largest offset that is ever ON SCREEN — and it is
 * the GAP that has to be on screen, not either block, because a collision
 * nobody can see is not a collision. The gap is bounded by two edges, and each
 * end of the crossing is gated by a different one: coming up the page its lower
 * edge arrives first, and going off the top its upper edge leaves first. On the
 * way in, then, what matters is how much of the offset survives to the moment
 * the lower edge crosses into the window; on the way out, how much of it has
 * grown by the moment the upper edge leaves.
 *
 * Getting that wrong in the obvious way — gating both ends on the payload —
 * over-clamps. Alone Vs Together's panels are still on screen at progress 0.95,
 * but the heading they could run into left the top of the window at 0.67, so
 * only the first third of that closing is ever witnessed. Gated on the panels
 * instead, the guard cut the section's leaving travel to under a third — 27px
 * down to 7.9 — to head off an overlap that finished a windowful above the
 * fold. Gated on the gap it takes about a quarter off it on a short window and
 * nothing at all on a tall one, which is the amount that was actually at
 * stake.
 *
 * Every term is a function of the window, so all of it is re-derived on each
 * refresh.
 */
const guard =
  (
    section: HTMLElement,
    survey: () => Survey,
    copy: Content | null,
    content: Content[],
  ) =>
  (side: -1 | 1) => {
    if (!copy || !content.length) return 1;

    const vh = window.innerHeight;
    const h = section.offsetHeight;
    /* The whole crossing, in px of scroll: top-edge-at-the-bottom of the window
       through to bottom-edge-at-the-top. */
    const span = vh + h;
    if (span <= 0) return 1;

    const m = survey();
    const secTop = m.secTop;
    const c = {
      top: m.top.get(copy.node) ?? 0,
      bottom: m.bottom.get(copy.node) ?? 0,
      k: m.k.get(copy.node) ?? 1,
    };
    /* Positive is downwards, screen px, at this end of the crossing. */
    const copyMove = side * copy.d * c.k;

    let worst = 1;
    for (const { node, d } of content) {
      const e = {
        top: m.top.get(node) ?? 0,
        bottom: m.bottom.get(node) ?? 0,
        k: m.k.get(node) ?? 1,
      };
      const elemMove = side * d * e.k;

      /* Which of the two is on top decides which way "closing" points — Early
         Access leads with its artwork and puts its words underneath. */
      const under = e.top >= c.bottom;
      const clearance = under ? e.top - c.bottom : c.top - e.bottom;
      if (clearance <= 0) continue;

      const closing = under ? copyMove - elemMove : elemMove - copyMove;
      if (closing <= 0) continue; /* they part on this side; nothing to guard */

      /* The two edges of the gap itself, as distances into the section. */
      const lower = (under ? e.top : c.top) - secTop;
      const upper = (under ? c.bottom : e.bottom) - secTop;
      const onScreen =
        side < 0
          ? 1 - (2 * lower) / span /* what is left when the gap arrives */
          : (2 * (vh + upper)) / span - 1; /* what it has grown to as it goes */
      const seen = closing * Math.max(0, Math.min(1, onScreen));
      if (seen <= 0) continue;

      worst = Math.min(worst, (clearance * PARALLAX.spend) / seen);
    }
    return Math.min(1, worst);
  };

/**
 * The two states a layer is driven between, as plain property objects.
 *
 * `side` is -1 for the arriving end and +1 for the leaving end. Depth flips
 * with it — that reversal IS the parallax, since a layer that is high in its
 * box on the way in and low on the way out is a layer that moved less than the
 * page did. Sway and swell do NOT flip: they are the same at both ends and
 * neutral in the middle, so they read as a gathering rather than a slide.
 *
 * Distances arrive in px and leave as percentages of the element's own box,
 * which is what keeps this out of the arrivals' way — see the note on units in
 * depth.ts. They are functions so that a resize re-measures them; the triggers
 * below invalidate on refresh, which is what calls them again.
 */
const state = (
  node: HTMLElement,
  section: HTMLElement,
  l: DepthLayer,
  i: number,
  gain: number,
  side: -1 | 0 | 1,
  /* How much of the declared depth this section can afford at this end — see
     guard. Light is exempt and passes 1. */
  fit: (side: -1 | 1) => number,
  survey: () => Survey,
) => {
  const d = pick(l.depth, i) * gain;
  const s = pick(l.sway, i) * gain;
  const swell = l.swell ? 1 + (l.swell - 1) * gain : 1;

  const vars: gsap.TweenVars = {};
  /*
   * The element's AUTHORED height, not the one it happens to have right now.
   * A percentage is only worth what the box it is a percentage of is worth, and
   * two of these boxes are a different size at the moment this is evaluated
   * than they are once their section has arrived — see asAuthored.
   */
  const authored = () => survey().h.get(node) ?? node.offsetHeight ?? 1;

  if (d)
    vars.yPercent =
      side === 0 ? 0 : () => (side * d * fit(side) * 100) / (authored() || 1);
  if (s)
    vars.xPercent =
      side === 0
        ? 0
        : () => (room(node, section, s) * 100) / (node.offsetWidth || 1);
  if (swell !== 1) vars.scale = side === 0 ? 1 : swell;
  if (l.fade) vars.opacity = side === 0 ? 1 : l.fade[side < 0 ? 0 : 1];
  return vars;
};

/** Whether a layer moves at all once this tier's gain has been applied. */
const moves = (l: DepthLayer, i: number, gain: number) =>
  gain !== 0 &&
  (pick(l.depth, i) !== 0 || pick(l.sway, i) !== 0 || !!l.swell || !!l.fade);

/**
 * Builds every section's depth layers and their triggers.
 *
 * Call from inside a gsap.matchMedia handler: everything created here is
 * registered against the enclosing gsap context, so the whole system is torn
 * down by the same revert that tears the sequence down — on a route change, on
 * a resize across the gate, or when someone turns reduced motion on.
 *
 * `calm` selects the restrained tier. There it runs on the ambient light and
 * nothing else, at a fraction of the distance, with no sideways movement, no
 * scaling and no fading — see DepthLayer.calm.
 */
export function parallaxScene({ calm }: { calm: boolean }) {
  for (const spec of SCENE) {
    const el = document.querySelector<HTMLElement>(
      `[data-sequence-section='${spec.id}']`,
    );
    if (!el) {
      console.warn(`[parallax] no element for section "${spec.id}"`);
      continue;
    }

    const exitOnly = spec.half === "exit";

    /*
     * One timeline per scrub value, not one per layer.
     *
     * Layers at similar distances share a lag (see lagOf), and layers that
     * share a lag can share a timeline and therefore a trigger. Thirty-six
     * elements on this page have depth; quantising the lag resolves them into
     * sixteen triggers rather than thirty-six, two or three per section.
     */
    const groups = new Map<
      number,
      { tl: gsap.core.Timeline; nodes: HTMLElement[] }
    >();

    /*
     * Resolved first, built second.
     *
     * The guard below has to know every layer of the section before it can say
     * how much of the section's depth fits, so nothing can be turned into a
     * tween until they have all been found.
     */
    type Resolved = {
      layer: DepthLayer;
      node: HTMLElement;
      i: number;
      gain: number;
    };
    const resolved: Resolved[] = [];

    for (const layer of spec.layers) {
      /*
       * The restrained tier's amplitude, folded into the section's own taper.
       * Zero — the default for every layer that is not ambient light — drops
       * the layer entirely rather than animating it by nothing.
       */
      const gain = (spec.gain ?? 1) * (calm ? (layer.calm ?? 0) : 1);
      if (gain === 0) continue;

      const nodes = gsap.utils.toArray<HTMLElement>(
        el.querySelectorAll(layer.find),
      );
      if (!nodes.length) {
        console.warn(`[parallax] ${spec.id}: nothing matches "${layer.find}"`);
        continue;
      }

      nodes.forEach((node, i) => resolved.push({ layer, node, i, gain }));
    }

    /*
     * The heading, and everything that could run into it. Light is left out on
     * purpose — it is behind the whole section and already overlaps the words
     * at rest, so measuring it against them would clamp it to nothing.
     */
    const asContent = (r: Resolved) => ({
      node: r.node,
      d: pick(r.layer.depth, r.i) * r.gain,
    });
    const copyRec = resolved.find((r) =>
      r.node.classList.contains("screen-copy"),
    );
    const survey = surveyor(
      el,
      resolved.map((r) => r.node),
    );
    const fit = guard(
      el,
      survey,
      copyRec ? asContent(copyRec) : null,
      resolved
        .filter(
          (r) => r !== copyRec && !r.layer.light && pick(r.layer.depth, r.i),
        )
        .map(asContent),
    );

    resolved.forEach(({ layer, node, i, gain }) => {
      /* Sideways movement, scaling and fading are the full tier's only. A
         phone gets distance and nothing else. */
      const l: DepthLayer = calm
        ? { find: layer.find, depth: layer.depth }
        : layer;
      if (!moves(l, i, gain)) return;

      const key = lagOf(pick(l.depth, i) * gain);
      let group = groups.get(key);
      if (!group) {
        group = { tl: gsap.timeline({ paused: true }), nodes: [] };
        groups.set(key, group);
      }
      group.nodes.push(node);

      /* Light is exempt from the guard — see DepthLayer.light. */
      const allowed = layer.light ? () => 1 : fit;

      const rest = state(node, el, l, i, gain, 0, allowed, survey);

      if (!exitOnly)
        group.tl.fromTo(
          node,
          state(node, el, l, i, gain, -1, allowed, survey),
          { ...rest, duration: 1, ease: "none" },
          0,
        );

      /*
       * fromTo rather than to, with the resting state written out.
       *
       * A `to` records its start values the first time it renders, and a
       * scrubbed timeline can be invalidated and re-rendered at any progress
       * — so the second half would record "wherever the layer happened to be
       * when the window was resized" as the place it starts from, and the
       * section would drift a little further off every time. Stating both
       * ends means a refresh cannot lose the origin. The same lesson heroFold
       * learned the hard way; see timelines.ts.
       *
       * And immediateRender is off because this tween exists from the moment
       * the trigger does. A fromTo renders itself as soon as it is built
       * unless told not to, and rendering this one would drop the layer
       * straight into its leaving state — a section parked at its exit
       * before the reader has arrived at it.
       */
      group.tl.fromTo(
        node,
        rest,
        {
          ...state(node, el, l, i, gain, 1, allowed, survey),
          duration: 1,
          ease: "none",
          immediateRender: false,
        },
        exitOnly ? 0 : 1,
      );
    });

    for (const [lag, { tl, nodes }] of groups)
      ScrollTrigger.create({
        trigger: el,
        /* The section already fills the window when the page opens, so there is
           no arriving half to play — see SectionDepth.half. */
        start: exitOnly ? "top top" : "top bottom",
        end: "bottom top",
        scrub: lag,
        animation: tl,
        /* The px-to-percent conversions above are functions of each element's
           own box, and every box on this page is a function of the window. */
        invalidateOnRefresh: true,
        /*
         * Promoted while the section is anywhere near the window and dropped
         * again the moment it is not. Left on permanently this would be ~30
         * full-width composited layers held for the life of the page, most of
         * them for sections nobody is looking at; toggled, it is the six or so
         * belonging to the two sections currently in play.
         *
         * A glow that drifts on its own clock (see glowDrift) keeps its
         * promotion either way — that one never stops, so taking it away is a
         * layer thrown out and rebuilt for nothing.
         */
        onToggle: (self) => {
          for (const n of nodes)
            n.style.willChange =
              self.isActive || n.hasAttribute("data-glow-from")
                ? "transform"
                : "";
        },
      });
  }
}
