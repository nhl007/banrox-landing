import gsap from "gsap";
import { SQUAD_CARD } from "@/components/ui/SquadCard";
import { asAuthored, asDrawn, drawnRect } from "./measure";
import { MOTION } from "./motion";

/*
 * One factory per beat: each returns a PAUSED timeline the controller nests
 * into its section and drives from the scroll.
 *
 * These run backwards — the scene scrubs a section's beats against its window
 * of scroll, so scrolling up rewinds them. Anything added here has to survive
 * being reversed, which means tweening properties rather than performing
 * actions. Measuring the DOM at build time is fine; distances are read through
 * functions that re-measure rather than captured once, because the stages
 * scale with the window.
 */

/**
 * Whether this element is part of the layout the window is currently getting.
 */
const shown = (el: Element) => el.getClientRects().length > 0;

const q = (root: HTMLElement, role: string) =>
  gsap.utils
    .toArray<HTMLElement>(root.querySelectorAll(`[data-reveal='${role}']`))
    .filter(shown);

/** The first element matching `sel` that this tier actually renders. */
export const one = (root: HTMLElement, sel: string) =>
  gsap.utils.toArray<HTMLElement>(root.querySelectorAll(sel)).find(shown) ??
  null;

/** Every run of connector wiring under `root` with a given name. */
const runs = (root: HTMLElement, name: string) =>
  q(root, "lines").filter((run) => run.dataset.run === name);

/** gsap.set and timeline.to, for a set of elements this tier may not render. */
const park = (targets: HTMLElement[], vars: gsap.TweenVars) => {
  if (targets.length) gsap.set(targets, vars);
};

const move = (
  tl: gsap.core.Timeline,
  targets: HTMLElement[],
  vars: gsap.TweenVars,
  at?: number | string,
) => (targets.length ? tl.to(targets, vars, at) : tl);

/**
 * A paused timeline with the shared ease, which every beat below starts from.
 */
const beat = () =>
  gsap.timeline({ paused: true, defaults: { ease: "power1.out" } });

/**
 * The heading's own duration and ease, which a section's payload arrives on so
 * that the two read as one block settling rather than as a diagram waiting its
 * turn behind some words.
 */
const inStep = () => ({
  duration: MOTION.copy.duration,
  ease: MOTION.copy.ease,
});

/** Where a section's ambient glow travels in from. */
export const glowFrom = (el: HTMLElement) => {
  const [fx = 0, fy = 0] = (el.dataset.glowFrom ?? "").split(" ").map(Number);
  const { travel } = MOTION.glow;
  return { x: travel * fx, y: travel * fy };
};

/** The start state that goes with it: out of nothing, and displaced. */
const glowStart = (els: HTMLElement[]) =>
  els.forEach((el) => gsap.set(el, { opacity: 0, ...glowFrom(el) }));

/** Folds a section's own ambient glow into the beat that opens it. */
const glowIn = (tl: gsap.core.Timeline, el: HTMLElement, runs?: number) => {
  const glow = q(el, "glow");
  if (!glow.length) return tl;

  glowStart(glow);
  return tl.to(
    glow,
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration: runs ?? tl.duration(),
      ease: MOTION.copy.ease,
    },
    0,
  );
};

/**
 * The heading block: badge, headline, sub-paragraph, each scaling up out of
 * nothing as it rises.
 */
export function copyIn(el: HTMLElement) {
  const copy = q(el, "copy");
  gsap.set(copy, {
    opacity: MOTION.enter.from,
    y: MOTION.copy.rise,
    transformOrigin: "50% 100%",
  });

  const tl = beat().to(copy, {
    opacity: 1,
    y: 0,
    duration: MOTION.copy.duration,
    ease: MOTION.copy.ease,
    stagger: MOTION.copy.stagger,
  });

  /*
   * And the ground the words arrive on, coming in underneath them from
   * whichever direction this section's light comes from.
   */
  return glowIn(tl, el);
}

/** Where a run's light starts and ends, in the run's own coordinates. */
const passOf = (run: HTMLElement) => {
  const spark = run.querySelector<HTMLElement>("[data-spark]");
  if (!spark) return null;

  const down = run.dataset.traceAxis === "y";
  /*
   * Mirrored artwork mirrors this element's own axes with it, so the light has
   * to travel backwards in its own coordinates to come out forwards on screen.
   */
  const flip = "traceFlip" in run.dataset;
  /*
   * The run plus the light's own length: it starts parked just off one end and
   * finishes just off the other, so it is never sitting on the artwork at
   * rest.
   */
  const far = () =>
    down
      ? run.offsetHeight + spark.offsetHeight
      : run.offsetWidth + spark.offsetWidth;

  return {
    spark,
    along: down ? "y" : "x",
    from: flip ? far : () => 0,
    to: flip ? () => 0 : far,
  };
};

/**
 * Draws the given connector runs, in order, and runs a light down each once it
 * is whole.
 */
const traceRuns = (
  tl: gsap.core.Timeline,
  runs: HTMLElement[],
  at: number | string,
  stagger = MOTION.trace.stagger,
) => {
  /* Where the previous run's wipe began. */
  let opened: number | null = null;

  runs.forEach((run, i) => {
    const down = run.dataset.traceAxis === "y";
    const flip = "traceFlip" in run.dataset;
    const shut = down
      ? flip
        ? "inset(100% 0% 0% 0%)"
        : "inset(0% 0% 100% 0%)"
      : flip
        ? "inset(0% 0% 0% 100%)"
        : "inset(0% 100% 0% 0%)";

    gsap.set(run, { opacity: 1, clipPath: shut });
    tl.to(
      run,
      { clipPath: "inset(0% 0% 0% 0%)", ...MOTION.trace.lines },
      i && opened !== null ? opened + stagger : at,
    );

    /*
     * Resolved rather than assumed: `at` may be relative ("-=0.5"), and this
     * is the only place the wipe's real position on the timeline is known.
     */
    const wipe = tl.recent() as gsap.core.Tween;
    opened = wipe.startTime();

    const pass = passOf(run);
    if (!pass) return;

    gsap.set(pass.spark, { opacity: 1, x: 0, y: 0, [pass.along]: pass.from });
    tl.to(
      pass.spark,
      { [pass.along]: pass.to, ...MOTION.trace.spark },
      opened + wipe.duration(),
    );
  });
};

/** Every run inside `root`, in document order. */
const trace = (
  tl: gsap.core.Timeline,
  root: HTMLElement,
  at: number | string,
) => traceRuns(tl, q(root, "lines"), at);

/** The light going down every connector in a section, over and over. */
export function traceLoop(el: HTMLElement) {
  /*
   * Paced like the beats, which the controller does for those but not for
   * ambients — and this one has to match the arrival pass it continues.
   */
  const tl = gsap.timeline({ paused: true }).timeScale(MOTION.pace);

  q(el, "lines").forEach((run, i) => {
    const pass = passOf(run);
    if (!pass) return;
    tl.fromTo(
      pass.spark,
      { opacity: 1, [pass.along]: pass.from },
      { [pass.along]: pass.to, ...MOTION.trace.spark },
      MOTION.trace.gap + i * MOTION.trace.stagger,
    );
  });

  if (tl.duration()) tl.repeat(-1);

  return tl;
}

/* -------------------------------------------------------------------------- */

/** A number in, a number out — every knot carries one. */
type Ease = (t: number) => number;

const clamp01: Ease = (t) => Math.min(1, Math.max(0, t));
/** `sine.inOut`, as a number rather than an ease. */
const soft: Ease = (t) => 0.5 - Math.cos(Math.PI * clamp01(t)) / 2;
/** `3t^2 - 2t^3`. */
const smooth: Ease = (t) => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};
/** `6t^5 - 15t^4 + 10t^3`, zero in both derivatives at either end. */
const smoother: Ease = (t) => {
  const u = clamp01(t);
  return u * u * u * (u * (u * 6 - 15) + 10);
};

/** One link of the chain between a slot and its section. */
type ChainLink = { el: HTMLElement; w: number; h: number; k: number };

/**
 * How far the depth system currently has a chain displaced from where it
 * rests, in px. `k` is each link's own layout scale, so a percentage written
 * by GSAP resolves in the same units the rest of this works in.
 */
const chainDrift = (d: { chain: ChainLink[] }) => {
  let x = 0;
  let y = 0;
  for (const n of d.chain) {
    x += ((Number(gsap.getProperty(n.el, "xPercent")) || 0) / 100) * n.w * n.k;
    y += ((Number(gsap.getProperty(n.el, "yPercent")) || 0) / 100) * n.h * n.k;
  }
  return { x, y };
};

/** One place the card stands in for something, as the page draws it. */
type Dock = {
  el: HTMLElement;
  chain: ChainLink[];
  /** What the chain was already displaced by when this was measured. */
  drift0: { x: number; y: number };
  /** Centre, in DOCUMENT space. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The scroll position at which the element is centred in the window. */
  centre: number;
};

