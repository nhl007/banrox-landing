import gsap from "gsap";
import { SQUAD_CARD } from "@/components/ui/SquadCard";
import { asAuthored, authoredRect } from "./measure";
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

/**
 * One dock: where a slot rests, how big the card is there, and how it is
 * turned.
 */
const dockAt = (el: HTMLElement, up: boolean) => {
  const r = authoredRect(el);
  /*
   * The slot, and everything between it and its section that depth might be
   * moving — with the size each of those is a percentage OF, taken now.
   */
  const chain: { el: HTMLElement; w: number; h: number }[] = [
    { el, w: r.width, h: r.height },
  ];
  for (
    let n = el.parentElement;
    n && !n.dataset.sequenceSection;
    n = n.parentElement
  )
    chain.push({ el: n, w: n.offsetWidth, h: n.offsetHeight });

  return {
    el,
    chain,
    x: r.left + window.scrollX + r.width / 2,
    y: r.top + window.scrollY + r.height / 2,
    scale: (up ? r.height : r.width) / SQUAD_CARD.width,
    turn: up ? -90 : 0,
  };
};

/**
 * How far the depth system currently has a slot displaced from where it rests.
 */
const driftOf = (d: { chain: { el: HTMLElement; w: number; h: number }[] }) => {
  let x = 0;
  let y = 0;
  for (const link of d.chain) {
    x += ((Number(gsap.getProperty(link.el, "xPercent")) || 0) / 100) * link.w;
    y += ((Number(gsap.getProperty(link.el, "yPercent")) || 0) / 100) * link.h;
  }
  return { x, y };
};

/** `sine.inOut`, as a number rather than an ease. */
const soft = (t: number) =>
  0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))) / 2;

/**
 * `6t^5 - 15t^4 + 10t^3`, and a quintic rather than a cosine for exactly one
 * reason: its FIRST and SECOND derivatives are both zero at either end.
 */
const glide = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

/** `glide`'s own rate: `30t^2(1-t)^2`, clamped flat outside [0,1]. */
const glideRate = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return 30 * u * u * (1 - u) * (1 - u);
};

/** `glide`'s own integral, `t^6 - 3t^5 + 2.5t^4` — half of a unit at t = 1. */
const glideArea = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * u * u * (u * (u - 3) + 2.5);
};

/**
 * A ramp from 0 to 1 that leaves at rest, arrives at rest, and runs at a
 * CONSTANT rate in between — `ease` of it spent getting up to speed at either
 * end.
 */
const cruise = (u: number, leave: number, land: number) => {
  const t = Math.min(1, Math.max(0, u));
  const a = Math.min(0.49, Math.max(0.0001, leave));
  const b = Math.min(0.49, Math.max(0.0001, land));
  const span = 1 - (a + b) / 2;
  if (t < a) return (a * glideArea(t / a)) / span;
  if (t > 1 - b) return (span - b * glideArea((1 - t) / b)) / span;
  return (t - a / 2) / span;
};

/**
 * The Squad card's journey: the hero's fan, the approve diagram, Early Access.
 */
