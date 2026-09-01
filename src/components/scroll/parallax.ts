import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PARALLAX, SCENE, type DepthLayer } from "./depth";
import { asAuthored } from "./measure";

/* The engine behind depth.ts, and nothing else. */

/** Per-element value from a scalar or an array, in document order. */
const pick = (v: number | number[] | undefined, i: number): number =>
  v === undefined
    ? 0
    : Array.isArray(v)
      ? (v[Math.min(i, v.length - 1)] ?? 0)
      : v;

/**
 * How long a layer takes to catch up with the wheel, from how far away it is.
 */
const lagOf = (depth: number) => {
  const { base, per, max, step } = PARALLAX.lag;
  const raw = Math.min(max, base + Math.abs(depth) * per);
  return Math.round(raw / step) * step;
};

/**
 * As much of `want` px sideways as this element's clip will actually give it.
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
  /* Screen px per local px. */
  const k = r.width / (node.offsetWidth || r.width) || 1;
  /* Where the element would be with nothing written on it. */
  const cur =
    ((Number(gsap.getProperty(node, "x")) || 0) +
      ((Number(gsap.getProperty(node, "xPercent")) || 0) / 100) *
        (node.offsetWidth || 0)) *
    k;
  const slack = Math.min(r.left - cur - c.left, c.right - (r.right - cur));

  return Math.sign(want) * Math.min(Math.abs(want), Math.max(0, slack) / k);
};

/**
 * Bumped every time ScrollTrigger re-measures the page, which is the only
 * thing that can invalidate a survey — so each section is surveyed once per
 * refresh rather than once per layer per side, and the reflow that taking one
 * costs is paid seven times on a resize.
 */
let generation = 0;
ScrollTrigger.addEventListener("refreshInit", () => generation++);

/**
 * One section, as authored: where each layer rests and how big it really is.
 */
type Survey = {
  top: Map<HTMLElement, number>;
  bottom: Map<HTMLElement, number>;
  /** Screen px per local px — the scale of the stage the element lives in. */
  k: Map<HTMLElement, number>;
  /**
   * Layout height, which is what depth's px are turned into a percentage of.
   */
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
    /*
     * The whole crossing, in px of scroll: top-edge-at-the-bottom of the
     * window through to bottom-edge-at-the-top.
     */
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

      /*
       * Which of the two is on top decides which way "closing" points — Early
       * Access leads with its artwork and puts its words underneath.
       */
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

/** The two states a layer is driven between, as plain property objects. */
const state = (
  node: HTMLElement,
  section: HTMLElement,
  l: DepthLayer,
  i: number,
  gain: number,
  side: -1 | 0 | 1,
  /*
   * How much of the declared depth this section can afford at this end — see
   * guard.
   */
  fit: (side: -1 | 1) => number,
  survey: () => Survey,
) => {
  const d = pick(l.depth, i) * gain;
  const s = pick(l.sway, i) * gain;
  const swell = l.swell ? 1 + (l.swell - 1) * gain : 1;

  const vars: gsap.TweenVars = {};
  /*
   * The element's AUTHORED height, not the one it happens to have right now.
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

/** Which of the three tiers this build is for. */
export type Tier = "full" | "phone" | "calm";

/**
 * Whether this element is part of the layout the window is currently getting.
 */
const shown = (el: Element) => el.getClientRects().length > 0;

/** Builds every section's depth layers and their triggers. */
export function parallaxScene({ tier }: { tier: Tier }) {
  const full = tier === "full";

  for (const spec of SCENE) {
    const el = document.querySelector<HTMLElement>(
      `[data-sequence-section='${spec.id}']`,
    );
    if (!el) {
      console.warn(`[parallax] no element for section "${spec.id}"`);
      continue;
    }

    const exitOnly = spec.half === "exit";

    /* One timeline per scrub value, not one per layer. */
    const groups = new Map<
      number,
      { tl: gsap.core.Timeline; nodes: HTMLElement[] }
    >();

    /* Resolved first, built second. */
    type Resolved = {
      layer: DepthLayer;
      node: HTMLElement;
      i: number;
      gain: number;
    };
    const resolved: Resolved[] = [];

    for (const layer of spec.layers) {
      /* The layer as this tier states it, and what it is worth here. */
      const l: DepthLayer = full
        ? layer
        : {
            find: layer.find,
            light: layer.light,
            depth: tier === "phone" ? layer.phone : layer.depth,
          };
      const gain = (spec.gain ?? 1) * (tier === "calm" ? (layer.calm ?? 0) : 1);
      if (gain === 0 || l.depth === undefined) continue;

      const nodes = gsap.utils
        .toArray<HTMLElement>(el.querySelectorAll(layer.find))
        .filter(shown);
      if (!nodes.length) {
        console.warn(`[parallax] ${spec.id}: nothing matches "${layer.find}"`);
        continue;
      }

      nodes.forEach((node, i) => resolved.push({ layer: l, node, i, gain }));
    }

    /* The heading, and everything that could run into it. */
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

    resolved.forEach(({ layer: l, node, i, gain }) => {
      if (!moves(l, i, gain)) return;

      const key = lagOf(pick(l.depth, i) * gain);
      let group = groups.get(key);
      if (!group) {
        group = { tl: gsap.timeline({ paused: true }), nodes: [] };
        groups.set(key, group);
      }
      group.nodes.push(node);

      /* Light is exempt from the guard — see DepthLayer.light. */
      const allowed = l.light ? () => 1 : fit;

      const rest = state(node, el, l, i, gain, 0, allowed, survey);

      if (!exitOnly)
        group.tl.fromTo(
          node,
          state(node, el, l, i, gain, -1, allowed, survey),
          { ...rest, duration: 1, ease: "none" },
          0,
        );

      /* fromTo rather than to, with the resting state written out. */
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
        /*
         * The section already fills the window when the page opens, so there
         * is no arriving half to play — see SectionDepth.half.
         */
        start: exitOnly ? "top top" : "top bottom",
        end: "bottom top",
        scrub: lag,
        animation: tl,
        /*
         * The px-to-percent conversions above are functions of each element's
         * own box, and every box on this page is a function of the window.
         */
        invalidateOnRefresh: true,
        /*
         * Promoted while the section is anywhere near the window and dropped
         * again the moment it is not.
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