const measureDock = (el: HTMLElement): Dock => {
  const chain: ChainLink[] = [];
  const { r, drift0 } = asDrawn([el], () => {
    /* A link's layout scale: what its box measures against what it declares. */
    const k = (n: HTMLElement) => {
      const b = n.getBoundingClientRect();
      return b.width / (n.offsetWidth || b.width) || 1;
    };
    chain.length = 0;
    chain.push({ el, w: el.offsetWidth, h: el.offsetHeight, k: k(el) });
    for (
      let p = el.parentElement;
      p && !p.dataset.sequenceSection;
      p = p.parentElement
    )
      chain.push({ el: p, w: p.offsetWidth, h: p.offsetHeight, k: k(p) });

    return { r: el.getBoundingClientRect(), drift0: chainDrift({ chain }) };
  });

  return {
    el,
    chain,
    drift0,
    x: r.left + window.scrollX + r.width / 2,
    y: r.top + window.scrollY + r.height / 2,
    w: r.width,
    h: r.height,
    centre: Math.max(
      0,
      r.top + window.scrollY + r.height / 2 - window.innerHeight / 2,
    ),
  };
};

/**
 * One point on the card's path. Between two of them the card is on a cubic
 * that passes through both AND matches the speed recorded at both, so the
 * whole journey is one curve rather than a run of straight legs with corners
 * where they meet. See `slopes` for where those speeds come from.
 */
type Knot = {
  /** Scroll position. Forced strictly increasing as the path is built. */
  s: number;
  /** Document space when `win` is 0, window space when it is 1. */
  x: number;
  y: number;
  win: number;
  scale: number;
  /** rotationZ. -90 is the card lying on its side, which is most of the trip. */
  rot: number;
  /** rotationX / rotationY, on the swing inside the turn. */
  rx: number;
  ry: number;
  /** scaleY multiplier: 1 normally, near nothing when the card is edge-on. */
  squash: number;
  /** Set when this knot sits on a slot, so its live drift is tracked. */
  dock: Dock | null;
  /**
   * How fast each of CHANNELS is changing AT this knot, per pixel of scroll,
   * filled in once the whole path is known. A knot is somewhere the card
   * passes through at a known speed, not a corner it turns.
   */
  v: number[];
};

/** Everything the path carries, in the order slopes are stored. */
const CHANNELS = [
  "x",
  "y",
  "win",
  "scale",
  "rot",
  "rx",
  "ry",
  "squash",
] as const;
type Channel = (typeof CHANNELS)[number];
const CH = Object.fromEntries(CHANNELS.map((c, i) => [c, i])) as Record<
  Channel,
  number
>;

const KNOT: Omit<Knot, "s"> = {
  x: 0,
  y: 0,
  win: 0,
  scale: 1,
  rot: -90,
  rx: 0,
  ry: 0,
  squash: 1,
  dock: null,
  v: [],
};

/**
 * The slope at every knot, by the Fritsch-Carlson rule: the weighted harmonic
 * mean of the two secants either side, and FLAT wherever they disagree in sign
 * or either of them is zero.
 *
 * That last clause is what does the work. Every dock has a dwell, so it is two
 * knots holding the same position — a zero secant on one side, so the card
 * arrives at rest and leaves from rest with no corner at either end. The apex
 * of an arc has secants of opposite sign, so the card rounds it rather than
 * bulging past it. Everywhere else the slope is picked so that the segment
 * before a knot and the segment after it AGREE about how fast the card is
 * going. That agreement is the whole point: a jolt is not a wrong position,
 * it is two neighbouring segments disagreeing about speed.
 */
const slopes = (ks: Knot[]) => {
  for (const k of ks) k.v = new Array<number>(CHANNELS.length).fill(0);
  if (ks.length < 3) return;

  /* Scroll spent on each segment. */
  const h = ks.slice(0, -1).map((k, i) => ks[i + 1]!.s - k.s);

  for (const c of CHANNELS) {
    const d = h.map((len, i) => (ks[i + 1]![c] - ks[i]![c]) / len);
    for (let i = 1; i < ks.length - 1; i++) {
      const before = d[i - 1]!;
      const after = d[i]!;
      if (before * after <= 0) continue;
      const wb = 2 * h[i]! + h[i - 1]!;
      const wa = h[i]! + 2 * h[i - 1]!;
      ks[i]!.v[CH[c]] = (wb + wa) / (wb / before + wa / after);
    }
  }
  /* The two ends stay at zero: the card is parked at both of them. */
};

/** One channel between two knots, as a cubic that honours both slopes. */
const ride = (a: Knot, b: Knot, c: Channel, u: number, len: number) => {
  const i = CH[c];
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * a[c] +
    (u3 - 2 * u2 + u) * len * a.v[i]! +
    (3 * u2 - 2 * u3) * b[c] +
    (u3 - u2) * len * b.v[i]!
  );
};

/** Which of the three things the card is currently showing. */
type Face = "card" | "vs" | "engine" | "cut";
/**
 * One trade between two of them, centred at `at` and `hw` wide either side.
 *
 * `melt` picks how it is played. Without it the card turns away, is gone for
 * an instant at the mid-point and comes back as the other face — a change of
 * identity, which is what the VS and the engine hub are. With it the two
 * simply cross-fade, their two weights summing to one the whole way through,
 * because the card coming apart into the three step cards is not changing
 * into something else: it is already lying exactly where they are.
 */
type Swap = { at: number; hw: number; from: Face; to: Face; melt?: boolean };
/** A stretch over which a host is stood in for. */
type Taken = { el: HTMLElement; a: number; b: number };
/** A Works step, where the steps are stacked and the card rails down them. */
type Rail = { el: HTMLElement; lift: number; from: number; to: number };

/**
 * THE SQUAD CARD'S JOURNEY.
 *
 * One object crosses the whole page. It leaves the hero's fan, stands in for
 * the VS in Alone vs Together, becomes the card in the middle of the approve
 * diagram, lies over the three Works steps, turns into the engine hub in the
 * Intelligence Layer, passes the Life board down the margin, and stands up as
 * the Early Access card. It is never faded out in between: at six of those
 * places it IS the thing the section draws, and the section's own copy is
 * hidden while it is.
 *
 * The path is a list of knots in SCROLL, built once per measure and read on
 * every frame. Nothing here is expressed as a fraction of the journey — every
 * position is an absolute scroll value worked out from where the docks
 * actually are, which is why the beats are in pixels.
 */