export function squadTravel(root: HTMLElement, tier: "full" | "phone") {
  const frame = root.querySelector<HTMLElement>("[data-card-travel]");
  const turn = root.querySelector<HTMLElement>("[data-card-turn]");
  /*
   * The hero's is whichever of the two fans this width renders — the wide row
   * or the phone's deck — which is what `one` is for.
   */
  const fan = one(root, "[data-sequence-section='hero'] [data-reveal='fan']");
  const slots = [
    one(root, "[data-sequence-section='hero'] [data-fan-anchor]"),
    one(root, "[data-sequence-section='approve'] [data-reveal='squad']"),
    one(root, "[data-sequence-section='early'] [data-reveal='card']"),
  ];
  if (!frame || !turn || !fan || slots.some((el) => !el)) return null;
  const [heroSlot, approveSlot, earlySlot] = slots as HTMLElement[];

  /* The eight sections, and NOT the navbar. */
  const sections = gsap.utils
    .toArray<HTMLElement>(root.querySelectorAll("[data-sequence-section]"))
    .filter((el) => el.dataset.sequenceSection !== "navbar");

  /* The tier's own numbers where it has them — see MOTION.travel.phone. */
  const { far, lit, sway } =
    tier === "phone"
      ? { ...MOTION.travel, ...MOTION.travel.phone }
      : MOTION.travel;

  type Dock = ReturnType<typeof dockAt>;
  type Knot = { s: number; y: number };
  type Leg = {
    from: Dock;
    to: Dock;
    knots: Knot[];
    long: boolean;
    /**
     * Where the card came to rest on this leg's HEAD dock — the far end of the
     * leg before it.
     */
    landed: number;
    /**
     * Where the card is first allowed to MOVE, which is `knots[0].s` on the
     * long leg and the far end of the hero's hand-over on the short one.
     */
    hold0: number;
  };

  let docks: Dock[] = [];
  let legs: Leg[] = [];
  /**
   * Page lines the card falls through — the middle of each section boundary.
   */
  let seams: number[] = [];

  /** Re-derive the whole journey from where the page currently is. */
  const measure = () => {
    const vh = window.innerHeight;
    survey();

    docks = [
      dockAt(heroSlot, true),
      dockAt(approveSlot, true),
      dockAt(earlySlot, false),
    ];

    /*
     * The seam between two sections: the page line half way between the bottom
     * of one and the top of the next.
     */
    /*
     * Measured AS AUTHORED, like the docks above and for the same reason: the
     * page this runs on is not the page the reader will be looking at.
     */
    const boxes = asAuthored([...sections, fan], () => ({
      edge: sections.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: r.top + window.scrollY,
          bottom: r.bottom + window.scrollY,
        };
      }),
      fanBottom: fan.getBoundingClientRect().bottom + window.scrollY,
    }));
    const { edge } = boxes;
    seams = edge
      .slice(1)
      .map((e, i) => ((edge[i]?.bottom ?? e.top) + e.top) / 2);

    /*
     * A dock is a stretch of scroll over which the card does not move on the
     * page at all — which is the only thing "docked" can mean for something in
     * page coordinates, and the exact opposite of holding a place in the
     * window.
     */
    const arrives = (d: Dock) => d.y - vh * MOTION.own.line;
    const leaves = (d: Dock) => d.y - vh * (1 - MOTION.own.line);

    /* The hero is the exception, and the fold is what makes it one. */
    const { fold, foldPhone } = MOTION.hero;
    const release =
      tier === "phone"
        ? boxes.fanBottom - vh * (1 - foldPhone.lead - foldPhone.out)
        : /*
           * The hero's own top edge, not the document's: the fold is hung on `top top`
           * and the hero starts below the navbar, so the fold ends `out` of a window
           * after the bar has gone rather than after nothing at all. 72px at 1440x900.
           */
          (edge[0]?.top ?? 0) + fold.out * vh;

    const { lift, dash } = MOTION.travel;

    legs = [0, 1].map((i) => {
      const from = docks[i]!;
      const to = docks[i + 1]!;
      const s0 = i === 0 ? release : leaves(from);
      const s1 = arrives(to);
      const knots: Knot[] = [{ s: s0, y: from.y }];
      /*
       * The hero's hand-over, as a stretch of path on which the card does not
       * move — see MOTION.travel.handover.
       */
      if (i === 0)
        knots.push({ s: s0 + vh * MOTION.travel.handover, y: from.y });

      /*
       * A crest between one appointment and the next: the card climbs back
       * towards the top of the window while the section between them is being
       * read, which is the half of every cycle that keeps it out of the way.
       */
      const crestBefore = (next: Knot) => {
        const prev = knots[knots.length - 1]!;
        if (next.s - prev.s < vh * 0.6) return;
        const mid = (prev.s + next.s) / 2;
        const want = mid - vh * lift;
        knots.push({ s: mid, y: Math.min(Math.max(want, prev.y), next.y) });
      };

      /*
       * One appointment per seam the card crosses: when that seam is centred
       * in the window, the card wants to be centred in the window too.
       */
      for (const seam of seams) {
        const at = seam - vh / 2;
        const prev = knots[knots.length - 1]!;
        if (at <= prev.s + 1 || at >= s1 - 1) continue;
        if (seam <= prev.y) continue;
        if ((seam - prev.y) / (at - prev.s) > dash) continue;
        if ((to.y - seam) / (s1 - at) > dash) continue;
        crestBefore({ s: at, y: seam });
        knots.push({ s: at, y: seam });
      }

      crestBefore({ s: s1, y: to.y });
      knots.push({ s: s1, y: to.y });
      return {
        from,
        to,
        knots,
        long: i === 1,
        /*
         * The hero is never "landed" — the card starts there, and its hand-
         * over is the one that has to run against a card the page drew itself.
         */
        landed: i === 0 ? s0 : arrives(from),
        /* Past the flat head knot where there is one — see the Leg type. */
        hold0: i === 0 ? knots[1]!.s : s0,
      };
    });
  };

  /**
   * The SHAPE of the card's descent — where a card obeying the page's rhythm
   * outright would sit at this scroll.
   */
  const pathY = (leg: Leg, s: number) => {
    const k = leg.knots;
    let i = 1;
    while (i < k.length - 1 && k[i]!.s < s) i++;
    const a = k[i - 1]!;
    const b = k[i]!;
    const t = Math.min(1, Math.max(0, (s - a.s) / (b.s - a.s || 1)));
    /*
     * Where down the leg this stretch happens, which is what sets its shape.
     */
    const at = ((a.y + b.y) / 2 - leg.from.y) / (leg.to.y - leg.from.y || 1);
    const bias = 1 + MOTION.travel.cadence * (1 - 2 * at);
    return a.y + (b.y - a.y) * glide(Math.pow(t, bias));
  };

  /**
   * And the path the card actually takes: the knots above mixed with a steady
   * glide from dock to dock.
   */
  const pathAt = (leg: Leg, s: number) => {
    const s1 = leg.knots[leg.knots.length - 1]!.s;
    const { rhythm, ease } = MOTION.travel;
    const steady =
      leg.from.y +
      (leg.to.y - leg.from.y) *
        cruise((s - leg.hold0) / (s1 - leg.hold0 || 1), ease.leave, ease.land);
    const knotted = pathY(leg, s);
    return steady + (knotted - steady) * rhythm;
  };

  /** How much of a card the reader is being shown at this page position. */
  const clearance = (y: number) => {
    let near = Infinity;
    for (const seam of seams) near = Math.min(near, Math.abs(seam - y));
    return 1 - soft(near / (window.innerHeight * 0.5));
  };

  /*
   * THE ENVELOPE — the shape of a crossing, and the thing every transit
   * channel on the card is carried on: OUT over the first of a leg's travelled
   * page, travelling across the middle, and BACK over the last.
   */
  const shape = (long: boolean) =>
    long ? MOTION.travel.form.long : MOTION.travel.form.lead;
  const out = (long: boolean, w: number) => glide(w / (shape(long).flat || 1));
  const home = (long: boolean, w: number) => {
    const { back } = shape(long);
    return glide((w - back) / (1 - back || 1));
  };

  /**
   * How far from its docks the card is: zero at both of them, one across the
   * middle.
   */
  const awayAt = (long: boolean, w: number) =>
    out(long, w) * (1 - home(long, w));
  /**
   * And its rate — `out` climbing while `home` is still flat, then `home`
   * falling while `out` is.
   */
  const awayRate = (long: boolean, w: number) => {
    const { flat, back } = shape(long);
    return (
      (glideRate(w / (flat || 1)) / (flat || 1)) * (1 - home(long, w)) -
      out(long, w) * (glideRate((w - back) / (1 - back || 1)) / (1 - back || 1))
    );
  };

  /**
   * WHICH LANE the card is heading for at this point of the leg — see
   * MOTION.travel.sway, which is the pair, and `form.cross` and `form.over`,
   * which are where the change happens and how long it takes.
   */
  const lanes = (long: boolean) => (long ? sway.long : sway.lead);
  const laneOf = (long: boolean, w: number) => {
    const { first, second } = lanes(long);
    const { cross, over } = shape(long);
    return (
      first + (second - first) * glide((w - (cross - over / 2)) / (over || 1))
    );
  };
  const laneRate = (long: boolean, w: number) => {
    const { first, second } = lanes(long);
    const { cross, over } = shape(long);
    return (
      ((second - first) * glideRate((w - (cross - over / 2)) / (over || 1))) /
      (over || 1)
    );
  };

  /**
   * Where the card actually is sideways, in fractions of the window's width —
   * the envelope times the lane, so it is exactly on the slot's own centre
   * line at both docks whatever the lanes say.
   */
  const sideAt = (long: boolean, w: number) =>
    awayAt(long, w) * laneOf(long, w);

  /**
   * And how FAST it is going sideways — the product rule on the line above,
   * which is the whole reason it is written analytically rather than sampled.
   */
  const sideRate = (long: boolean, w: number) =>
    awayRate(long, w) * laneOf(long, w) + awayAt(long, w) * laneRate(long, w);

  /**
   * The two numbers the lane needs that are facts about the WINDOW rather than
   * about the choreography, re-derived on every refresh because both are.
   */
  const swing = { lead: 1, long: 1 };
  const fit = { lead: 1, long: 1 };
  const survey = () => {
    const turned = (Math.abs(MOTION.travel.bank) * Math.PI) / 180;
    const halfSpan =
      (far *
        (SQUAD_CARD.width * Math.cos(turned) +
          SQUAD_CARD.height * Math.sin(turned))) /
      2;
    const room = Math.max(
      0,
      window.innerWidth / 2 - halfSpan - window.innerWidth * 0.02,
    );
    for (const long of [false, true]) {
      let peak = 0;
      let reach = 0;
      for (let i = 0; i <= 400; i++) {
        const w = i / 400;
        peak = Math.max(peak, Math.abs(sideRate(long, w)));
        reach = Math.max(reach, Math.abs(sideAt(long, w)));
      }
      const wants = reach * window.innerWidth;
      const key = long ? "long" : "lead";
      swing[key] = peak || 1;
      fit[key] = wants > room ? room / wants : 1;
    }
  };

  /**
   * The pose: the card lies flat to travel, and stands back up into whatever
   * the dock ahead of it draws.
   */
  const poseAt = (leg: Leg, w: number) =>
    leg.from.turn * (1 - out(leg.long, w)) + leg.to.turn * home(leg.long, w);

  /** Place the card for a scroll position. */
  const apply = (s: number) => {
    if (!legs.length) return;

    const first = legs[0]!;
    const last = legs[legs.length - 1]!;
    const leg =
      s < first.knots[0]!.s
        ? null
        : (legs.find((l) => s <= l.knots[l.knots.length - 1]!.s) ??
          (s > last.knots[last.knots.length - 1]!.s ? null : last));

    const { taper, bank, grip } = MOTION.travel;
    const vh = window.innerHeight;

    if (!leg) {
      /*
       * Docked: at the hero before the release, at Early Access after the last
       * approach.
       */
      const home = s < first.knots[0]!.s;
      const d = home ? docks[0]! : docks[2]!;
      const drift = driftOf(d);
      /*
       * And past the last dock, the hand-over — which happens HERE rather than
       * on the way in, and that is the fix for the two cards Early Access used
       * to show.
       */
      const land = home
        ? 0
        : soft((s - last.knots[last.knots.length - 1]!.s) / (vh * grip));
      gsap.set(frame, {
        x: d.x + drift.x,
        y: d.y + drift.y,
        scale: d.scale,
        opacity: home || land >= 1 ? 0 : 1,
      });
      gsap.set(turn, { rotationZ: d.turn });
      hold(-1, home ? 1 : 0, 0, home ? 0 : land);
      return;
    }

    const s0 = leg.knots[0]!.s;
    const s1 = leg.knots[leg.knots.length - 1]!.s;
    const y = pathAt(leg, s);

    /*
     * THE ODOMETER: how much of this leg's PAGE the card has actually covered,
     * and the clock every one of its own properties runs on.
     */
    const w = Math.min(
      1,
      Math.max(0, (y - leg.from.y) / (leg.to.y - leg.from.y || 1)),
    );
    /*
     * Zero at both ends of a leg and one across the middle of it: the shape
     * every transit property is expressed in, so all of them resolve together
     * at a dock and none of them has to be told where the docks are.
     */
    const away = awayAt(leg.long, w);
    const key = leg.long ? "long" : "lead";

    const base = leg.from.scale + (leg.to.scale - leg.from.scale) * w;
    const light = leg.long ? lit.long : lit.lead;
    /*
     * The taper the depth system already runs, for the same reason: motion
     * that is exhilarating at the top of a page is exhausting at the bottom.
     */
    const quiet =
      1 -
      (1 - taper) *
        Math.min(1, y / (document.documentElement.scrollHeight || 1));
    const transit =
      (light.over + (light.seam - light.over) * clearance(y)) * quiet;
    /*
     * Full strength at both ends of every leg, whatever the transit track says
     * — a dock is the card, not a picture of it.
     */
    const into = 1 - soft((s - s0) / (vh * 0.2));
    const onto = 1 - soft((s1 - s) / (vh * 0.2));
    const edge = Math.max(into, onto);

    /*
     * The slots' own depth, blended out as the card leaves them: full at
     * either end of a leg, nothing in the middle, where the card belongs to no
     * section and there is nothing for it to be a layer of.
     */
    const a = driftOf(leg.from);
    const b2 = driftOf(leg.to);
    const drift = {
      x: (a.x + (b2.x - a.x) * w) * (1 - away),
      y: (a.y + (b2.y - a.y) * w) * (1 - away),
    };

    /*
     * The hand-over at the hero, in the order that makes it invisible, and
     * over the stretch of path where the card is not moving — see
     * MOTION.travel.handover, and the knot `measure` pushes for it.
     */
    const swap = (s - s0) / (vh * MOTION.travel.handover);
    const rise = leg.long ? 1 : soft(swap / 0.35);

    gsap.set(frame, {
      x:
        leg.from.x +
        (leg.to.x - leg.from.x) * w +
        drift.x +
        /*
         * The lanes, signed and measured in the window's WIDTH — which is what
         * the arithmetic about reaching the edge of the screen is done in, and
         * why `fit` is a fraction of it.
         */
        sideAt(leg.long, w) * window.innerWidth * fit[key],
      y: y + drift.y,
      scale: base + (far - base) * away,
      opacity: (transit + (1 - transit) * edge) * rise,
      force3D: true,
    });
    gsap.set(turn, {
      /*
       * The flip out of the dock's pose and back into the next one, plus the
       * lean — banked in proportion to how fast the card is crossing into its
       * lane rather than to how far across it has got, so it leans INTO the
       * crossing and comes back to plumb as the crossing.
       */
      rotationZ: poseAt(leg, w) + (bank * sideRate(leg.long, w)) / swing[key],
    });

    /*
     * And the hero's own card goes out under the traveller as it takes over.
     */
    /* And the slots, which take the card back at every dock. */
    /*
     * How much of the approve slot's own card is showing — and it is a
     * function of the DOCK, not of the approach.
     */
    const held = Math.min(
      soft((s - leg.landed) / (vh * grip)),
      1 - soft((s - (s0 - vh * grip)) / (vh * grip)),
    );

    hold(
      -1,
      /* The hero lets go a beat AFTER the traveller has come up under it. */
      leg.long ? 0 : 1 - soft((swap - 0.35) / 0.65),
      /*
       * The approve slot is docked for the head of the long leg, and not yet
       * reached for the whole of the short one.
       */
      leg.long ? held : 0,
      /*
       * And Early Access takes its own card back past the last dock rather
       * than on the way to it — see the branch above.
       */
      0,
    );
  };

  /** What each of the three slots is showing. */
  const hold = (at: number, ...ramp: number[]) => {
    [heroSlot, approveSlot, earlySlot].forEach((el, i) =>
      gsap.set(el, { opacity: ramp[i] ?? (at === i ? 1 : 0) }),
    );
  };

  /** The two slots the traveller stands in for, held at nothing. */
  const park = () => gsap.set([approveSlot, earlySlot], { opacity: 0 });

  /**
   * The scroll range the whole journey is scrubbed across — and a window past
   * the last dock, which is the half of this that is load-bearing.
   */
  const span = () => ({
    from: legs[0]?.knots[0]?.s ?? 0,
    to:
      (legs[1]?.knots[legs[1]!.knots.length - 1]?.s ?? 0) + window.innerHeight,
  });

  return { measure, apply, park, span };
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