export function squadTravel(root: HTMLElement, tier: "full" | "phone") {
  const travel = root.querySelector<HTMLElement>("[data-card-travel]");
  const turn = root.querySelector<HTMLElement>("[data-card-turn]");
  const swing = root.querySelector<HTMLElement>("[data-card-swing]");
  const whole = root.querySelector<HTMLElement>("[data-card-whole]");
  const slices = gsap.utils.toArray<HTMLElement>(
    root.querySelectorAll("[data-card-slice]"),
  );
  const faces = {
    vs: root.querySelector<HTMLElement>("[data-card-face='vs']"),
    engine: root.querySelector<HTMLElement>("[data-card-face='engine']"),
  };

  const heroEl = root.querySelector<HTMLElement>(
    "[data-sequence-section='hero']",
  );
  const fan = one(root, "[data-sequence-section='hero'] [data-reveal='fan']");
  const anchor = one(root, "[data-sequence-section='hero'] [data-fan-anchor]");
  const vsEl = one(root, "[data-sequence-section='alone'] [data-reveal='vs']");
  const trioEl = one(
    root,
    "[data-sequence-section='approve'] [data-reveal='squad']",
  );
  const hubEl = one(
    root,
    "[data-sequence-section='intelligence'] [data-reveal='hub']",
  );
  const boardEl = one(
    root,
    "[data-sequence-section='life'] [data-reveal='lane']",
  );
  const earlyEl = one(
    root,
    "[data-sequence-section='early'] [data-reveal='card']",
  );
  const worksEl = root.querySelector<HTMLElement>(
    "[data-sequence-section='works']",
  );
  const stepEls = worksEl ? q(worksEl, "step") : [];
  /* The card inside each step, which is what the hand-off writes to. */
  const stepCards = stepEls.map(
    (el) => el.querySelector<HTMLElement>("[data-card-step]") ?? el,
  );

  if (
    !travel ||
    !turn ||
    !swing ||
    !whole ||
    slices.length !== 3 ||
    !faces.vs ||
    !faces.engine ||
    !fan ||
    !heroEl ||
    !anchor ||
    !vsEl ||
    !trioEl ||
    !hubEl ||
    !boardEl ||
    !earlyEl ||
    stepEls.length !== 3
  )
    return null;

  const { dwell, morph, hover, approach } = MOTION.travel.beat;
  const works = MOTION.travel.works;
  /* Half the hold either side of the middle step, which is centred on it. */
  const half = works.hand / 2;
  const phone = tier === "phone";
  const keep = phone ? MOTION.travel.keep.phone : MOTION.travel.keep.full;

  /* Everything measure() works out and apply() reads. */
  let knots: Knot[] = [];
  let swaps: Swap[] = [];
  let taken: Taken[] = [];
  /* The stretch over which the card is three slices rather than one card. */
  let split = { a: 0, b: 0 };
  let fanOut = {
    mid: 0,
    offs: [] as { x: number; y: number }[],
  };
  /* Where the card has finished arriving, and where the hero has finished going. */
  let trade = { rise: 0, fade: 0 };
  /* Where the real step cards are driven by the card rather than by themselves. */
  let cutWindow = { a: 0, b: 0 };
  let rails: Rail[] = [];
  /* ...and where the card itself is out of the way while they arrive. */
  let railed = { a: 0, b: 0 };
  /*
   * The window the path was worked out against — and what places the card, in
   * preference to whatever the window measures THIS frame.
   *
   * On a phone those are not the same number. Safari's address bar slides away
   * as you scroll down and comes back as you scroll up, and `innerHeight`
   * changes by about 90px each time it does. ScrollTrigger deliberately does
   * not re-measure for that — a bar that comes and goes is not a resize, and
   * re-deriving the whole page every time it moved would be far worse. But it
   * means a path built against one window and placed against another, and a
   * card held to the edge of the screen then tracks the bar instead of the
   * page: it slides 90px down as the bar goes and 90px back as it returns.
   *
   * So this is read instead, and a REAL resize still refreshes it, because a
   * refresh re-runs measure() and measure() sets it.
   */
  let view = { vw: 0, vh: 0 };
  let last = 0;
  const faceFit = { vs: 1, engine: 1 };

  /*
   * The only opacity writer on this path, and a plain inline style rather than
   * gsap: it is quantised and cached, so a value that has not changed does not
   * cost a write, and nothing here ever fights gsap's transform cache.
   */
  const shade = (el: HTMLElement | null, v: number) => {
    if (!el) return;
    const s = String(Math.round(1e3 * v) / 1e3);
    if (el.dataset.op === s) return;
    el.dataset.op = s;
    el.style.opacity = s;
  };

  const stand = (el: HTMLElement, on: boolean) => {
    if (el.classList.contains("card-taken") !== on)
      el.classList.toggle("card-taken", on);
  };

  const park = () => {
    for (const el of [vsEl, trioEl, hubEl, earlyEl])
      el.classList.remove("card-taken");
    gsap.set(slices, { x: 0, y: 0 });
    gsap.set(stepCards, { clearProps: "y,clipPath,opacity" });
    for (const el of stepCards) delete el.dataset.op;
  };

  /** Re-derive the whole journey from where the page currently is. */
  const measure = () => {
    park();
    build();

    /*
     * How big each face has to be drawn to sit where the real one does: the
     * host's own width over the width of what this face holds.
     */
    for (const [key, host] of [
      ["vs", vsEl],
      ["engine", hubEl],
    ] as const) {
      const inner = faces[key]!.firstElementChild as HTMLElement | null;
      if (!inner) continue;
      const w = inner.offsetWidth;
      if (w) faceFit[key] = drawnRect(host).width / w;
    }
  };

  function build() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    view = { vw, vh };

    /*
     * Seeded, so the wobble on the arcs is the same wobble every time the page
     * is measured — a resize must not re-roll the choreography.
     */
    let seed = 23629;
    const rand = () =>
      (seed = (1664525 * seed + 0x3c6ef35f) % 0x100000000) / 0x100000000;

    rails = [];
    railed = { a: 0, b: 0 };

    const dock = {
      hero: measureDock(anchor!),
      vs: measureDock(vsEl!),
      trio: measureDock(trioEl!),
      steps: stepEls.map((el) => measureDock(el)),
      engine: measureDock(hubEl!),
      board: measureDock(boardEl!),
      early: measureDock(earlyEl!),
    };

    /* Fit by AREA, so a tall slot and a wide one of the same size agree. */
    const areaFit = (d: Dock) =>
      Math.min(
        3.2,
        Math.max(
          0.1,
          Math.sqrt((d.w * d.h) / (SQUAD_CARD.width * SQUAD_CARD.height)),
        ),
      );
    /*
     * The hero's is taken from the anchor's drawn HEIGHT rather than by area:
     * the fan is scaled by a class, which `asDrawn` deliberately leaves on, so
     * this is the size the card is actually being drawn at up there.
     */
    const heroScale = dock.hero.h / SQUAD_CARD.width;
    const trioScale = dock.trio.h / SQUAD_CARD.width;
    const earlyWide = dock.early.w / SQUAD_CARD.width;
    const vsScale = areaFit(dock.vs);
    const hubScale = areaFit(dock.engine);

    /* Where the hero is done with the card — measured as the page rests. */
    const hero = asAuthored([fan!, heroEl!], () => ({
      top: heroEl!.getBoundingClientRect().top + window.scrollY,
      fan: fan!.getBoundingClientRect().bottom + window.scrollY,
    }));
    const leave = Math.max(
      0,
      Math.min(
        phone
          ? hero.fan -
              vh * (1 - MOTION.hero.foldPhone.lead - MOTION.hero.foldPhone.out)
          : hero.top + MOTION.hero.fold.out * vh,
        /* And never so late that it has no run at the first dock. */
        dock.vs.centre - morph - dwell - MOTION.travel.beat.lead,
      ),
    );
    const enter = Math.max(
      0,
      leave - vh * (MOTION.travel.handover + MOTION.travel.grip),
    );
    trade = {
      rise: enter + vh * MOTION.travel.handover * 0.35,
      fade: enter + vh * MOTION.travel.handover,
    };

    /*
     * Are the Works steps in a row or a column? Measured off the steps
     * themselves rather than off the tier, because it is a fact about the
     * layout and it has to be re-decided on every resize.
     */
    const stacked =
      Math.max(...dock.steps.map((d) => Math.abs(d.y - dock.steps[1]!.y))) >
      0.45 * vh;

    const vsIn = dock.vs.centre - morph - dwell;
    const vsOut = dock.vs.centre + dwell + morph;
    const trioIn = dock.trio.centre - dwell;
    const trioOut = dock.trio.centre + dwell;
    const worksMid = dock.steps[1]!.centre;
    const hubIn = dock.engine.centre - morph - dwell;
    const hubOut = dock.engine.centre + dwell + morph;
    const hubFrom = hubIn - approach - hover;
    const laneIn = dock.board.centre - hover / 2;
    const laneOut = dock.board.centre + hover / 2;
    const earlyIn = dock.early.centre - morph - dwell;
    last = dock.early.centre;

    knots = [];

    /* Strictly increasing, so a squeezed layout can never fold the path back. */
    const knot = (at: number, props: Partial<Knot>) => {
      const prev = knots[knots.length - 1];
      knots.push({
        ...KNOT,
        ...props,
        s: prev ? Math.max(at, prev.s + 1) : at,
      });
    };
    const on = (d: Dock, scale: number, rot = -90): Partial<Knot> => ({
      x: d.x,
      y: d.y,
      scale,
      rot,
      dock: d,
    });
    /*
     * The lane down one side of the window, which is where the card waits
     * rather than parking on anything. Held clear of the edge by half its own
     * width — except on a phone, where it rides the edge on purpose.
     */
    const lane = (side: 1 | -1): Partial<Knot> => {
      const { margin } = MOTION.travel;
      const guard = (SQUAD_CARD.width * margin.scale) / 2 + 14;
      return {
        x: phone
          ? vw / 2 + (side * vw) / 2
          : Math.min(
              vw - guard,
              Math.max(guard, vw / 2 + side * vw * margin.side),
            ),
        y: vh * margin.line,
        win: 1,
        scale: margin.scale,
        rot: -90 + side * margin.tilt,
        rx: margin.rx,
        ry: -side * margin.ry,
      };
    };

    /* Alternating, so consecutive arcs bow opposite ways. */
    let sign: 1 | -1 = 1;
    /**
     * Travel to a pose along a bowed arc: two free knots at a third and two
     * thirds of the way, then the landing. The bow is what stops a long move
     * reading as a slide.
     */
    const bow = (
      from: number,
      to: number,
      props: Partial<Knot>,
      opts: { hug?: boolean } = {},
    ) => {
      const a = knots[knots.length - 1]!;
      const b = { ...KNOT, ...props, s: to };
      /* Too short to bow through — land it and do not spend a side. */
      if (to - from < 3) {
        knot(to, props);
        return;
      }

      const side = sign;
      sign = -sign as 1 | -1;

      const { bow: B } = MOTION.travel;
      /*
       * How far this move deviates from simply keeping pace with the page —
       * a leg that only holds still in the window is not a journey.
       */
      const reach = Math.min(
        1,
        Math.hypot(b.x - a.x, b.y - a.y - (to - from)) / (vw * B.reach),
      );
      const amp = opts.hug ? 0.15 : phone ? 1 : B.floor + (1 - B.floor) * reach;
      const lat = phone ? B.lat.phone : B.lat.full;
      const tip = phone ? B.tip.phone : B.tip.full;
      const yaw = phone ? B.yaw.phone : B.yaw.full;
      /* One roll for the whole arc, so it reads as one gesture. */
      const roll = B.roll * (0.7 + 0.6 * rand());
      const third = (to - from) / 3;

      const shape = [1, 2].map((i) => {
        const f = i / 3;
        const trail = i === 1 ? 1 : B.trail;
        const out = Math.sin(f * Math.PI) * side * (i === 1 ? 1 : 0.55) * amp;
        return {
          x: a.x + (b.x - a.x) * f + out * vw * lat,
          y: a.y + (b.y - a.y) * f + out * vh * B.drop,
          win: a.win + (b.win - a.win) * f,
          scale:
            (a.scale + (b.scale - a.scale) * f) *
            (1 - B.dip * Math.sin(f * Math.PI)),
          /* The roll turns over half way, so the card banks and comes back. */
          rot: -90 + (i === 1 ? side : -side) * roll * trail * amp,
          rx: (i === 1 ? -1 : 1) * tip * (i === 1 ? 1 : 0.4) * amp,
          ry: side * yaw * trail * amp,
        };
      });

      /*
       * The arc is three sub-legs and they are not the same length, so an even
       * third of the scroll each would have the card hurry the long ones and
       * dawdle the short one — a leg that reads as two gestures rather than
       * one. Each gets the share its own length earns instead.
       *
       * Length as the EYE measures it, which is against a page that is itself
       * moving: the same scroll-compensated distance `reach` is taken on. That
       * needs the answer to know the answer, so it is run twice — even thirds
       * to get a first measure, then again on what that gave.
       */
      const path = [a, ...shape, b];
      let mark = [third, 2 * third];
      for (let pass = 0; pass < 2; pass++) {
        const at = [from, from + mark[0]!, from + mark[1]!, to];
        const len = [0, 1, 2].map((i) => {
          /* Only the part of a sub-leg still in page coordinates scrolls. */
          const rides = 1 - (path[i]!.win + path[i + 1]!.win) / 2;
          return Math.hypot(
            path[i + 1]!.x - path[i]!.x,
            path[i + 1]!.y - path[i]!.y - rides * (at[i + 1]! - at[i]!),
          );
        });
        const all = len[0]! + len[1]! + len[2]!;
        if (!all) break;
        const span = to - from;
        /* ...but never so lopsided that a sub-leg has no room to move in. */
        const one = Math.min(0.55, Math.max(0.15, len[0]! / all));
        const two = Math.min(
          0.85,
          Math.max(one + 0.15, (len[0]! + len[1]!) / all),
        );
        mark = [one * span, two * span];
      }

      shape.forEach((k, i) => knot(from + mark[i]!, k));
      knot(to, props);
    };

    /* --- the hero, and the first two docks ------------------------------ */
    knot(enter, on(dock.hero, heroScale));
    knot(leave, on(dock.hero, heroScale));
    bow(leave, vsIn, on(dock.vs, vsScale));
    knot(vsOut, on(dock.vs, vsScale));
    bow(vsOut, trioIn, on(dock.trio, trioScale));
    knot(trioOut, on(dock.trio, trioScale));

    let worksIn: number;
    let worksOut: number;

    if (stacked) {
      /* --- Works in a column: the card goes edge-on and rails down them --- */
      const topOf = (i: number) => dock.steps[i]!.y - dock.steps[i]!.h / 2;
      const footOf = (i: number) => dock.steps[i]!.y + dock.steps[i]!.h / 2;
      const rail = topOf(0) - MOTION.travel.flat.above;
      const down = Math.max(0, rail - vh * (MOTION.travel.flat.open + 0.08));
      let cursor = down + 60;

      rails = dock.steps.map((_d, i) => {
        const from = Math.max(cursor, topOf(i) - vh * MOTION.travel.flat.open);
        const to = Math.max(
          from + 120,
          topOf(i) - vh * MOTION.travel.flat.shut,
        );
        cursor = to;
        return {
          el: stepCards[i]!,
          /* Each step starts where the card is: the rail, then the one above. */
          lift: (i === 0 ? rail : footOf(i - 1)) - topOf(i),
          from,
          to,
        };
      });
      railed = { a: rails[0]!.to, b: rails[2]!.to };

      worksIn = down - MOTION.travel.flat.turn;
      worksOut = railed.b + MOTION.travel.flat.slide;
      split = { a: 0, b: 0 };
      fanOut = { mid: worksMid, offs: [] };

      bow(
        trioOut,
        worksIn,
        { x: vw / 2, y: rail, scale: heroScale },
        { hug: true },
      );
      knot(down, {
        x: vw / 2,
        y: rail,
        scale: heroScale,
        squash: MOTION.travel.squash,
      });
      knot(railed.a, {
        x: vw / 2,
        y: rail,
        scale: heroScale,
        squash: MOTION.travel.squash,
      });
      knot(railed.b, {
        x: vw / 2,
        y: footOf(2),
        scale: heroScale,
        squash: MOTION.travel.squash,
      });
      knot(worksOut, {
        x: vw / 2 + 0.3 * vw,
        y: 0.62 * vh,
        win: 1,
        scale: MOTION.travel.margin.scale,
        rot: -82,
      });
    } else {
      /* --- Works in a row: the card cuts into three and becomes them ----- */
      worksIn = worksMid - works.fan - half;
      worksOut = worksMid + half + works.fan;
      bow(trioOut, worksIn, on(dock.steps[1]!, heroScale));
      knot(worksOut, on(dock.steps[1]!, heroScale));

      const r = heroScale || 1;
      const third = SQUAD_CARD.height / 3;
      fanOut = {
        mid: worksMid,
        /*
         * Where each third has to go to be centred on its own step. Nothing
         * here resizes it: the card comes APART into three, it does not also
         * grow into three, so a third stays the size it is in the card and the
         * three of them together are still exactly the card.
         *
         * Everything under the turn lives in a frame rotated a quarter, which
         * is why a step's y is the slice's x and its x is the slice's y.
         */
        offs: dock.steps.map((d, i) => ({
          x: -((d.y - dock.steps[1]!.y) / r),
          /* ...less the offset the slice already carries in the markup. */
          y:
            (d.x - dock.steps[1]!.x) / r +
            SQUAD_CARD.height / 2 -
            (i + 0.5) * third,
        })),
      };
      split = { a: worksIn, b: worksOut };
    }

    /* --- the engine hub, the life board, and the flight to the form ----- */
    /*
     * The run out to the lane can have almost no page to happen over — where
     * the Intelligence Layer follows Works closely there are a few dozen
     * pixels of scroll between the card leaving one and being wanted at the
     * other, and the card arrives by cutting rather than by travelling. The
     * wait the lane holds afterwards is what pays for it: the card reaches the
     * lane later and carries straight on, which is a longer move and one beat
     * instead of two.
     */
    const laneAt =
      hubFrom +
      Math.max(
        0,
        Math.min(hover, MOTION.travel.room * vh - (hubFrom - worksOut)),
      );
    bow(worksOut, laneAt, lane(1), { hug: phone });
    knot(hubIn - approach, lane(1));
    knot(hubIn, on(dock.engine, hubScale));
    knot(hubOut, on(dock.engine, hubScale));

    bow(hubOut, laneIn, lane(-1));
    knot(laneOut, lane(-1));

    const earlyFrom = earlyIn - dwell;
    const gap = Math.max(0.15 * vh, (earlyFrom - laneOut) / 4);
    const { flight } = MOTION.travel;
    for (let i = 0; i < 3; i++) {
      const side = i % 2 ? 1 : -1;
      knot(laneOut + (i + 1) * gap, {
        x: vw / 2 + side * vw * flight.spread * (0.75 + 0.5 * rand()),
        y: vh * (flight.high + (i === 1 ? flight.dip : 0)),
        win: 1,
        scale: heroScale * (0.6 + 0.24 * rand()),
        rot: -90 + side * flight.tilt * (0.5 + rand()),
        rx: i === 1 ? flight.flat : -(0.35 * flight.flat),
        ry: side * flight.yaw,
      });
    }
    knot(earlyFrom, on(dock.early, heroScale));
    knot(earlyIn, on(dock.early, heroScale));
    /* And the last quarter turn, up onto its edge as the form's own card. */
    knot(last, on(dock.early, earlyWide, 0));

    /* The path is complete; now work out how fast it is moving at every knot. */
    slopes(knots);

    const hw = morph / 2;
    swaps = [
      { at: dock.vs.centre - hw, hw, from: "card", to: "vs" },
      { at: dock.vs.centre + dwell + hw, hw, from: "vs", to: "card" },
      ...(stacked
        ? []
        : ([
            /*
             * Both inside the hold and hard against its two ends, so the card
             * is at full spread for each of them and there is a beat of the
             * section's own three cards, alone, in between.
             */
            {
              at: worksMid - half + works.trade / 2,
              hw: works.trade / 2,
              from: "card",
              to: "cut",
              melt: true,
            },
            {
              at: worksMid + half - works.trade / 2,
              hw: works.trade / 2,
              from: "cut",
              to: "card",
              melt: true,
            },
          ] as Swap[])),
      { at: dock.engine.centre - hw, hw, from: "card", to: "engine" },
      { at: dock.engine.centre + dwell + hw, hw, from: "engine", to: "card" },
    ];

    /*
     * Where the section gets its own three cards back. Not where the card has
     * finished with them, which is `worksOut` — where they have left the
     * window, which is later. Give them back while any of them is still on
     * screen and they are seen coming back on UNDER the card that is still
     * standing in for them, which is the one thing this is meant to prevent.
     */
    cutWindow = {
      a: trioOut,
      b: Math.max(
        worksOut,
        /* Measured where they REST, so the margin covers however far the
           depth system currently has them from there. */
        ...dock.steps.map((d) => d.y + d.h / 2 + 0.08 * vh),
      ),
    };
    /* Where the card rails them in, the steps' own reveal is not wanted. */
    if (rails.length) gsap.set(stepEls, { opacity: 1, y: 0 });

    taken = [
      { el: vsEl!, a: vsIn - 1, b: vsOut + 1 },
      /* Held all the way to Works: the trio has nothing else to show. */
      { el: trioEl!, a: vsOut, b: worksIn },
      { el: hubEl!, a: hubIn - 1, b: hubOut + 1 },
    ];
  }

  /** Place the card for a scroll position. */
  const apply = (pos: number) => {
    if (knots.length < 2) return;
    /* The window as MEASURED, not as it is this instant — see `view`. */
    const { vw, vh } = view;
    const sy = window.scrollY;

    let i = 1;
    while (i < knots.length - 1 && knots[i]!.s < pos) i++;
    const a = knots[i - 1]!;
    const b = knots[i]!;

    const len = b.s - a.s || 1;
    /* Past either end of the path the cubic would run away. It does not get to. */
    const u = Math.min(1, Math.max(0, (pos - a.s) / len));
    /* Every channel on the same cubic, so they can never disagree. */
    const on = (c: Channel) => ride(a, b, c, u, len);
    /* ...and one weight for the things that are a fade rather than a path. */
    const t = smooth(u);

    const scale = on("scale");
    const win = on("win");

    /* A docked knot follows its slot if the depth system has since moved it. */
    const driftOf = (d: Dock | null) => {
      if (!d) return { x: 0, y: 0 };
      const now = chainDrift(d);
      return { x: now.x - d.drift0.x, y: now.y - d.drift0.y };
    };
    const da = driftOf(a.dock);
    const db = driftOf(b.dock);
    const lead = (from: number, to: number) => from + (to - from) * t;

    let x = on("x") + lead(da.x, db.x);
    /* `win` is what blends page coordinates into window ones. */
    let y = on("y") + lead(da.y, db.y) + win * sy;

    /*
     * Off a dock, the card is kept on screen — but only off a dock: a slot is
     * where it is, and a clamp there would drag it off its mark.
     *
     * So the grip EASES OFF across the segment that lands on a dock rather
     * than switching off when it gets there. Switching is what put a jump in
     * it: a clamp that is holding the card the frame before it stops being
     * applied hands back however far it was holding it, all at once.
     */
    const grip = (a.dock ? 0 : 1) + t * ((b.dock ? 0 : 1) - (a.dock ? 0 : 1));
    if (grip > 0) {
      const w = SQUAD_CARD.width * scale;
      const h = SQUAD_CARD.height * scale;
      const held = (v: number, lo: number, hi: number) =>
        Math.max(lo, Math.min(hi, v));
      x += grip * (held(x, keep * w - w / 2, vw - keep * w + w / 2) - x);
      y +=
        grip * (sy + held(y - sy, keep * h - h / 2, vh - keep * h + h / 2) - y);
    }

    /* Which face, and how far through trading for the next one. */
    const seg = (() => {
      let cur: Face = "card";
      for (const s of swaps) {
        const lo = s.at - s.hw;
        const hi = s.at + s.hw;
        if (pos >= hi) {
          cur = s.to;
          continue;
        }
        if (pos > lo)
          return {
            from: s.from,
            to: s.to,
            u: (pos - lo) / (hi - lo),
            melt: s.melt === true,
          };
        break;
      }
      return { from: cur, to: cur, u: 1, melt: false };
    })();

    /* The card turns to trade a FACE; it does not turn to fall apart. */
    const flip = seg.from !== seg.to && seg.from !== "cut" && seg.to !== "cut";

    const { band, turn: T, grow } = MOTION.travel;
    const lit: Partial<Record<Face, number>> = {};
    if (seg.from === seg.to) lit[seg.from] = 1;
    else if (seg.melt) {
      /* One weight, spent between the two: never both bright, never neither. */
      const w = smooth(seg.u);
      lit[seg.from] = 1 - w;
      lit[seg.to] = w;
    } else {
      lit[seg.from] = 1 - smooth((seg.u - (0.5 - band)) / band);
      lit[seg.to] = smooth((seg.u - 0.5) / band);
    }

    /* Out and back rather than through: it turns away and returns changed. */
    const yaw = flip
      ? -T.yaw * smooth(seg.u < 0.5 ? 2 * seg.u : (1 - seg.u) * 2)
      : 0;
    const pitch = yaw * T.pitch;

    const rise = soft((pos - knots[0]!.s) / (trade.rise - knots[0]!.s || 1));
    /*
     * A relay rather than a cross-fade: the hero's anchor only starts going
     * once the traveller has finished arriving.
     */
    shade(
      anchor,
      1 - soft((pos - trade.rise) / (trade.fade - trade.rise || 1)),
    );

    const done = pos >= last;
    /*
     * Where the card rails the steps in, it is out of the way while they
     * arrive — it is standing in for all three at once and cannot be seen
     * doing it.
     */
    const hide =
      railed.b > railed.a
        ? Math.min(
            soft((pos - (railed.a - 0.06 * vh)) / (0.06 * vh)),
            1 - soft((pos - railed.b) / (0.06 * vh)),
          )
        : 0;
    const alpha = done ? 0 : rise * (1 - hide);

    shade(earlyEl, done ? 1 : 0);
    shade(travel, alpha);

    gsap.set(travel, {
      x,
      y,
      scaleX: scale,
      scaleY: scale * on("squash"),
      force3D: true,
    });
    gsap.set(turn, { rotationZ: on("rot") });
    gsap.set(swing, {
      rotationY: yaw + on("ry"),
      rotationX: pitch + on("rx"),
    });

    /* One card, or three of it. */
    const apart = split.b > split.a && pos > split.a && pos < split.b;
    shade(whole, apart ? 0 : (lit.card ?? 0));
    for (const sl of slices) shade(sl, apart ? (lit.card ?? 0) : 0);

    if (apart) {
      /*
       * Out, then held wide across the middle step, then back in. `smoother`
       * clamps, so the hold needs no case of its own: either side of the
       * middle the other branch is already reading past its own end.
       */
      const spread =
        pos < fanOut.mid
          ? smoother((pos - (fanOut.mid - half - works.fan)) / works.fan)
          : 1 - smoother((pos - (fanOut.mid + half)) / works.fan);
      slices.forEach((sl, idx) => {
        const off = fanOut.offs[idx] ?? { x: 0, y: 0 };
        gsap.set(sl, { x: off.x * spread, y: off.y * spread });
      });
    }

    /* The faces take the card's place, so they take its position too. */
    for (const key of ["vs", "engine"] as const) {
      const el = faces[key]!;
      const w = alpha ? (lit[key] ?? 0) : 0;
      shade(el, w);
      if (w > 0)
        gsap.set(el, {
          x,
          y,
          scale: faceFit[key] * (grow + (1 - grow) * w),
          rotationY: yaw,
          rotationX: pitch,
        });
    }

    /* The real step cards, where the card is standing in for them. */
    if (split.b > split.a) {
      const owned = alpha > 0 && pos > cutWindow.a && pos < cutWindow.b;
      for (const el of stepCards) shade(el, owned ? (lit.cut ?? 0) : 1);
    }

    /* ...and where it rails them in instead, one at a time. */
    for (const r of rails) {
      const u = smooth((pos - r.from) / (r.to - r.from || 1));
      gsap.set(r.el, {
        y: r.lift * (1 - u),
        clipPath: `inset(0px 0px ${(1 - u) * 100}% 0px)`,
      });
      shade(r.el, u > 0 ? 1 : 0);
    }

    for (const w of taken) stand(w.el, pos > w.a && pos < w.b);
  };

  return {
    measure,
    apply,
    park,
    span: () => ({ from: knots[0]?.s ?? 0, to: last + view.vh }),
  };
}

/* -------------------------------------------------------------------------- */

/**
 * Navbar: drops in from above the top edge, hinging on it so it unfolds rather
 * than just sliding down.
 */
export function navbarDrop(el: HTMLElement) {
  const pill = one(el, "[data-reveal='nav-pill']");
  if (!pill) return beat();

  gsap.set(el, { opacity: 1 });
  /* -el.offsetHeight, not yPercent: -100. */
  gsap.set(pill, {
    y: -el.offsetHeight,
    transformOrigin: "50% 0%",
    transformPerspective: 800,
    opacity: 0.2,
  });

  return beat().to(pill, {
    y: 0,
    opacity: 1,
    ...MOTION.navbar.drop,
  });
}

/* -------------------------------------------------------------------------- */

/**
 * Hero, movement one: the copy rises and fades up, then the CTAs — lying flat
 * on the screen plane — hinge upright off their bottom edge.
 */
export function heroCopy(el: HTMLElement) {
  const copy = q(el, "copy");
  const buttons = q(el, "button");
  const note = q(el, "note");

  /* Rise and fade, and no scale. */
  gsap.set(copy, {
    opacity: 0.2,
    y: MOTION.copy.rise,
    transformOrigin: "50% 100%",
  });
  gsap.set(note, { opacity: 0.1, y: 12 });
  gsap.set(buttons, {
    opacity: 0.1,
    y: 12,
    rotationX: MOTION.flat.angle,
    transformOrigin: "50% 100%",
    transformPerspective: 600,
  });

  const tl = beat()
    .to(copy, {
      opacity: 1,
      y: 0,
      duration: MOTION.copy.duration,
      ease: MOTION.copy.ease,
      stagger: MOTION.copy.stagger,
    })
    .to(
      buttons,
      { opacity: 1, y: 0, rotationX: 0, ...MOTION.hero.buttons },
      "-=1.5",
    )
    .to(note, { opacity: 1, y: 0, ...MOTION.hero.note }, "-=1.5");

  /*
   * No glowIn here, unlike copyIn: the hero's bloom is [data-reveal='glow']
   * too, but it belongs to the card scene and heroCards reveals it there.
   */
  return tl;
}

/** Hero, movement two: the card scene, fired by the card scene arriving. */
export function heroCards(el: HTMLElement) {
  const glow = q(el, "glow");
  const fan = q(el, "fan");
  const cards = q(el, "card");
  const anchor = one(el, "[data-fan-anchor]");
  if (!anchor) return beat();

  /*
   * Every passport card is pulled onto the Squad card's exact centre, so the
   * deck is a single stack with nothing peeking out — they only exist once
   * they come out from behind it.
   */
  const stacked = (card: HTMLElement) =>
    anchor.offsetLeft +
    anchor.offsetWidth / 2 -
    (card.offsetLeft + card.offsetWidth / 2);

  /*
   * The bloom and band come in from under the section, which is the direction
   * the whole hero opens from — see glowFrom.
   */
  glowStart(glow);
  gsap.set(fan, {
    opacity: 0,
    rotationX: MOTION.flat.angle,
    z: MOTION.hero.depth,
    transformOrigin: "50% 100%",
  });
  /*
   * Hidden as well as stacked. They are directly behind a card that is turned
   * on its side, so parts of them would otherwise poke past its edges — and the
   * point is that nothing exists until it comes out from behind the Squad card.
   */
  gsap.set(cards, {
    opacity: 0,
    x: (_i, card: HTMLElement) => stacked(card),
  });
  /* The Squad card starts on its side. */
  gsap.set(anchor, { rotationZ: MOTION.hero.turn });

  /*
   * The one place the two tiers do not share a number, and the only one they
   * cannot.
   */
  const deal =
    fan[0]?.dataset.tier === "phone" ? MOTION.hero.fanPhone : MOTION.hero.fan;

  return (
    beat()
      .to(glow, { opacity: 1, x: 0, y: 0, ...MOTION.hero.glow }, 0)
      .to(fan, { opacity: 1, duration: 0.3, ease: "none" }, 0.2)
      /* Hidden as well as stacked: they sit behind a card turned edge-on. */
      .to(fan, { rotationX: 0, z: 0, ...MOTION.hero.lift }, "<")
      .to(anchor, { rotationZ: 0, ...MOTION.hero.lift }, "<")
      /*
       * Only now does anything come out from behind the Squad card —
       * overlapped with the last of the lift, so they start emerging as it
       * finishes standing rather than after a pause with nothing happening.
       */
      .to(cards, { opacity: 1, x: 0, ...deal }, "-=0.35")
  );
}

/** The hero's fan closing again, scrubbed by the scroll. */
export function heroFold(el: HTMLElement) {
  const cards = q(el, "card");
  const anchor = one(el, "[data-fan-anchor]");
  if (!cards.length || !anchor) return null;

  /*
   * Where each card sits when it is stacked behind the Squad card — the same
   * measurement heroCards opens from, in the stage's own units, which is the
   * space GSAP's x lives in and which no amount of stage scaling changes.
   */
  const stacked = (card: HTMLElement) =>
    anchor.offsetLeft +
    anchor.offsetWidth / 2 -
    (card.offsetLeft + card.offsetWidth / 2);

  /* fromTo, and both ends stated. */
  return gsap.timeline({ paused: true }).fromTo(
    cards,
    { x: 0, opacity: 1 },
    {
      x: (_i, card: HTMLElement) => stacked(card),
      opacity: 0,
      ease: "none",
      duration: 1,
      stagger: { each: MOTION.hero.fold.stagger, from: "end" },
      immediateRender: false,
    },
  );
}

/* -------------------------------------------------------------------------- */

/** The four passport cards, breathing, for as long as the hero is on screen. */
export function heroFloat(el: HTMLElement) {
  const { rise, duration, each, ease } = MOTION.hero.float;
  const tl = gsap.timeline({ paused: true });

  const cards = q(el, "card");

  /*
   * Promoted once, up front, and left promoted: these animate for as long as
   * the hero is on screen, so a compositor layer each means the float is a
   * matrix applied to an existing raster rather than a repaint every frame.
   */
  park(cards, { willChange: "transform", force3D: true });

  cards.forEach((card, i) => {
    tl.to(card, { y: -rise, duration, ease, repeat: -1, yoyo: true }, i * each);
  });

  return tl;
}

/**
 * A section's ambient glow, drifting for as long as that section is on screen.
 */
export function glowDrift(el: HTMLElement) {
  const { scale, shift, duration, step, stagger, ease } = MOTION.glow.drift;
  const tl = gsap.timeline({ paused: true });

  /* Whatever light this tier actually draws. */
  const layers = gsap.utils
    .toArray<HTMLElement>(el.querySelectorAll("[data-glow-from]"))
    .filter(shown);

  /*
   * Promoted once and left promoted, like the passport cards: these animate
   * for as long as their section is on screen, so a compositor layer each is
   * the difference between stretching a raster and repainting a window's worth
   * of soft light on every frame.
   */
  park(layers, { willChange: "transform", force3D: true });

  layers.forEach((layer, i) => {
    const away = i % 2 ? -1 : 1;
    tl.to(
      layer,
      {
        scale: away > 0 ? scale : 1 / scale,
        x: shift * away,
        y: shift * 0.4 * -away,
        duration: duration + i * step,
        ease,
        repeat: -1,
        yoyo: true,
      },
      i * stagger,
    );
  });

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Counts every [data-count] under `root` up to the figure already printed on
 * it, in document order.
 */
const FIGURE = /^(\D*)([\d.,]+)(\D*)$/;

/**
 * How a run of figures counts: the tween itself, and the gap between one and
 * the next.
 */
type Figures = { count: gsap.TweenVars; stagger: number };

const countUp = (
  tl: gsap.core.Timeline,
  root: HTMLElement,
  at: number | string,
  figures: Figures,
) => {
  const cells = gsap.utils.toArray<HTMLElement>(
    root.querySelectorAll("[data-count]"),
  );

  cells.forEach((cell, i) => {
    /*
     * Kept in the attribute from here on, because counting overwrites the text
     * it was read from.
     */
    const printed = cell.dataset.count || cell.textContent || "";
    cell.dataset.count = printed;

    const parts = FIGURE.exec(printed);
    if (!parts) return;

    const [, prefix, digits, suffix] = parts;
    const target = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(target)) return;

    /*
     * Both read off the printed figure rather than configured: it is the one
     * place the format is stated, so a rail that prints 21.5 counts in tenths
     * and one that prints 502 counts in whole numbers, with nothing to keep in
     * sync.
     */
    const decimals = digits.split(".")[1]?.length ?? 0;
    const useGrouping = digits.includes(",");
    const show = (n: number) =>
      prefix +
      n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping,
      }) +
      suffix;

    const run = { n: 0 };
    tl.to(
      run,
      {
        n: target,
        ...figures.count,
        /* Nothing is touched until the figure is actually counting. */
        onStart: () => {
          cell.style.minWidth = `${Math.ceil(cell.offsetWidth)}px`;
        },
        onUpdate: () => {
          cell.textContent = show(run.n);
        },
        /*
         * Restored rather than re-formatted, and the pin released with it, so
         * the frame this settles on is the markup's own.
         */
        onComplete: () => {
          cell.textContent = printed;
          cell.style.minWidth = "";
        },
      },
      i ? `<+=${figures.stagger}` : at,
    );
  });
};

/**
 * Fills every [data-meter] under `root` from empty to the percentage it
 * carries.
 */
const meters = (
  tl: gsap.core.Timeline,
  root: HTMLElement,
  at: number | string,
  vars: gsap.TweenVars,
  stagger: number,
) => {
  const bars = gsap.utils.toArray<HTMLElement>(
    root.querySelectorAll("[data-meter]"),
  );

  bars.forEach((bar, i) => {
    const pct = Number(bar.dataset.meter);
    if (!Number.isFinite(pct)) return;

    /*
     * fromTo with immediateRender off, rather than emptying the bar now and
     * tweening it back.
     */
    tl.fromTo(
      bar,
      { width: "0%" },
      { width: `${pct}%`, immediateRender: false, ...vars },
      i ? `<+=${stagger}` : at,
    );
  });
};

/**
 * Alone vs Together: the two panels lift into place from just below it while
 * fading up, the VS mark comes up between them, and the strength rails arrive
 * last, counting their figures up as they open.
 */
/**
 * Each comparison panel's full height, captured the first time it is asked for
 * and kept for the life of the page.
 */
/* How tall each comparison panel is when it is whole. */
const fullHeights = new WeakMap<HTMLElement, number>();
const grown = (panel: HTMLElement) => {
  const known = fullHeights.get(panel);
  if (known !== undefined) return known;
  const h = asAuthored([panel], () => panel.offsetHeight);
  fullHeights.set(panel, h);
  return h;
};

/** `only` is the phone's cut of a beat the wide layout plays as one. */
export function alonePanels(el: HTMLElement, only?: number) {
  const both = [...q(el, "card-left"), ...q(el, "card-right")];
  const panels = only === undefined ? both : both.slice(only, only + 1);
  /*
   * The badge sits in the gap BETWEEN the panels, so it belongs to whichever
   * beat brings the second of them: the pair, up here; the lower panel, down
   * there.
   */
  const vs = only === 0 ? [] : q(el, "vs");
  const bars = panels.flatMap((panel) => q(panel, "bar"));

  park(vs, { opacity: 0 });

  /*
   * The rails are never hidden — the panels are simply too short to contain
   * them yet, and each panel clips its own overflow.
   */
  /*
   * Re-measured on every build, so a height cached on the other side of the
   * gate cannot be applied to this one — see grown.
   */
  for (const panel of panels) fullHeights.delete(panel);
  for (const panel of panels) grown(panel);
  const shortHeight = (panel: HTMLElement) =>
    panel.querySelector<HTMLElement>("[data-reveal='bar']")?.offsetTop ??
    grown(panel);

  gsap.set(bars, { opacity: 1 });
  /*
   * After fullHeight is captured, not before — offsetHeight is unaffected by
   * opacity and transforms, but the height below overwrites the very thing it
   * was read from.
   */
  gsap.set(panels, {
    opacity: MOTION.enter.from,
    y: MOTION.alone.lift,
    height: (_i, panel: HTMLElement) => shortHeight(panel),
  });

  const tl = beat()
    /*
     * No position argument on the first tween, and it matters: it is the FIRST
     * thing on a fresh timeline, so a relative one has nothing to be relative
     * to.
     */
    .to(panels, { opacity: 1, y: 0, ...MOTION.alone.cards });
  move(tl, vs, { opacity: 0.7, ...MOTION.alone.vs }, "-=0.5");

  /* The rails that finish these panels are not here — see aloneRails. */
  return tl;
}

/**
 * The strength rails at the bottom of the two comparison panels, and the six
 * figures on them counting up.
 */
export function aloneRails(el: HTMLElement, only?: number) {
  const both = [...q(el, "card-left"), ...q(el, "card-right")];
  const panels = only === undefined ? both : both.slice(only, only + 1);
  const tl = beat();
  const panel = panels[0];
  if (!panel) return tl;

  tl.to(panels, {
    height: (_i, p: HTMLElement) => grown(p),
    ...MOTION.alone.bar,
  });

  /*
   * `<` is the start of the growth above rather than its end: the figures
   * count while the rails are coming out, not after they have arrived.
   */
  countUp(
    tl,
    only === undefined ? el : panel,
    `<+=${MOTION.alone.figures.after}`,
    MOTION.alone.figures,
  );

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Squad Approves: the diagram gathers into place, and only then do the
 * connectors between the pieces light up.
 */
export function approveDiagram(el: HTMLElement, only?: number) {
  /*
   * `only` is the phone's cut, in the order the column reads: the request, the
   * card it goes to, the votes that come back.
   */
  const part = (i: number) => only === undefined || only === i;
  const request = part(0) ? q(el, "request") : [];
  const votes = part(2) ? q(el, "votes") : [];
  const halo = part(1) ? q(el, "squad-glow") : [];
  /*
   * No `squad`. This diagram's Squad card slot is filled by the card that has
   * travelled down from the hero — see squadTravel — so the element itself is
   * never revealed here: it holds the space the traveller lands in and the
   * coordinates the connectors point at, and nothing else. What the section
   * loses is a piece of its four-part arrival; what it gains is that the thing
   * the request and the votes gather around is visibly on its way in for eight
   * hundred pixels of scroll before it lands, rather than fading up out of
   * nothing when they do.
   */

  const { from, shift } = MOTION.enter;

  /* Left, right, up — and nothing measured. */
  park(request, { opacity: from, x: -shift });
  park(votes, { opacity: from, x: shift });
  glowStart(halo);

  /*
   * One position for all four, so they are one object arriving rather than
   * four elements taking turns — and on the heading's clock, so the diagram
   * and the words above it are one movement.
   */
  const tl = beat();
  const add = (targets: HTMLElement[], vars: gsap.TweenVars) => {
    if (targets.length) tl.to(targets, vars, 0);
  };
  add(request, { opacity: 1, x: 0, ...inStep() });
  add(votes, { opacity: 1, x: 0, ...inStep() });
  add(halo, { opacity: 1, x: 0, y: 0, ...MOTION.approve.glow });

  /* The wiring, after the parts it joins. */
  if (only === undefined) trace(tl, el, "-=0.25");
  else if (only === 1) traceRuns(tl, runs(el, "squad"), "-=0.25");
  else if (only === 2) traceRuns(tl, runs(el, "votes"), "-=0.25");

  return tl;
}

/* No `squad`: this diagram's card slot is filled by the traveller. */
export function approveLedger(el: HTMLElement) {
  const ledger = q(el, "ledger");
  const chips = q(el, "chip");
  const { from, lift } = MOTION.enter;

  gsap.set(ledger, { opacity: from, y: lift });
  gsap.set(chips, { opacity: from, y: lift / 4 });

  const tl = beat().to(ledger, { opacity: 1, y: 0, ...inStep() });
  /*
   * Well before the bar has settled: it is one gesture, and chips that waited
   * for it would read as a second arrival inside the first.
   */
  tl.to(chips, { opacity: 1, y: 0, ...MOTION.approve.chips }, "-=0.9");

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * How Squad Works: three step cards lift and fade in, then the wiring inside
 * the last two draws itself.
 */
export function worksCards(el: HTMLElement, only?: number) {
  const all = q(el, "step");
  const steps = only === undefined ? all : all.slice(only, only + 1);
  gsap.set(steps, { opacity: MOTION.enter.from, y: MOTION.enter.lift });

  const tl = beat().to(
    steps,
    { opacity: 1, y: 0, ...inStep(), stagger: MOTION.works.stagger },
    0,
  );
  /* Then the wiring inside the last two, as the cards settle. */
  trace(tl, only === undefined ? el : (steps[0] ?? el), "-=0.2");
  return tl;
}

/** The rings in steps 1 and 2, breathing. */
export function worksAmbient(el: HTMLElement) {
  const rings = gsap.utils.toArray<HTMLElement>(
    el.querySelectorAll("[data-glow]"),
  );
  const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true });

  tl.to(rings, {
    opacity: MOTION.works.glow.dim,
    duration: MOTION.works.glow.duration,
    ease: MOTION.works.glow.ease,
    stagger: { each: MOTION.works.glow.stagger, from: "center" },
  });

  return tl;
}

/** Step 1's four squad members, going round the hub they are joined to. */
export function worksOrbit(el: HTMLElement) {
  const tl = gsap.timeline({ paused: true, repeat: -1 });

  const ring = el.querySelector<HTMLElement>("[data-orbit]");
  if (!ring) return tl;

  const riders = gsap.utils.toArray<HTMLElement>(
    ring.querySelectorAll("[data-orbit-rider]"),
  );
  gsap.set(riders, { willChange: "transform", force3D: true });

  /*
   * Both at position 0 on one duration: this is one motion described twice,
   * and any frame where the two disagree is a frame with four tilted faces in
   * it.
   */
  const { turn } = MOTION.works.orbit;
  tl.to(ring, { rotation: 360, duration: turn, ease: "none" }, 0).to(
    riders,
    { rotation: -360, duration: turn, ease: "none" },
    0,
  );

  return tl;
}

/* -------------------------------------------------------------------------- */

/*
 * Intelligence Layer: a funnel, and the one payload too tall to animate as one
 * beat — 948px of diagram, so its top row and its bottom row are never on
 * screen together.
 */

/**
 * Row one: the four member score cards, and the glow behind the whole funnel.
 */
export function intelMembers(el: HTMLElement) {
  const members = q(el, "member");
  const aura = q(el, "aura");

  gsap.set(members, { opacity: MOTION.enter.from, y: MOTION.intel.rise });
  glowStart(aura);

  /* The row and the glow behind it on one clock, at one position. */
  const tl = beat().to(
    members,
    { opacity: 1, y: 0, ...inStep(), stagger: MOTION.intel.memberStagger },
    0,
  );
  move(tl, aura, { opacity: 1, x: 0, y: 0, ...inStep() }, 0);

  /*
   * Absolute positions, and the same one for both: the score and the meter
   * under it are one reading, so they run together and land together.
   */
  const { figures } = MOTION.intel;
  countUp(tl, el, figures.after, figures);
  meters(tl, el, figures.after, figures.meter, figures.stagger);
  return tl;
}

/**
 * Row two: the signal cards, with the fan from row one drawing down into them.
 */
export function intelSignals(el: HTMLElement) {
  const signals = q(el, "signals");
  const categories = q(el, "category");
  const nodes = q(el, "node");
  const fan = runs(el, "signals");

  gsap.set(signals, { opacity: MOTION.enter.from, y: MOTION.intel.rise });
  gsap.set(categories, {
    opacity: MOTION.enter.from,
    y: MOTION.intel.cardRise,
  });
  park(nodes, { opacity: 0 });

  const tl = beat().to(signals, { opacity: 1, y: 0, ...inStep() }, 0);

  /* The four cards with the container, not after it. */
  tl.to(
    categories,
    { opacity: 1, y: 0, ...inStep(), stagger: MOTION.intel.cardStagger },
    0,
  );

  /*
   * The dot and the run that lands on it belong to the connector rather than
   * to the row, so they stay chained off the row's own end.
   */
  move(
    tl,
    nodes,
    { opacity: 1, ...MOTION.trace.node },
    MOTION.copy.duration - 0.3,
  );
  traceRuns(tl, fan, "-=0.2");
  return tl;
}

/**
 * Row three: the engine, with the run from the signals drawing down into it.
 */
export function intelHub(el: HTMLElement) {
  const hub = q(el, "hub");
  gsap.set(hub, { opacity: MOTION.enter.from, y: MOTION.intel.rise });

  const tl = beat().to(hub, { opacity: 1, y: 0, ...inStep() }, 0);
  traceRuns(tl, runs(el, "hub"), "-=0.5");
  return tl;
}

/** Row four: the verdict the engine hands down, and the last run into it. */
/** The hub's bloom, breathing for as long as the section is on screen. */
export function intelAmbient(el: HTMLElement) {
  const glow = gsap.utils.toArray<HTMLElement>(
    el.querySelectorAll("[data-glow]"),
  );
  const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true });

  tl.to(glow, {
    opacity: MOTION.intel.glow.dim,
    duration: MOTION.intel.glow.duration,
    ease: MOTION.intel.glow.ease,
    /*
     * From the narrowest layer, which is last in the DOM — the pulse leaves
     * the core and travels out, rather than the three plates dimming as one.
     */
    stagger: { each: MOTION.intel.glow.stagger, from: "end" },
  });

  return tl;
}

export function intelVerdict(el: HTMLElement) {
  const verdict = q(el, "verdict");
  gsap.set(verdict, { opacity: MOTION.enter.from, y: MOTION.intel.rise });

  const tl = beat().to(verdict, { opacity: 1, y: 0, ...inStep() }, 0);
  traceRuns(tl, runs(el, "verdict"), 0);
  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Squad Invitation: the invite card lifts and fades into place with everything
 * on it.
 */
/* -------------------------------------------------------------------------- */

/* Life Inside Squad: a lane, a cover, and the squad's own health. */

/** The top row: the lane being spent down, and the member covering it. */
export function lifeLanes(el: HTMLElement, only?: number) {
  /* `only` is the phone's cut: the lane, then the one covering it. */
  const both = [...q(el, "lane"), ...q(el, "cover")];
  const cards = only === undefined ? both : both.slice(only, only + 1);
  /*
   * Rooted at the cards rather than the section, so a cut beat takes the items
   * that belong to it and no others.
   */
  const items = cards.flatMap((card) => q(card, "item"));
  /*
   * The light belongs to the row rather than to either card, so it comes in
   * with the first thing that arrives.
   */
  const aura = only === 1 ? [] : q(el, "aura");

  gsap.set(cards, { opacity: MOTION.enter.from, y: MOTION.enter.lift });
  gsap.set(items, { opacity: MOTION.enter.from, y: MOTION.life.itemRise });
  glowStart(aura);

  /*
   * All three at position 0, all three on the heading's clock — see `inStep`.
   */
  const tl = beat()
    .to(
      cards,
      { opacity: 1, y: 0, ...inStep(), stagger: MOTION.life.cardStagger },
      0,
    )
    .to(
      items,
      { opacity: 1, y: 0, ...inStep(), stagger: MOTION.life.itemStagger },
      0,
    );
  move(tl, aura, { opacity: 1, x: 0, y: 0, ...inStep() }, 0);

  /*
   * The lane's own readout: $3,860 counting up while the bar under it fills to
   * the 71.7% that is the same fact.
   */
  const { figures } = MOTION.life;
  const lane = cards.find((card) => card.dataset.reveal === "lane");
  if (lane) {
    countUp(tl, lane, figures.after, figures);
    meters(tl, lane, figures.after, figures.meter, figures.stagger);
  }

  /*
   * And the hairline between the two faces, drawn last — a payment travelling
   * from one of them to the other is the one thing on this row that is an
   * event rather than a state.
   */
  trace(tl, only === undefined ? el : (cards[0] ?? el), "-=0.4");
  return tl;
}

/** The ledger under them, on its own trigger. */
export function lifeHealth(el: HTMLElement) {
  const card = q(el, "health");
  const scores = q(el, "score");

  gsap.set(card, { opacity: MOTION.enter.from, y: MOTION.enter.lift });
  gsap.set(scores, { opacity: MOTION.enter.from, y: MOTION.life.scoreRise });

  const tl = beat()
    .to(card, { opacity: 1, y: 0, ...inStep() }, 0)
    .to(
      scores,
      { opacity: 1, y: 0, ...inStep(), stagger: MOTION.life.scoreStagger },
      0,
    );

  /*
   * Seven figures on one card — three about the squad and four about the
   * people in it — counted in document order, inside the card that is still
   * arriving.
   */
  const { figures } = MOTION.life;
  if (card[0]) countUp(tl, card[0], figures.after, figures);
  return tl;
}

/* -------------------------------------------------------------------------- */

export function inviteCard(el: HTMLElement) {
  const card = q(el, "card");
  const items = q(el, "item");

  gsap.set(card, { opacity: MOTION.enter.from, y: MOTION.enter.lift });
  gsap.set(items, { opacity: MOTION.enter.from, y: MOTION.invite.itemRise });

  /* Both at position 0, both on the heading's clock. */
  return beat()
    .to(card, { opacity: 1, y: 0, ...inStep() }, 0)
    .to(
      items,
      { opacity: 1, y: 0, ...inStep(), stagger: MOTION.invite.itemStagger },
      0,
    );
}

/* -------------------------------------------------------------------------- */

/*
 * Early Access: the one section that leads with its artwork rather than its
 * heading, because that is the order it is laid out in.
 */

export function earlyCard(el: HTMLElement) {
  /*
   * No card. The one that belongs here is the one that has been coming down the
   * page since the hero, and it arrives on the reader's own scroll rather than
   * on a clock — see squadTravel. The quarter turn goes with it: the page
   * opened on this card standing up out of landscape and it lies back down at
   * the end, and now that is literally the same card doing both, performed
   * rather than restated.
   *
   * The beat keeps its name, its place as the section's first, and its length,
   * so WITH_CARD still means what it says and the copy, the fields and the
   * button still travel and land together on MOTION.early.card's clock. What is
   * left in it is the light the card lands in.
   */
  return glowIn(beat(), el, MOTION.early.card.duration);
}

export function earlyForm(el: HTMLElement) {
  const copy = q(el, "copy");
  const fields = q(el, "field");
  const cta = q(el, "cta");

  /* No scale here either — see heroCopy. */
  gsap.set(copy, {
    opacity: MOTION.enter.from,
    y: MOTION.early.copyRise,
    transformOrigin: "50% 100%",
  });
  gsap.set(fields, {
    opacity: MOTION.enter.from,
    y: MOTION.early.fieldRise,
  });
  gsap.set(cta, {
    opacity: MOTION.enter.from,
    y: MOTION.early.ctaRise,
    rotationX: MOTION.flat.angle,
    transformOrigin: "50% 100%",
    transformPerspective: 600,
  });

  /* All three on the card's clock, and all three at position 0. */
  const withCard = MOTION.early.card;

  return beat()
    .to(
      copy,
      { opacity: 1, y: 0, ...withCard, stagger: MOTION.early.copyStagger },
      0,
    )
    .to(
      fields,
      { opacity: 1, y: 0, ...withCard, stagger: MOTION.early.fieldStagger },
      0,
    )
    .to(cta, { opacity: 1, y: 0, rotationX: 0, ...withCard }, 0);
}
