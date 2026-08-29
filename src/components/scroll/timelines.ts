import gsap from "gsap";
import { SQUAD_CARD } from "@/components/ui/SquadCard";
import { asAuthored, authoredRect } from "./measure";
import { MOTION } from "./motion";

/*
 * One factory per beat. Each returns a single PAUSED timeline, which the
 * controller nests into its section's timeline and drives from the scroll.
 *
 * Sections are split into beats rather than given one timeline each because a
 * section arrives in an order — the heading, then the diagram, then whatever
 * the diagram hands down — and beats are that order written out. sections.ts is
 * where they are declared, with the delay that overlaps each one onto the last.
 *
 * These DO run backwards. The scene scrubs a section's beats against its window
 * of scroll (see ScrollSequence), so scrolling up rewinds them — a figure counts
 * back down, a connector un-draws itself. That was not always true: they used to
 * play forward once and never again, and a factory was free to do things that
 * could not be undone. Anything added here now has to survive being reversed,
 * which in practice means tweening properties rather than performing actions.
 *
 * Measuring the DOM at build time is still fine, and still deliberate: the
 * stages scale with the window, so distances are read through functions that
 * re-measure rather than captured once.
 */

/**
 * Whether this element is part of the layout the window is currently getting.
 *
 * Two tiers of markup share one DOM tree. The hero holds a fan of five cards
 * laid out across a 1262px stage AND the same five re-stacked as a deck for a
 * 370px column; the funnel holds three drawn connectors AND the four dashed
 * drops that replace them; three sections hold a bloom for the wide layout and
 * a differently-sized one for the phone. Exactly one of each pair is rendered
 * at any width, and the other is `display: none`.
 *
 * So every query below is filtered through this, and every factory becomes
 * tier-aware for nothing: `q(el, "card")` is the four wide passports above the
 * gate and the four phone ones below it, and a beat written once animates
 * whichever of them the reader can actually see. Without it each factory would
 * be handed both sets — nine cards, three of the offsets meaningless — and the
 * hero would fan out from an anchor belonging to the other layout.
 *
 * A box is what is tested for, because that is what `display: none` takes away
 * and nothing else on this page does: opacity 0 keeps its box (which is the
 * state every one of these elements starts in), and so does visibility:hidden.
 * The one thing that would be read wrongly is `display: contents`, which
 * generates no box of its own — nothing carrying [data-reveal] may have it, and
 * nothing does.
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

/**
 * Every run of connector wiring under `root` with a given name.
 *
 * The funnel is the one diagram whose beats each want a PARTICULAR run rather
 * than all of them — the fan into the signal row, the drop into the engine, the
 * drop into the verdict — and it used to take them by position: slice(0,1),
 * slice(1,2), slice(2). That was true of one layout and one only. The phone
 * replaces the wide fan with two dashed drops rather than one run (see
 * DashDown), so on a phone the same three slices take the first drop, the
 * second drop, and everything after them — three rows wired to the wrong
 * things. Naming the run is what survives a layout that draws the same
 * connection with a different number of lines.
 */
const runs = (root: HTMLElement, name: string) =>
  q(root, "lines").filter((run) => run.dataset.run === name);

/**
 * gsap.set and timeline.to, for a set of elements this tier may not render.
 *
 * Every query above is filtered to the layout the window is actually getting,
 * so coming back with nothing is an ordinary outcome rather than a mistake: a
 * beat cut for the column moves one comparison panel and not the other, and the
 * funnel's aura, its endpoint dot and Life Inside Squad's aura are wide-layout
 * artwork with no phone equivalent at all. GSAP warns on a tween with no
 * targets, which is the right default everywhere else and thirteen lines of
 * console on every phone load here.
 *
 * `move` returns the timeline either way, so it still chains — and where a
 * skipped tween would have shifted a later relative position, the shift is the
 * correct one: what follows lines up behind what actually happened.
 */
const park = (targets: HTMLElement[], vars: gsap.TweenVars) => {
  if (targets.length) gsap.set(targets, vars);
};

const move = (
  tl: gsap.core.Timeline,
  targets: HTMLElement[],
  vars: gsap.TweenVars,
  at?: number | string,
) => (targets.length ? tl.to(targets, vars, at) : tl);

/** A paused timeline with the shared ease, which every beat below starts from. */
const beat = () =>
  gsap.timeline({ paused: true, defaults: { ease: "power1.out" } });

/**
 * The heading's own duration and ease, which a section's payload arrives on so
 * that the two read as one block settling rather than as a diagram waiting its
 * turn behind some words.
 *
 * Read off MOTION.copy rather than restated, because "in step with the heading"
 * is the whole point — a second copy of the number would be one edit away from
 * being a lie.
 */
const inStep = () => ({
  duration: MOTION.copy.duration,
  ease: MOTION.copy.ease,
});

/**
 * Where a section's ambient glow travels in from.
 *
 * A glow that simply faded up in place would make the largest thing on each
 * screen the one thing on it that never moved. Each section's therefore comes in
 * from its own direction, written onto the element as data-glow-from and read
 * back here: a unit-ish vector, scaled by MOTION.glow.travel.
 *
 * Read off the element rather than passed in because the four glows that belong
 * to a diagram are revealed by that diagram's own factory, each in its own
 * place in its own beat, and the markup is the only thing all of them share.
 */
export const glowFrom = (el: HTMLElement) => {
  const [fx = 0, fy = 0] = (el.dataset.glowFrom ?? "").split(" ").map(Number);
  const { travel } = MOTION.glow;
  return { x: travel * fx, y: travel * fy };
};

/** The start state that goes with it: out of nothing, and displaced. */
const glowStart = (els: HTMLElement[]) =>
  els.forEach((el) => gsap.set(el, { opacity: 0, ...glowFrom(el) }));

/**
 * Folds a section's own ambient glow into the beat that opens it.
 *
 * Only for the three sections that have no diagram to hang light on — Alone Vs
 * Together, How Squad Works, Invite Your Squad — where the bloom is a child of
 * the section rather than of a stage (see SectionBloom). The other four reveal
 * theirs inside the factory that builds the diagram it belongs to, because
 * there the glow arrives WITH its subject: the hero's bloom with the card
 * scene, the halo with the Squad card, the aura with the funnel.
 *
 * Two things about it are load-bearing.
 *
 * It is added AFTER the beat has been built, and placed explicitly at 0. Every
 * relative position in these factories ("-=1.5", "<") resolves against the end
 * of the timeline as it stands at the moment it is added — written into a chain
 * this would be read as "a second and a half before the end of everything
 * else", which is not where the ground goes. It goes underneath, from the first
 * frame.
 *
 * And it runs for exactly what the rest of the beat runs for, no longer. The
 * controller queues the next beat behind this one's DURATION, and a timeline's
 * duration is whatever its longest child says it is — so a background that
 * outlasted the heading would quietly push the section's entire payload back by
 * the difference. Measured on the hero before it was capped: 0.48s of card
 * scene, bought by nothing. Read off the timeline rather than configured, so it
 * cannot drift out of agreement with the copy it is under.
 */
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
      /*
       * The beat's own length, except where the beat no longer has one. Early
       * Access's card is flown in by the reader now (see squadTravel), so the
       * only thing left in that beat is this light — and a background that
       * measured itself against a timeline containing nothing but itself would
       * come out at zero and take the section's whole clock with it, since
       * WITH_CARD queues the form behind this beat's duration.
       */
      duration: runs ?? tl.duration(),
      ease: MOTION.copy.ease,
    },
    0,
  );
};

/**
 * The heading block: badge, headline, sub-paragraph, each scaling up out of
 * nothing as it rises.
 *
 * Seven of the eight sections open exactly this way, and deliberately so — the
 * payload underneath is where each one gets to be itself, and seven different
 * heading treatments would flatten that rather than add to it.
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

  /* And the ground the words arrive on, coming in underneath them from
     whichever direction this section's light comes from. */
  return glowIn(tl, el);
}

/**
 * Where a run's light starts and ends, in the run's own coordinates.
 *
 * Shared by the arrival pass and the loop that repeats it forever, because the
 * two have to agree exactly: they animate the same element on the same axis,
 * and a loop that started a pixel from where the arrival finished would show
 * that as a jump every cycle.
 *
 * Measured lazily. The stage scales with the window, so a distance read at
 * build time is wrong by the next resize.
 */
const passOf = (run: HTMLElement) => {
  const spark = run.querySelector<HTMLElement>("[data-spark]");
  if (!spark) return null;

  const down = run.dataset.traceAxis === "y";
  /* Mirrored artwork mirrors this element's own axes with it, so the light has
     to travel backwards in its own coordinates to come out forwards on screen. */
  const flip = "traceFlip" in run.dataset;
  /* The run plus the light's own length: it starts parked just off one end and
     finishes just off the other, so it is never sitting on the artwork at rest. */
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
 *
 * A run never simply fades in — a line that draws itself is the thing being
 * described, a line that fades up is just a line. The light waits for the wipe
 * to reach the far end before setting off, so it passes down a finished line
 * rather than riding the edge of one being made.
 *
 * This is the arrival only. The same pass then repeats for as long as the
 * section is on screen — see traceLoop.
 */
const traceRuns = (
  tl: gsap.core.Timeline,
  runs: HTMLElement[],
  at: number | string,
  stagger = MOTION.trace.stagger,
) => {
  /* Where the previous run's wipe began. The stagger is measured off that
     rather than off "<", because "<" means the last thing added — which is now
     the light, and it starts a whole wipe later. Chaining off it would push
     each run a wipe further behind the one above it. */
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

    /* Resolved rather than assumed: `at` may be relative ("-=0.5"), and this is
       the only place the wipe's real position on the timeline is known. */
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

/**
 * The light going down every connector in a section, over and over.
 *
 * The wiring is the one part of these diagrams that describes something still
 * happening — a request reaching the squad, signals reaching the engine — and a
 * diagram whose wires light once and then never again says that it happened,
 * past tense. So the pass repeats for as long as the section is on screen.
 *
 * The gap is what keeps it an event you notice rather than a loop you have to
 * look away from. It is empty time at the FRONT of the timeline rather than a
 * `repeatDelay` at the back, which is what makes the first pass wait as long as
 * every other one: the loop is started by the arrival finishing, so with the
 * delay behind the pass the light set off the moment the diagram settled and
 * the section opened on two passes half a second apart before falling into its
 * rhythm.
 *
 * Only the light repeats — the wipe is the line being drawn, and drawing it
 * again would mean erasing it first.
 *
 * Ambient, so the controller holds it until the section has finished arriving
 * and drops it whenever the section is off screen. Started any earlier it would
 * be running a light down a line that has not been drawn yet, and the wipe
 * would reveal it already halfway along.
 */
export function traceLoop(el: HTMLElement) {
  /* Paced like the beats, which the controller does for those but not for
     ambients — and this one has to match the arrival pass it continues. */
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

  /*
   * The repeat goes on last, and only if there is anything to repeat.
   *
   * Two of the three diagrams that carry this replace their wide runs with
   * plain dashed drops on the phone — a line to draw, but no light to send down
   * it — so down there this can come out with nothing in it, and a repeat on a
   * timeline of zero duration is a loop with no period.
   */
  if (tl.duration()) tl.repeat(-1);

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * One dock: where a slot rests, how big the card is there, and how it is turned.
 *
 * `authoredRect` rather than a live one, and it earns its keep three times
 * over: the hero's card spends the page's first two and a half seconds
 * mid-quarter-turn, the approve slot is parked 56px low until its section
 * arrives, and Early Access's is parked 300px low and turned on its side. A
 * live rect at any of those moments is a measurement of an animation rather
 * than of a layout.
 *
 * `up` is the pose the slot draws: the two portrait slots are the authored
 * 420x260 face turned a quarter, so what the traveller has to match there is
 * their HEIGHT, and the landscape one is matched on width.
 */
const dockAt = (el: HTMLElement, up: boolean) => {
  const r = authoredRect(el);
  /*
   * The slot, and everything between it and its section that depth might be
   * moving — with the size each of those is a percentage OF, taken now.
   *
   * The chain is what makes this right on both tiers rather than only the one
   * it was written on. Above the gate the approve card is a depth layer in its
   * own right; on a phone it is not, and the diagram is moved by a single
   * `.screen-payload` entry over the whole thing (see DepthLayer.phone). Read
   * off the slot alone, the traveller would carry the wide tier's displacement
   * and none of the phone's, and drift up to 11px out of its own slot during a
   * hand-over — while the real card, which IS displaced, sat next to it.
   *
   * Sizes cached here rather than read per frame: xPercent and yPercent are
   * percentages of a box, and asking a box how big it is on every frame of a
   * scroll is a forced layout on every frame of a scroll.
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
 *
 * The two lower slots are depth layers of their own sections — the approve
 * card at 46 and Early Access's at -28 — and they still are, because they are
 * still in the layout and still describe real elements. But the card the reader
 * sees in them is the traveller, so the traveller is what has to carry that
 * displacement or the section's own parallax stops applying to the one thing in
 * it that matters. Read off the slot rather than re-derived: `parallaxScene`
 * owns xPercent/yPercent there and nothing else writes them, so this is the
 * exact number, live, for the cost of two property reads.
 *
 * Measured against the alternative: docking on the authored rect alone put the
 * card 3.3px above Early Access's slot at 1440x900, growing to 15 at the ends
 * of that section's crossing.
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
 *
 * The path is a chain of knots — a hold, a fall, a hold, a fall — and every
 * join is somewhere the reader could see a corner. `sine.inOut` closes the
 * velocity gap and leaves the acceleration one: it arrives at a knot at rest
 * and leaves at rest, but it starts pulling at full force the instant it
 * leaves, so a fall begins with a jolt the hold before it did not have. With
 * both derivatives clamped there is nothing at the join to see at all.
 *
 * And because everything else about the card is now a function of how far it
 * has travelled — see the odometer in `apply` — the whole object inherits it:
 * position, size, lean and turn are continuous to the second derivative for
 * the length of the page. There is no frame anywhere on the journey where
 * anything about the card changes rate abruptly.
 */
const glide = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

/**
 * `glide`'s own rate: `30t^2(1-t)^2`, clamped flat outside [0,1].
 *
 * Wanted for the lean, which is how fast the card is crossing sideways rather
 * than how far across it has got — see MOTION.travel.bank. Differentiated
 * rather than sampled: a central difference of a function this cheap costs more
 * than its derivative and is only approximately right at the ends, where being
 * exactly right is what makes the lean exactly zero at a dock.
 */
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
 * end. See MOTION.travel.ease.
 *
 * The trapezoid the card's steady half is built on, and the reason there is a
 * steady half at all. `glide` alone cannot serve: its rate is zero at both ends
 * AND highest in the middle, so mixing it with the knot path deepens the stalls
 * instead of filling them. This has a genuine plateau, and it is the plateau
 * that does the work — between the two ramps the card is covering the same page
 * per pixel of scroll no matter what the knots are doing.
 *
 * Built by integrating the rate profile rather than by pasting three curves
 * together, so the joins are exact rather than nearly exact: `glide` up over
 * the first `ease`, one through the middle, `glide` down over the last. Each
 * ramp covers half of what it would at full rate — that is what `glideArea`
 * knows — so the whole profile covers `1 - ease` and dividing by that is what
 * lands it on exactly 1.
 *
 * C2 at both docks and at both joins, which the whole path needs and which is
 * the only reason to do it this carefully.
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
 *
 * One object, three docks, two legs, every frame of it a function of where the
 * reader is and none of it of time — so scrolling up runs the whole thing
 * backwards, stopping stops it, and reloading half way down the page puts the
 * card where it belongs rather than where an animation had got to.
 *
 * See MOTION.travel for the arithmetic that decides the shape, .squad-trail in
 * globals.css for where the card paints, and SquadCardTrail.tsx for why it is a
 * fourth card rather than one of the three it stands in for.
 *
 * Returns a controller rather than a timeline, and it has to: the path is a
 * piecewise function of ABSOLUTE scroll whose knots are derived from where
 * eight sections and three slots happen to be, and every one of those moves on
 * a resize. `measure` re-derives it; the caller scrubs a proxy through `apply`.
 *
 * Null when the trail or any of the three slots is missing, which is every
 * tier below the motion gate — down there the trail element is `display: none`
 * and the page's own three cards are the finished page.
 */
export function squadTravel(root: HTMLElement, tier: "full" | "phone") {
  const frame = root.querySelector<HTMLElement>("[data-card-travel]");
  const turn = root.querySelector<HTMLElement>("[data-card-turn]");
  /* The hero's is whichever of the two fans this width renders — the wide row
     or the phone's deck — which is what `one` is for. The other two are the
     same element in both tiers. */
  const fan = one(root, "[data-sequence-section='hero'] [data-reveal='fan']");
  const slots = [
    one(root, "[data-sequence-section='hero'] [data-fan-anchor]"),
    one(root, "[data-sequence-section='approve'] [data-reveal='squad']"),
    one(root, "[data-sequence-section='early'] [data-reveal='card']"),
  ];
  if (!frame || !turn || !fan || slots.some((el) => !el)) return null;
  const [heroSlot, approveSlot, earlySlot] = slots as HTMLElement[];

  /*
   * The eight sections, and NOT the navbar.
   *
   * It carries [data-sequence-section] because the sequence opens on it, but it
   * is a bar in flow above the page rather than one of the screens: there is no
   * band of air between it and the hero, so the line between them is a boundary
   * and not a seam. Left in, it put a phantom appointment at page 72 — always
   * before every leg and so always dropped, but also always the nearest "seam"
   * to the top of the page, which is the one term `clearance` reads.
   */
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
    /** Where the card came to rest on this leg's HEAD dock — the far end of
        the leg before it. From here to `knots[0].s` the card is sitting
        exactly on that slot and not moving, which is the only stretch a
        hand-over may happen in. See `held` in `apply`. */
    landed: number;
    /** Where the card is first allowed to MOVE, which is `knots[0].s` on the
        long leg and the far end of the hero's hand-over on the short one. The
        steady half of the path is clocked from here rather than from the leg's
        start, so it contributes exactly nothing while the hero still has its
        own card up and the two have to be in the same place. */
    hold0: number;
  };

  let docks: Dock[] = [];
  let legs: Leg[] = [];
  /** Page lines the card falls through — the middle of each section boundary. */
  let seams: number[] = [];

  /**
   * Re-derive the whole journey from where the page currently is.
   *
   * Called on every ScrollTrigger refresh, because every term here is a
   * function of the window: the slots move, the sections change height, and
   * the seams with them.
   */
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
     *
     * Above the gate that is the middle of --screen-between, 144px of margin at
     * 1440x900 and the band globals.css calls the dark between two lit rooms.
     * On a phone the sections butt edge to edge and their own --screen-pad
     * supplies the air, so the same expression lands on the boundary itself.
     * Measured either way, which is the whole reason one rule survives a tier
     * where nothing about the pitch is constant.
     */
    /*
     * Measured AS AUTHORED, like the docks above and for the same reason: the
     * page this runs on is not the page the reader will be looking at.
     *
     * The comparison panels are parked at the height their strength rail begins
     * at until that rail is brought out (see alonePanels), and on a phone —
     * where a section is as tall as its contents — that makes the whole
     * document 236px shorter while they are parked. Every seam below Alone Vs
     * Together would be measured that much too high, against docks that were
     * measured correctly: half the path derived from one page and half from
     * another. `asAuthored` already knows how to put the parked heights back.
     *
     * The hero's fan goes in the same survey for the same class of reason: it
     * spends the page's opening rotated 78deg and pushed 180px back, and the
     * phone's release is derived from where its bottom edge rests.
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
     * window. It runs from the moment the slot clears the fold to the moment it
     * leaves the top, and both ends are MOTION.own.line and its complement:
     * the same line every late beat on this page fires on. So the card is in
     * its slot for as long as the slot is anywhere the reader could be looking,
     * and not one pixel longer.
     */
    const arrives = (d: Dock) => d.y - vh * MOTION.own.line;
    const leaves = (d: Dock) => d.y - vh * (1 - MOTION.own.line);

    /*
     * The hero is the exception, and the fold is what makes it one. The card is
     * not released when its slot clears anything — it is released when the four
     * passport cards have finished folding in behind it and it is the only
     * thing left on the screen. That is the moment the hero's own choreography
     * argues for, and taking the card at any other one would be taking it from
     * a fan that was still closing. See MOTION.hero.fold.
     *
     * Which means reading the fold's own trigger rather than a number: the two
     * tiers hang it on different things. Above the gate it starts as the hero's
     * top edge reaches the top of the window — scroll zero — and runs
     * `fold.out` of a window. On a phone the deck clears the fold far too early
     * for that to mean "done with it", so it is hung on the deck's own bottom
     * edge leaving the bottom of the window, held `foldPhone.lead` longer, and
     * run over a shorter distance. Using the wide number down there released
     * the card 150px of scroll before the deck had finished closing.
     */
    const { fold, foldPhone } = MOTION.hero;
    const release =
      tier === "phone"
        ? boxes.fanBottom - vh * (1 - foldPhone.lead - foldPhone.out)
        : /* The hero's own top edge, not the document's: the fold is hung on
             `top top` and the hero starts below the navbar, so the fold ends
             `out` of a window after the bar has gone rather than after nothing
             at all. 72px at 1440x900. */
          (edge[0]?.top ?? 0) + fold.out * vh;

    const { lift, dash } = MOTION.travel;

    legs = [0, 1].map((i) => {
      const from = docks[i]!;
      const to = docks[i + 1]!;
      const s0 = i === 0 ? release : leaves(from);
      const s1 = arrives(to);
      const knots: Knot[] = [{ s: s0, y: from.y }];
      /* The hero's hand-over, as a stretch of path on which the card does not
         move — see MOTION.travel.handover. Everywhere else the traveller is
         already the only card there is and no exchange is needed. */
      if (i === 0)
        knots.push({ s: s0 + vh * MOTION.travel.handover, y: from.y });

      /* A crest between one appointment and the next: the card climbs back
         towards the top of the window while the section between them is being
         read, which is the half of every cycle that keeps it out of the way.
         Clamped between its neighbours, which is the one hard rule on this
         path — the card may never move UP the page. */
      const crestBefore = (next: Knot) => {
        const prev = knots[knots.length - 1]!;
        if (next.s - prev.s < vh * 0.6) return;
        const mid = (prev.s + next.s) / 2;
        const want = mid - vh * lift;
        knots.push({ s: mid, y: Math.min(Math.max(want, prev.y), next.y) });
      };

      /*
       * One appointment per seam the card crosses: when that seam is centred in
       * the window, the card wants to be centred in the window too. It is the
       * only moment in a section's whole crossing when there is nothing for the
       * card to be behind — one section's light going out and the next one's
       * not yet up — so it is where it is allowed to be at its brightest and
       * its lowest.
       *
       * Wants, and no longer exactly gets: what is drawn is this mixed with a
       * steady glide (see MOTION.travel.rhythm), so the card crosses each seam
       * a little before or after the appointment rather than on it. That costs
       * nothing, because the brightness is read off the card's own position
       * against the seams — `clearance` — and not off the appointment. The
       * appointments still do the work they were added for, which is to put the
       * quick part of each descent in the gap between two sections.
       *
       * An appointment the card cannot both REACH and LEAVE at a sane rate is
       * dropped rather than honoured: near a dock the two constraints fight,
       * and the dock is the one that has to be exact. Both halves are needed
       * and the second half is not hypothetical — at 1440x900 the seam above
       * Early Access is centred in the window three pixels of scroll before
       * that section's card reaches its own line, so honouring it asked for
       * 318px of page in 3px of wheel. Measured, and it is a layout accident
       * rather than a size: 0.85 of a window less half of one is 315, and the
       * Early card happens to sit 318 below the seam.
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
        /* The hero is never "landed" — the card starts there, and its
           hand-over is the one that has to run against a card the page drew
           itself. See MOTION.travel.handover. */
        landed: i === 0 ? s0 : arrives(from),
        /* Past the flat head knot where there is one — see the Leg type. */
        hold0: i === 0 ? knots[1]!.s : s0,
      };
    });
  };

  /**
   * The SHAPE of the card's descent — where a card obeying the page's rhythm
   * outright would sit at this scroll. `pathAt` below is what is drawn.
   *
   * `glide` between knots, and each stretch's own progress warped by a power
   * before it is eased — see MOTION.travel.cadence, which ramps that power
   * down the leg so that the first fall hangs before it commits and the last
   * lets go early and floats in. Four crossings, four shapes, one number.
   *
   * The warp cannot move a knot and cannot let the card climb: it is a power
   * of a number between zero and one, so it is zero at zero, one at one, and
   * increasing in between. The docks stay exact and the one hard rule on this
   * path holds.
   */
  const pathY = (leg: Leg, s: number) => {
    const k = leg.knots;
    let i = 1;
    while (i < k.length - 1 && k[i]!.s < s) i++;
    const a = k[i - 1]!;
    const b = k[i]!;
    const t = Math.min(1, Math.max(0, (s - a.s) / (b.s - a.s || 1)));
    /* Where down the leg this stretch happens, which is what sets its shape.
       The flat holds take the same warp and are unmoved by it. */
    const at = ((a.y + b.y) / 2 - leg.from.y) / (leg.to.y - leg.from.y || 1);
    const bias = 1 + MOTION.travel.cadence * (1 - 2 * at);
    return a.y + (b.y - a.y) * glide(Math.pow(t, bias));
  };

  /**
   * And the path the card actually takes: the knots above mixed with a steady
   * glide from dock to dock. See MOTION.travel.rhythm, which is the mix.
   *
   * The knot path alone spends a leg's whole page in its falls, so between two
   * of them it is exactly stationary — and since every other property the card
   * has is a function of how far it has travelled, a stationary path is a
   * frozen object. Four hundred pixels of scroll at a time where nothing about
   * the card changed at all. This is the fix, and it is a mix rather than a
   * redrawn path because the mix keeps every property the knots were chosen
   * for: the card still quickens through a seam and eases over a section, it
   * simply never arrives at a rate of zero.
   *
   * Both ends stay exact and the one hard rule holds, by arithmetic rather than
   * by care. `cruise` and `pathY` agree at `hold0` and at `s1` — the first
   * because both are still at the leg's head there, the second because both
   * finish on the dock — so the mix agrees with them at both. And both are
   * monotone with `cruise` strictly increasing, so the mix is strictly
   * increasing: the card cannot climb, and cannot stop.
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

  /**
   * How much of a card the reader is being shown at this page position.
   *
   * Highest in a seam, lowest over a section's payload — which is what turns a
   * fade into an occlusion. The page cannot occlude anything (every .screen is
   * transparent to the page's own ground), so what is behind the card has to be
   * authored; what makes it honest is that the schedule comes from the LAYOUT
   * and not from the journey's progress. Every term is a function of place, so
   * scrolling up runs it exactly backwards.
   */
  const clearance = (y: number) => {
    let near = Infinity;
    for (const seam of seams) near = Math.min(near, Math.abs(seam - y));
    return 1 - soft(near / (window.innerHeight * 0.5));
  };

  /*
   * THE ENVELOPE — the shape of a crossing, and the thing every transit channel
   * on the card is carried on: OUT over the first of a leg's travelled page,
   * travelling across the middle, and BACK over the last. See MOTION.travel.form.
   *
   * `out` and `home` are the two crossings, each a `glide` and so each C2 at
   * both of its ends. Their product is the envelope — one by the time the card
   * has finished leaving, still one until it starts arriving, zero at both
   * docks exactly rather than nearly.
   *
   * Keyed on `long` rather than on the leg, because `measure` needs to ask
   * these questions before there is a leg to ask them about.
   */
  const shape = (long: boolean) =>
    long ? MOTION.travel.form.long : MOTION.travel.form.lead;
  const out = (long: boolean, w: number) => glide(w / (shape(long).flat || 1));
  const home = (long: boolean, w: number) => {
    const { back } = shape(long);
    return glide((w - back) / (1 - back || 1));
  };

  /** How far from its docks the card is: zero at both of them, one across the
      middle. What the size, the slots' own depth and the lane are all scaled
      by, so none of them can disagree about when a crossing is over. */
  const awayAt = (long: boolean, w: number) =>
    out(long, w) * (1 - home(long, w));
  /** And its rate — `out` climbing while `home` is still flat, then `home`
      falling while `out` is. */
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
   *
   * A `glide` from the first to the second, so the change is C2 like everything
   * else and the card crosses at rest and arrives at rest. Where the two are
   * equal this is a constant and the whole term disappears, which is what the
   * short leg does.
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
   * the envelope times the lane, so it is exactly on the slot's own centre line
   * at both docks whatever the lanes say.
   */
  const sideAt = (long: boolean, w: number) =>
    awayAt(long, w) * laneOf(long, w);

  /**
   * And how FAST it is going sideways — the product rule on the line above,
   * which is the whole reason it is written analytically rather than sampled.
   *
   * This is what the lean is written on. A card tilted in proportion to how far
   * across it has got is a card that sits at a fixed angle for the length of a
   * lane; a card tilted in proportion to how fast it is crossing leans over as
   * it goes out, rides level down each lane, leans the OTHER way through a
   * change that reverses direction, and comes back to plumb as it arrives.
   *
   * Taking the real derivative rather than the envelope's is what makes that
   * true for any lane pair anyone types, signs included. The envelope alone
   * knows nothing about which way the card is going, so on a lane to the left
   * it banked away from the direction of travel, and through a change of sides
   * it did not bank at all.
   *
   * Exactly zero at both docks without being told where they are: `awayRate`
   * and `awayAt` are both zero there, and every term has one of them in it.
   */
  const sideRate = (long: boolean, w: number) =>
    awayRate(long, w) * laneOf(long, w) + awayAt(long, w) * laneRate(long, w);

  /**
   * The two numbers the lane needs that are facts about the WINDOW rather than
   * about the choreography, re-derived on every refresh because both are.
   *
   * `swing` is the sharpest the card ever crosses on this leg, which is what
   * the lean is measured against so that MOTION.travel.bank stays "degrees at
   * the sharpest crossing" whatever the lanes are set to.
   *
   * `fit` is the fraction of the lane the window will take. The card in transit
   * is a 420x260 face at `far` leaning up to `bank` degrees, and half of that
   * bounding box has to stay inside half the window — less a fiftieth of the
   * window at either side, because a card that exactly kisses the edge reads
   * as one about to be cut off. So if the wider lane would put it past that,
   * BOTH lanes are scaled down by the same factor. Scaling rather than
   * clamping is the point: a clamp is a corner, and the card would arrive at
   * the edge of the window and stop dead. Scaled, the shape and all of its
   * derivatives survive and only the size gives.
   *
   * Sampled rather than solved because `sideAt` is a product of three glides
   * and its extremum has no useful closed form. Four hundred points twice, on
   * refresh only.
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
   *
   * Two ramps on the same envelope rather than one interpolation from dock to
   * dock, and that is the whole gesture. The face is authored landscape and the
   * two upper slots are it turned a quarter, so leaving one means lying down and
   * arriving at another means standing up — and between them the card is simply
   * itself, at zero, for the stretch of the leg the reader spends the most time
   * in.
   *
   * It falls out of the arithmetic that the long leg needs no third rule: Early
   * Access's slot is the landscape one, so `to.turn` is zero there and the card
   * that lay down on leaving the diagram is already in the pose it lands in.
   * One statement, two different-looking crossings.
   */
  const poseAt = (leg: Leg, w: number) =>
    leg.from.turn * (1 - out(leg.long, w)) + leg.to.turn * home(leg.long, w);

  /**
   * Place the card for a scroll position.
   *
   * One statement of where the card is and what it looks like at any point,
   * rather than two that have to agree.
   */
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
      /* Docked: at the hero before the release, at Early Access after the last
         approach. Nothing is in transit, so nothing carries a transit value. */
      const home = s < first.knots[0]!.s;
      const d = home ? docks[0]! : docks[2]!;
      const drift = driftOf(d);
      /*
       * And past the last dock, the hand-over — which happens HERE rather than
       * on the way in, and that is the fix for the two cards Early Access used
       * to show.
       *
       * The card has landed and stopped. From this point the section's own
       * card comes up over a traveller still at full strength, in exactly the
       * same place, over MOTION.travel.grip of the window: two appearances of
       * one object dissolving into each other rather than two objects trading
       * places. Only when it has completely taken over does the traveller go
       * out, and by then there is an identical opaque card drawn over it.
       */
      const land = home
        ? 0
        : soft((s - last.knots[last.knots.length - 1]!.s) / (vh * grip));
      gsap.set(frame, {
        x: d.x + drift.x,
        y: d.y + drift.y,
        scale: d.scale,
        /*
         * Nothing at all, at either end. Before the release the hero still has
         * its own card; past the last dock Early Access has taken its own back
         * (see `hold`), and a traveller left at full strength behind it is a
         * frozen copy that the real card's own depth drifts out from behind by
         * up to fifteen pixels as the reader goes down the section.
         *
         * The hero end is the one that had to be got right rather than merely
         * tidy.
         *
         * The hero spends the page's opening turning that card up out of
         * landscape (MOTION.hero.turn), and a portrait copy held at full
         * strength underneath a card sweeping through a quarter circle is two
         * Squad cards for the length of the entrance — the exact failure the
         * first attempt at this effect shipped and documented. Screenshotted at
         * 500ms and unmistakable. There is nothing for the traveller to do here
         * anyway: the card in this slot IS the hero's, and the traveller's
         * whole job starts when it leaves.
         */
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
     *
     * Scroll progress is the obvious choice and it is the wrong one, because
     * this path deliberately spends half of its scroll standing still. On that
     * clock the card's size, its lean, its drift sideways and its quarter turn
     * all advanced while it was parked above the top of the window between two
     * seams, and were very nearly FROZEN over the moments it was actually on
     * screen. What the reader saw was a rectangle of fixed size and fixed
     * attitude sliding down a straight vertical line, four times, finding
     * itself mysteriously smaller and further round each time it came back.
     * Every secondary channel on the card was being spent where there was
     * nobody to see it.
     *
     * On the odometer all of them are spent where the card is moving, which is
     * exactly where it can be seen: each crossing is an arc rather than a
     * line, the card leans into its own drift, changes size as it goes past,
     * and turns while the reader is watching it turn.
     *
     * It also inherits the path's own smoothness, and that is the half of this
     * that could not be got any other way. The odometer's rate IS the path's
     * rate — so every property eases as the card settles towards a seam and
     * picks up again as it leaves, on the same curve the path itself uses. The
     * arrival at each seam is a miniature of the arrival at a dock.
     *
     * Which cuts both ways, and is why MOTION.travel.rhythm had to exist. On a
     * path that stops, everything on this clock stops with it: measured over
     * the three stretches of the long leg where the knot path was flat, x,
     * scale and lean did not change by a hundredth over six hundred pixels of
     * scrolling apiece. The mix that keeps the path moving is what keeps the
     * whole object moving, and it is one number rather than four because they
     * all read the same clock.
     */
    const w = Math.min(
      1,
      Math.max(0, (y - leg.from.y) / (leg.to.y - leg.from.y || 1)),
    );
    /* Zero at both ends of a leg and one across the middle of it: the shape
       every transit property is expressed in, so all of them resolve together
       at a dock and none of them has to be told where the docks are. And the
       destination has hold of the card well before it gets there — the lane,
       the size and the pose all come home over the same last stretch, so the
       final approach is plumb, centred, upright and still. */
    const away = awayAt(leg.long, w);
    const key = leg.long ? "long" : "lead";

    const base = leg.from.scale + (leg.to.scale - leg.from.scale) * w;
    const light = leg.long ? lit.long : lit.lead;
    /*
     * The taper the depth system already runs, for the same reason: motion that
     * is exhilarating at the top of a page is exhausting at the bottom. Read
     * off the card's own position down the document rather than off the leg, so
     * it is one continuous fall rather than two that reset.
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
     *
     * Measured in SCROLL rather than in fractions of a leg, and that is the fix
     * for the one place this went visibly wrong. A tenth of the long leg is
     * 436px of scroll at 1440x900, and 436px before the last dock the card is
     * still crossing the middle of Invite Your Squad — so it came up to a third
     * opacity directly behind that section's QR panel, which is 50% black on a
     * near-black ground and hides nothing. Tied to the window instead, the card
     * is only allowed to be a card again once it is within a fifth of a window
     * of the slot, by which point it is in the seam above it and there is
     * nothing left to be behind.
     *
     * Kept as two ramps rather than one symmetric value, because the two ends
     * of a leg hand over to different elements — see `hold`.
     */
    const into = 1 - soft((s - s0) / (vh * 0.2));
    const onto = 1 - soft((s1 - s) / (vh * 0.2));
    const edge = Math.max(into, onto);

    /* The slots' own depth, blended out as the card leaves them: full at either
       end of a leg, nothing in the middle, where the card belongs to no section
       and there is nothing for it to be a layer of. */
    const a = driftOf(leg.from);
    const b2 = driftOf(leg.to);
    const drift = {
      x: (a.x + (b2.x - a.x) * w) * (1 - away),
      y: (a.y + (b2.y - a.y) * w) * (1 - away),
    };

    /*
     * The hand-over at the hero, in the order that makes it invisible, and over
     * the stretch of path where the card is not moving — see
     * MOTION.travel.handover, and the knot `measure` pushes for it.
     *
     * The traveller comes up first, under a card at full strength in exactly
     * the same pose and the same place, so bringing it up changes nothing the
     * reader can see. Only then does the hero let go. Crossing them the other
     * way round is a hole; crossing them at the same time is two half-strength
     * copies compositing to a quarter less than either; and crossing them while
     * the traveller is already falling is two cards in two places, which is
     * what this looked like before the flat run was put in.
     *
     * Both are functions of scroll and both therefore reverse: scroll back up
     * and the hero takes its card back.
     */
    const swap = (s - s0) / (vh * MOTION.travel.handover);
    const rise = leg.long ? 1 : soft(swap / 0.35);

    gsap.set(frame, {
      x:
        leg.from.x +
        (leg.to.x - leg.from.x) * w +
        drift.x +
        /* The lanes, signed and measured in the window's WIDTH — which is
           what the arithmetic about reaching the edge of the screen is done
           in, and why `fit` is a fraction of it. See MOTION.travel.sway for
           the pair and MOTION.travel.form for where the change between them
           happens. */
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
       * crossing and comes back to plumb as the crossing stops. That is the
       * relationship an aircraft has with a turn and the one a rectangle
       * sliding about at a fixed tilt does not.
       *
       * It costs nothing that was not already being spent — the same property
       * the flip is written on, one term further along.
       */
      rotationZ: poseAt(leg, w) + (bank * sideRate(leg.long, w)) / swing[key],
    });

    /*
     * And the hero's own card goes out under the traveller as it takes over.
     * Both are the same card at the same size in the same place for the whole
     * of the hand-over and the hero's is in FRONT of it, so what the reader
     * sees is one card the whole time rather than two at half strength each.
     */
    /*
     * And the slots, which take the card back at every dock.
     *
     * The traveller paints behind every section, and a section is not opaque —
     * so at a dock it is lit by whatever that section hangs in FRONT of it.
     * Measured at Early Access, whose two 412px blooms sit at -z-10 inside the
     * one stacking context the card cannot get into: the flown card came out
     * visibly lilac and a stop lower in contrast than the authored one, at the
     * last and most important dock on the page.
     *
     * There is no z-index that fixes that. Five of the eight sections carry
     * `isolate`, so from outside one there is no position between a section's
     * light and its content — the card is either entirely behind the section or
     * entirely in front of it, and in front is the distraction this whole shape
     * exists to avoid.
     *
     * So the real card takes over at the dock, which is what it is there for.
     * It comes up OVER the traveller, at exactly the same size in exactly the
     * same place — measured at [0,0,0,0] on every dock at every width — so the
     * only thing that changes across the hand-over is the light on it, and it
     * changes over a fifth of a window of scrolling. The card arrives and the
     * section's light comes up on it, which is what arriving in a lit room
     * looks like.
     *
     * The hero is the one that goes the other way, and it has to: there the
     * real card is the one that starts visible, so the traveller comes up
     * underneath it first and only then does the hero let go. Crossing either
     * of them the other way round is two half-strength copies of one card,
     * which composites to a quarter less than either.
     */
    /*
     * How much of the approve slot's own card is showing — and it is a
     * function of the DOCK, not of the approach.
     *
     * A dock is a stretch of scroll, from `landed` (where the card comes to
     * rest on the slot) to `s0` (where it starts moving again), over which the
     * traveller is exactly on the slot, at full strength, and stationary. Both
     * halves of the exchange happen inside it: the section's card comes up
     * over the traveller once the traveller has stopped, and goes back down
     * before it moves again. Whichever card is underneath is at full strength
     * for the whole of the other one's ramp, which is the ordering the hero's
     * hand-over has always used and the reason it is invisible.
     *
     * Both cards are opaque — measured, the mean colour inside the card at a
     * dock is identical with the traveller behind it and without it — so a
     * ramp of the top one over a full-strength bottom one composites to
     * `a * top + (1 - a) * bottom` at every point. One object changing its
     * light, in place, with nothing to see at either end of it.
     *
     * What this replaces was a ramp measured in SCROLL, a fifth of a window
     * either side of the dock line, and it straddled that line: the slot's own
     * card was already half lit while the traveller was still on its way in.
     * Measured at 1440x900 — the approve slot at 0.36 with the traveller at
     * 0.47 and 233px short of it, and again at 0.39 on the way out with the
     * card 26px gone. Two cards, at both ends of both docks.
     */
    const held = Math.min(
      soft((s - leg.landed) / (vh * grip)),
      1 - soft((s - (s0 - vh * grip)) / (vh * grip)),
    );

    hold(
      -1,
      /* The hero lets go a beat AFTER the traveller has come up under it. */
      leg.long ? 0 : 1 - soft((swap - 0.35) / 0.65),
      /* The approve slot is docked for the head of the long leg, and not yet
         reached for the whole of the short one. */
      leg.long ? held : 0,
      /* And Early Access takes its own card back past the last dock rather
         than on the way to it — see the branch above. */
      0,
    );
  };

  /**
   * What each of the three slots is showing.
   *
   * Called from every frame of `apply`, with `at` naming the dock the card is
   * sitting in outright (or -1 for none) and the three ramps overriding that
   * where a hand-over is under way. One writer for all three, so no two of them
   * can disagree about which is holding the card.
   */
  const hold = (at: number, ...ramp: number[]) => {
    [heroSlot, approveSlot, earlySlot].forEach((el, i) =>
      gsap.set(el, { opacity: ramp[i] ?? (at === i ? 1 : 0) }),
    );
  };

  /**
   * The two slots the traveller stands in for, held at nothing.
   *
   * They stay in the DOM, in the layout, and are still what everything else is
   * measured against — the approve diagram's connectors are drawn against that
   * box and the Early stage is sized by its card — they simply never draw,
   * because the card that belongs in them is the one coming down the page. See
   * approveDiagram and earlyCard, which no longer reveal them, and the note in
   * the controller on why this has to be written rather than left to the
   * stylesheet.
   */
  const park = () => gsap.set([approveSlot, earlySlot], { opacity: 0 });

  /**
   * The scroll range the whole journey is scrubbed across — and a window past
   * the last dock, which is the half of this that is load-bearing.
   *
   * A scrubbed trigger stops calling its animation at the end of its range, so
   * a range that ended AT the dock left the traveller frozen on the page at
   * whatever position it was last handed — while the real card it had just
   * given the slot back to went on drifting with Early Access's own parallax.
   * Measured at 1440x900: the two were 15px apart by the time that section had
   * finished arriving, both at full strength, at the closing image of the
   * page. The branch in `apply` that hands that slot over past the last dock
   * was written for exactly this and could never be reached.
   *
   * With the tail it runs from the first frame past the dock, which is where
   * the whole of Early Access's exchange now happens.
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
 *
 * The header keeps its 72px slot in flow the whole time — this is a transform,
 * so nothing below it moves and the document height never changes.
 */
export function navbarDrop(el: HTMLElement) {
  const pill = one(el, "[data-reveal='nav-pill']");
  if (!pill) return beat();

  gsap.set(el, { opacity: 1 });
  /*
   * -el.offsetHeight, not yPercent: -100. The pill is 56px tall but sits 16px
   * down inside the 72px header, so its own height leaves a strip of it still
   * on screen; the header's height is the distance that actually clears the
   * top edge.
   */
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
 * Hero, movement one: the copy rises and fades up, then the CTAs — lying
 * flat on the screen plane — hinge upright off their bottom edge.
 *
 * Held back a beat behind the navbar. Both are on screen the moment the page
 * loads, so without that they would fire together; see MOTION.hero.afterNav.
 */
export function heroCopy(el: HTMLElement) {
  const copy = q(el, "copy");
  const buttons = q(el, "button");
  const note = q(el, "note");

  /* Rise and fade, and no scale. The heading used to grow from nothing, which
     on a 72px h1 is a line of type sweeping up through every size between one
     pixel and full — the words are unreadable for most of it and the block
     under it reflows the whole way. Same start state as copyIn now. */
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

  /* No glowIn here, unlike copyIn: the hero's bloom is [data-reveal='glow'] too,
     but it belongs to the card scene and heroCards reveals it there. Revealing
     it twice would leave two tweens writing the same opacity on the same
     element from two different beats. */
  return tl;
}

/**
 * Hero, movement two: the card scene, fired by the card scene arriving.
 *
 * The whole deck is lying flat on the display, stacked exactly behind the Squad
 * card, which is on its side in the same horizontal pose the CTAs started in. It
 * lifts off the plane and turns counter-clockwise into position as one unit, and
 * only once upright do the passport cards come out from behind it.
 */
export function heroCards(el: HTMLElement) {
  const glow = q(el, "glow");
  const fan = q(el, "fan");
  const cards = q(el, "card");
  const anchor = one(el, "[data-fan-anchor]");
  if (!anchor) return beat();

  /*
   * Every passport card is pulled onto the Squad card's exact centre, so the
   * deck is a single stack with nothing peeking out — they only exist once they
   * come out from behind it. Measured off the DOM in unscaled stage units,
   * which is the space GSAP's x lives in.
   */
  const stacked = (card: HTMLElement) =>
    anchor.offsetLeft +
    anchor.offsetWidth / 2 -
    (card.offsetLeft + card.offsetWidth / 2);

  /* The bloom and band come in from under the section, which is the direction
     the whole hero opens from — see glowFrom. */
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
  /*
   * The Squad card starts on its side. The component already turns its face
   * -90deg to stand upright, so +90 here cancels that back to landscape; the
   * tween to 0 is the counter-clockwise quarter turn into its real position.
   */
  gsap.set(anchor, { rotationZ: MOTION.hero.turn });

  /*
   * The one place the two tiers do not share a number, and the only one they
   * cannot. Everything else here is measured off whichever layout is rendered
   * and comes out right by construction; how long a movement should TAKE is not
   * something the DOM can be asked, and the deck covers a quarter of the wide
   * fan's distance. The layout says which it is — see the note on
   * MOTION.hero.fanPhone, and [data-tier] in HeroFanPhone.
   */
  const deal =
    fan[0]?.dataset.tier === "phone" ? MOTION.hero.fanPhone : MOTION.hero.fan;

  return (
    beat()
      .to(glow, { opacity: 1, x: 0, y: 0, ...MOTION.hero.glow }, 0)
      .to(fan, { opacity: 1, duration: 0.3, ease: "none" }, 0.2)
      /* Lifts off the display plane and turns upright in one movement. */
      .to(fan, { rotationX: 0, z: 0, ...MOTION.hero.lift }, "<")
      .to(anchor, { rotationZ: 0, ...MOTION.hero.lift }, "<")
      /* Only now does anything come out from behind the Squad card — overlapped
       with the last of the lift, so they start emerging as it finishes standing
       rather than after a pause with nothing happening. */
      .to(cards, { opacity: 1, x: 0, ...deal }, "-=0.35")
  );
}

/**
 * The hero's fan closing again, scrubbed by the scroll.
 *
 * The last thing heroCards does is bring the four passport cards out from
 * behind the Squad card; this is that, run backwards, and it is what the reader
 * does rather than what they watch. Scroll away from the hero and the four fold
 * back in behind the Squad card and are gone, leaving one card on the screen:
 * the product, alone, which is what the hero was about.
 *
 * It replaced a straight fade, which said nothing: five cards dimming in place
 * is five things being switched off, with no reason for any one of them to be
 * the one that mattered. Folding the four into the Squad card makes it the
 * thing they came out of, so what is left on the screen as the hero leaves is
 * the one card the section is for.
 *
 * Backwards through the fan, too — `from: "end"` — so they close in the reverse
 * of the order they opened.
 *
 * Only the four. The Squad card between them keeps its place, its size and its
 * opacity, and nothing here or anywhere else takes it away — it simply scrolls
 * off the top of the window the way the rest of the section does. Reversing the
 * other half of heroCards as well would turn it back onto its side and lie it
 * flat again, which reads as the product being put away rather than as the fan
 * closing around it.
 *
 * Returns null if the hero is not on the page.
 */
export function heroFold(el: HTMLElement) {
  const cards = q(el, "card");
  const anchor = one(el, "[data-fan-anchor]");
  if (!cards.length || !anchor) return null;

  /* Where each card sits when it is stacked behind the Squad card — the same
     measurement heroCards opens from, in the stage's own units, which is the
     space GSAP's x lives in and which no amount of stage scaling changes. */
  const stacked = (card: HTMLElement) =>
    anchor.offsetLeft +
    anchor.offsetWidth / 2 -
    (card.offsetLeft + card.offsetWidth / 2);

  /*
   * fromTo, and both ends stated.
   *
   * A plain `to` records its start values the first time it renders, and a
   * scrubbed timeline renders the moment its trigger is created — which is
   * while heroCards is still animating these same four cards from behind the
   * Squad card. One of them was caught at the far end of that and pinned there:
   * folded and invisible before the reader had scrolled a hundred pixels, while
   * the other three behaved. Measured. Stating the resting state explicitly
   * makes this independent of when it happens to be built.
   *
   * immediateRender: false so that stating it is not the same as applying it —
   * the fold must not put the cards in their resting state on creation, which
   * would be the hero's entrance skipping to its own end.
   */
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

/**
 * The four passport cards, breathing, for as long as the hero is on screen.
 *
 * Ambient rather than a beat: it has no arrival to be part of and no end to
 * reach. The controller holds it until heroCards has finished opening the fan —
 * a float running underneath that entrance would be moving the cards while they
 * were still travelling — and drops it as soon as the section is scrolled past.
 *
 * One independent tween per card rather than one tween with a stagger. A
 * staggered tween carrying repeat:-1 repeats the SET: all four restart together
 * at the top of every cycle, which is the one thing this is written to avoid.
 * Four tweens offset on the parent timeline stay out of phase forever.
 *
 * Translation only, and no rotation. The float used to carry a fifth of a
 * degree of alternating tilt, and that fifth of a degree was the flicker: a
 * rotation that is not even a whole pixel of movement still forces the card to
 * be re-rastered at a new angle on every frame, and what gets redrawn is the
 * card's own background — its gradient, its fingerprint texture, its 1px border
 * and every line of type on it. A pure translate is a matrix the compositor can
 * apply to a raster it already has, so nothing about the card is redrawn while
 * it moves.
 */
export function heroFloat(el: HTMLElement) {
  const { rise, duration, each, ease } = MOTION.hero.float;
  const tl = gsap.timeline({ paused: true });

  const cards = q(el, "card");

  /* Promoted once, up front, and left promoted: these animate for as long as
     the hero is on screen, so a compositor layer each means the float is a
     matrix applied to an existing raster rather than a repaint every frame. */
  park(cards, { willChange: "transform", force3D: true });

  cards.forEach((card, i) => {
    tl.to(card, { y: -rise, duration, ease, repeat: -1, yoyo: true }, i * each);
  });

  return tl;
}

/**
 * A section's ambient glow, drifting for as long as that section is on screen.
 *
 * The one ambient every section has, and it moves the largest
 * things on the page: the bloom and band behind the hero's card fan, the halo
 * behind the approve diagram, the aura behind the intelligence funnel, the pair
 * behind the Early Access card, and the section's own bloom on the three
 * screens that had none. Whatever a section's light is, [data-glow-from] is on
 * it and this drifts it.
 *
 * Not [data-glow], which is a different thing that was here first: the rings on
 * the step cards and the layers inside the engine hub carry that, and they
 * breathe rather than drift — see worksAmbient and intelAmbient.
 *
 * Same construction as heroFloat and for the same reason: one independent tween
 * per layer rather than one tween with a stagger. A staggered tween carrying
 * repeat:-1 repeats the SET — all its targets restart together at the top of
 * every cycle, which is the one thing this is written to avoid.
 *
 * Layers also travel in opposite directions — `away` flips per layer — which is
 * what turns two overlapping ellipses into light that shears slowly across
 * itself instead of one plate sliding about. The y component is deliberately a
 * fraction of the x one and inverted: equal amounts on both axes is a diagonal,
 * and a diagonal is a direction the eye can name. This has no direction to
 * name.
 *
 * `step` is the one thing that is new. The layers used to share a duration and
 * be held apart by a stagger alone, which keeps them out of phase but on the
 * same clock; giving each its own period as well means there is no cycle at
 * which the set repeats at all, so a reader sitting on one section never sees
 * the same arrangement of light twice.
 *
 * Ambient, so the controller holds it until the section has finished arriving —
 * it would otherwise be dragging a bloom sideways while it was still travelling
 * in — and drops it as soon as the section is scrolled past.
 */
export function glowDrift(el: HTMLElement) {
  const { scale, shift, duration, step, stagger, ease } = MOTION.glow.drift;
  const tl = gsap.timeline({ paused: true });

  /* Whatever light this tier actually draws. Three sections are lit above the
     gate and not below it (see SectionBloom), so down there this legitimately
     comes back empty and the loop is one with nothing in it. */
  const layers = gsap.utils
    .toArray<HTMLElement>(el.querySelectorAll("[data-glow-from]"))
    .filter(shown);

  /* Promoted once and left promoted, like the passport cards: these animate for
     as long as their section is on screen, so a compositor layer each is the
     difference between stretching a raster and repainting a window's worth of
     soft light on every frame. */
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
 *
 * The element's own text is the target. Nothing declares the number twice, so a
 * figure cannot be edited in the markup and left animating to a stale value —
 * and the frame the count ends on is that exact string, restored rather than
 * re-formatted, so no rounding of ours can land a pixel off what the page would
 * otherwise have shown.
 *
 * Anything that is not a number is skipped rather than blanked: a rail is free
 * to carry a word in a slot a figure usually sits in.
 */
const FIGURE = /^(\D*)([\d.,]+)(\D*)$/;

/** How a run of figures counts: the tween itself, and the gap between one and
    the next. Both sections that count pass their own MOTION entry. */
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
     * it was read from. This beat is built more than once — gsap.matchMedia
     * rebuilds it whenever the viewport crosses the breakpoint, and React
     * builds it twice on mount in development — and a rebuild landing mid-count
     * would otherwise read a figure part way to its value and treat that as the
     * value.
     */
    const printed = cell.dataset.count || cell.textContent || "";
    cell.dataset.count = printed;

    const parts = FIGURE.exec(printed);
    if (!parts) return;

    const [, prefix, digits, suffix] = parts;
    const target = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(target)) return;

    /* Both read off the printed figure rather than configured: it is the one
       place the format is stated, so a rail that prints 21.5 counts in tenths
       and one that prints 502 counts in whole numbers, with nothing to keep in
       sync. */
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
        /*
         * Nothing is touched until the figure is actually counting. Building a
         * beat is not playing it — the rails are built on hydration and played
         * a scroll later, and zeroing them up front would leave six 0s sitting
         * in the markup for all of it.
         *
         * The width is measured on this frame for the same reason: it is the
         * last one before the text changes, and it is long enough after load
         * for the figure to have been laid out in its real font rather than the
         * fallback.
         *
         * It has to be held at all because the stat row is `justify-between` —
         * a figure narrower mid-count than it lands drags its neighbours and
         * the hairlines between them around for the whole count, and a single
         * digit is less than a third the width of the three it settles on.
         *
         * A floor, not a lock. Inter's 1 is narrower than its other digits, so
         * a figure that lands on 712 passes through wider three-digit values on
         * its way; what the floor removes is the collapse, and the few px left
         * mostly disappear into columns whose label is the wider element
         * anyway. Measured across both rails, the hairlines hold to within a
         * pixel for the whole count.
         *
         * offsetWidth rather than a bounding rect: the stage this sits in is
         * scaled, and a rect would hand back a scaled width to be set as an
         * unscaled one.
         */
        onStart: () => {
          cell.style.minWidth = `${Math.ceil(cell.offsetWidth)}px`;
        },
        onUpdate: () => {
          cell.textContent = show(run.n);
        },
        /* Restored rather than re-formatted, and the pin released with it, so
           the frame this settles on is the markup's own. */
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
 * Fills every [data-meter] under `root` from empty to the percentage it carries.
 *
 * The percentage lives in the attribute rather than being read back off the
 * element, for the same reason the counting figures keep theirs: emptying the
 * bar is the first thing this does, so the rendered width stops being the
 * target the moment there is anything to rebuild from.
 *
 * A width rather than a scaleX. These are 6px tall with fully rounded caps, and
 * a bar scaled up from nothing wears its end caps squashed flat for the first
 * half of the fill. Widening costs nothing here — the bar is absolutely
 * positioned inside its own track, so no sibling is laid out again for it.
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
     * tweening it back. Building a beat is not playing it: these are built on
     * hydration and played a scroll later, and a plain set would leave four
     * empty meters sitting in the markup for all of it. Off is not the default
     * here — a from-tween applies its start state the moment it is created
     * unless told otherwise, paused timeline or not.
     *
     * Both ends stated in %, so gsap never has to measure the track to convert
     * a px start into the percentage the markup asked for.
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
 *
 * The lift is a fixed distance in stage units — see MOTION.alone.lift — which
 * is the whole reason it replaced the slide it used to be. Coming in from the
 * viewport edges meant the distance depended on how much wider the window was
 * than the scaled stage, so it had to be re-measured on every build and could
 * not be stated anywhere. A rise is the same number at every size.
 */
/**
 * Each comparison panel's full height, captured the first time it is asked for
 * and kept for the life of the page.
 *
 * Two beats need it and only one of them may measure it: alonePanels parks the
 * panels short by writing a height onto them, so anything reading offsetHeight
 * afterwards reads back the value that beat set rather than the one the
 * stylesheet gives. Keyed on the element, so the rebuild gsap.matchMedia does
 * on a breakpoint crossing — and the second render React does in development —
 * find the height captured before any of it started.
 */
/*
 * How tall each comparison panel is when it is whole.
 *
 * Cached because the beat that reads it is also the beat that overwrites the
 * thing it is read from — alonePanels parks the panels short, so by the time
 * aloneRails wants the full height there is no longer a panel that has one.
 *
 * Measured as AUTHORED rather than as-is, and cleared whenever alonePanels
 * runs. Both are about the two tiers: a panel is 628px tall above the gate and
 * 514 below it, and the window can cross that boundary while a cached number
 * from the other side is still sitting here — which is a phone panel growing to
 * a desktop panel's height and 114px of empty card under the rail. Clearing it
 * at the top of the beat that captures it means the cache never outlives the
 * layout it was taken from.
 */
const fullHeights = new WeakMap<HTMLElement, number>();
const grown = (panel: HTMLElement) => {
  const known = fullHeights.get(panel);
  if (known !== undefined) return known;
  const h = asAuthored([panel], () => panel.offsetHeight);
  fullHeights.set(panel, h);
  return h;
};

/**
 * `only` is the phone's cut of a beat the wide layout plays as one.
 *
 * Above the gate the two comparison panels are side by side and arrive
 * together, which is the section's whole argument put on the screen at once. In
 * the column they are 590px apart — one of them is a windowful below the fold
 * when the other clears it — so the phone plays this twice, a panel at a time,
 * each on its own trigger. See SectionSpec.column.
 *
 * Undefined means all of them, which is what the wide tier passes and what the
 * factory did before there was a phone to cut it for.
 */
export function alonePanels(el: HTMLElement, only?: number) {
  const both = [...q(el, "card-left"), ...q(el, "card-right")];
  const panels = only === undefined ? both : both.slice(only, only + 1);
  /* The badge sits in the gap BETWEEN the panels, so it belongs to whichever
     beat brings the second of them: the pair, up here; the lower panel, down
     there. */
  const vs = only === 0 ? [] : q(el, "vs");
  const bars = panels.flatMap((panel) => q(panel, "bar"));

  /* No scale. It was the last grow in this section and, at 48px of display
     italic, the one where it showed most. */
  park(vs, { opacity: 0 });

  /*
   * The rails are never hidden — the panels are simply too short to contain
   * them yet, and each panel clips its own overflow. A panel ends level with
   * where its rail begins, so growing it back to full height is what brings the
   * rail out: the card genuinely extends, and there is no dead space sitting at
   * the bottom of a panel waiting for a rail that has not arrived.
   *
   * Height rather than a clip because the panel's ring is drawn outside its
   * box — clipping shears that stroke off the bottom edge, which reads as a
   * card cut in half rather than a shorter card.
   */
  /* Re-measured on every build, so a height cached on the other side of the
     gate cannot be applied to this one — see grown. */
  for (const panel of panels) fullHeights.delete(panel);
  for (const panel of panels) grown(panel);
  const shortHeight = (panel: HTMLElement) =>
    panel.querySelector<HTMLElement>("[data-reveal='bar']")?.offsetTop ??
    grown(panel);

  gsap.set(bars, { opacity: 1 });
  /* After fullHeight is captured, not before — offsetHeight is unaffected by
     opacity and transforms, but the height below overwrites the very thing it
     was read from. */
  gsap.set(panels, {
    opacity: MOTION.enter.from,
    y: MOTION.alone.lift,
    height: (_i, panel: HTMLElement) => shortHeight(panel),
  });

  const tl = beat()
    /*
     * No position argument on the first tween, and it matters: it is the FIRST
     * thing on a fresh timeline, so a relative one has nothing to be relative
     * to. A "-=1" here resolved against a duration of 0 and placed the tween at
     * -1 — permanently a second into its own run — so the timeline's resting
     * state was the panels already 97% arrived and every play began there.
     *
     * Overlapping this beat onto the heading is not done here either: that is
     * WITH_HEADING on the beat in sections.ts, which is what the controller
     * queues each beat with.
     */
    .to(panels, { opacity: 1, y: 0, ...MOTION.alone.cards });
  move(tl, vs, { opacity: 0.7, ...MOTION.alone.vs }, "-=0.5");

  /* The rails that finish these panels are not here — see aloneRails. They are
     at the foot of the section and this beat fires at the head of it. */
  return tl;
}

/**
 * The strength rails at the bottom of the two comparison panels, and the six
 * figures on them counting up.
 *
 * Its own beat, and its own trigger — see Beat.own in sections.ts. The panels
 * arrive when the section does, which is when its heading is a quarter of the
 * way up the window; the rails are 500px below the fold at that moment, so run
 * with the panels they were a wipe and a count that happened where nobody could
 * see them, and every reader met a still picture of a rail that had already
 * opened. Measured at 1440x900: parked at the section's own trigger, the rail
 * sat at viewport y 1491 and was fully open five seconds later without ever
 * having been on screen.
 *
 * The panel is what grows, not the rail. A rail is never hidden — the panel is
 * simply too short to contain it yet, and clips it — so extending the panel is
 * what brings its rail out. See alonePanels, which parks them short, and the
 * note there on why this is a height and not a clip.
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
   * `<` is the start of the growth above rather than its end: the figures count
   * while the rails are coming out, not after they have arrived.
   *
   * Rooted at the section when both rails open together, so the six figures run
   * as ONE sweep left to right across the pair — which is what makes it read as
   * a comparison being totted up rather than each card totalling itself. In the
   * column the two rails are 590px apart and there is no sweep to be had, so
   * each is rooted at its own panel and counts its own three.
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
 *
 * The three pieces — the request card nudged in from the left, the vote list
 * from the right, the Squad card between them lifting — share one duration and
 * land on the same frame. Nothing takes a turn: the section is about a group
 * acting as one, so the diagram has to arrive as one object.
 *
 * Once it has, a light runs left to right along the connectors, drawing them as
 * it goes — out from the request, through the card, back along all three
 * branches to the votes.
 *
 * The ledger under all of it is not part of this. It is what the diagram
 * produces rather than part of what produces it, it sits at the foot of the
 * section where this beat's trigger cannot see it, and it now arrives on its
 * own — see approveLedger.
 */
export function approveDiagram(el: HTMLElement, only?: number) {
  /*
   * `only` is the phone's cut, in the order the column reads: the request, the
   * card it goes to, the votes that come back. Up here they are three parts of
   * one object arriving at once, which is the section's whole point; down there
   * they are 398px and 414px apart in a 302x1675 panel, so one trigger would
   * spend all three while two of them were below the fold. See
   * SectionSpec.column.
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

  /*
   * Left, right, up — and nothing measured. The request card and the vote list
   * take the same nudge in the direction they already sit in, so the diagram
   * gathers towards its own centre; the Squad card between them and the ledger
   * under them lift instead, because neither of those has a side.
   *
   * `shift` is a fixed number of stage units, which is the whole change here:
   * the two cards used to start past the viewport's edges, a distance that had
   * to be re-derived from the stage's live scale on every build because the
   * window is wider than the stage by a different amount at every size. They
   * never leave the stage now, so there is nothing to measure.
   */
  park(request, { opacity: from, x: -shift });
  park(votes, { opacity: from, x: shift });
  glowStart(halo);

  /* One position for all four, so they are one object arriving rather than
     four elements taking turns — and on the heading's clock, so the diagram and
     the words above it are one movement. */
  const tl = beat();
  const add = (targets: HTMLElement[], vars: gsap.TweenVars) => {
    if (targets.length) tl.to(targets, vars, 0);
  };
  add(request, { opacity: 1, x: 0, ...inStep() });
  add(votes, { opacity: 1, x: 0, ...inStep() });
  add(halo, { opacity: 1, x: 0, y: 0, ...MOTION.approve.glow });

  /*
   * The wiring, after the parts it joins.
   *
   * One fan across the stage up here, drawn once the diagram has gathered. In
   * the column it is two dashed drops, each crossing one of the gaps, so each
   * belongs to the part it arrives AT — the drop into the Squad card is drawn
   * as the card lands, the drop into the votes as they do. Named rather than
   * counted, because the two layouts do not draw the same number of lines: see
   * `runs`.
   */
  if (only === undefined) trace(tl, el, "-=0.25");
  else if (only === 1) traceRuns(tl, runs(el, "squad"), "-=0.25");
  else if (only === 2) traceRuns(tl, runs(el, "votes"), "-=0.25");

  return tl;
}

/**
 * The ledger bar under the approve diagram, and the five member chips on it
 * counting themselves in.
 *
 * Its own beat, and its own trigger — see Beat.own in sections.ts. It sits at
 * the bottom of a full-height section, and the section's own trigger fires when
 * its heading is a quarter of the way up the window: measured at 1440x900, the
 * ledger was 471px below the fold at that moment and had gone from its start
 * state to fully arrived, chips and all, five seconds later without ever having
 * been on screen.
 *
 * The bar and the chips are one movement rather than two. The bar lifts in, and
 * the chips are picked up while it is still settling so that what the reader
 * sees is a total assembling itself out of the parts, not a container that
 * arrives and is then filled.
 */
export function approveLedger(el: HTMLElement) {
  const ledger = q(el, "ledger");
  const chips = q(el, "chip");
  const { from, lift } = MOTION.enter;

  gsap.set(ledger, { opacity: from, y: lift });
  gsap.set(chips, { opacity: from, y: lift / 4 });

  const tl = beat().to(ledger, { opacity: 1, y: 0, ...inStep() });
  /* Well before the bar has settled: it is one gesture, and chips that waited
     for it would read as a second arrival inside the first. */
  tl.to(chips, { opacity: 1, y: 0, ...MOTION.approve.chips }, "-=0.9");

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * How Squad Works: three step cards lift and fade in, then the wiring inside
 * the last two draws itself.
 *
 * Staggered rather than simultaneous, unlike the approve diagram — these are
 * three sequential steps, and having them land one after the other is the only
 * thing in the section that says so.
 *
 * The rings in steps 1 and 2 are handled separately and never stop; see
 * worksAmbient.
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
  /*
   * Then the wiring inside the last two, as the cards settle. Scoped to the
   * card when the phone plays these one at a time — the runs live INSIDE the
   * step cards here, unlike every other diagram on the page, so a card's own
   * box is the right root and the stagger between the three disappears with
   * the beat that had them all.
   */
  trace(tl, only === undefined ? el : (steps[0] ?? el), "-=0.2");
  return tl;
}

/**
 * The rings in steps 1 and 2, breathing.
 *
 * Not a beat: those two steps are about a group being continuously assessed,
 * and a diagram that settles into a still image says the opposite. This is the
 * only motion on the page that never finishes.
 *
 * Returned paused. The controller plays it only while the section is on screen
 * — a loop nobody can see is just a ticker callback burning frames.
 */
export function worksAmbient(el: HTMLElement) {
  const rings = gsap.utils.toArray<HTMLElement>(
    el.querySelectorAll("[data-glow]"),
  );
  const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true });

  /*
   * Opacity only. These sit behind live text ("4 / 4", "Group Score 718"), and
   * a scale on their shared ancestor would re-rasterize every glyph inside it
   * on every frame, forever — the exact thing that made the headings shimmer.
   */
  tl.to(rings, {
    opacity: MOTION.works.glow.dim,
    duration: MOTION.works.glow.duration,
    ease: MOTION.works.glow.ease,
    stagger: { each: MOTION.works.glow.stagger, from: "center" },
  });

  return tl;
}

/**
 * Step 1's four squad members, going round the hub they are joined to.
 *
 * The step is "form your squad", and the four are drawn on a circle around the
 * Banrox mark with "4 / 4" under it. A ring of people that never moves is a
 * diagram of a squad; a ring that turns is a squad. Same argument as the
 * breathing rings above, which is why this is ambient rather than a beat — it
 * has no state to arrive at and no finish to hold.
 *
 * ONE rotation, on a wrapper that shares its centre with the circle they are
 * drawn on. Nothing here computes an angle or a radius: the avatars keep the
 * artboard coordinates Figma gives them, [data-orbit] is the panel box, and
 * turning that box about its own centre IS the orbit — see the note in
 * HowSquadWorks. It is also why there is nothing to undo: the markup with no
 * rotation on it is the artboard.
 *
 * The riders turn back by the same amount, which is not optional. A photograph
 * of a face rotating is the one thing an eye reads instantly, and the verified
 * check would swing round to the top left of each one. The two rotations
 * compose to a pure translation — the parent about the panel centre, the child
 * about its own — so an avatar travels the circle sitting perfectly upright.
 *
 * That composition is also why the riders are promoted and the wrapper is not.
 * A rider painted into the wrapper's raster is painted rotated, and has to be
 * re-rastered every frame it turns; given a layer of its own it is rasterized
 * once and handed a matrix which, after the two rotations cancel, has no
 * rotation left in it. The wrapper paints nothing of its own to promote.
 *
 * Returned paused, like the rings: the controller runs it only while the
 * section is on screen.
 */
export function worksOrbit(el: HTMLElement) {
  const tl = gsap.timeline({ paused: true, repeat: -1 });

  const ring = el.querySelector<HTMLElement>("[data-orbit]");
  if (!ring) return tl;

  const riders = gsap.utils.toArray<HTMLElement>(
    ring.querySelectorAll("[data-orbit-rider]"),
  );
  gsap.set(riders, { willChange: "transform", force3D: true });

  /* Both at position 0 on one duration: this is one motion described twice, and
     any frame where the two disagree is a frame with four tilted faces in it.
     A full turn each way, so the repeat seam lands on 360 -> 0 — the same angle
     for both, and nothing to see. */
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
 * screen together. Each row is its own beat, fired by its own arrival, and the
 * wiring between two rows belongs to the lower of the two: a line should draw
 * itself into something already there.
 */

/** Row one: the four member score cards, and the glow behind the whole funnel. */
export function intelMembers(el: HTMLElement) {
  const members = q(el, "member");
  const aura = q(el, "aura");

  gsap.set(members, { opacity: MOTION.enter.from, y: MOTION.intel.rise });
  glowStart(aura);

  /* The row and the glow behind it on one clock, at one position. The cards
     ran 1s against the heading's 1.5 and the aura 1.2 against both, so the
     three things that make up the top of the funnel each finished at a
     different moment. */
  const tl = beat().to(
    members,
    { opacity: 1, y: 0, ...inStep(), stagger: MOTION.intel.memberStagger },
    0,
  );
  move(tl, aura, { opacity: 1, x: 0, y: 0, ...inStep() }, 0);

  /*
   * Absolute positions, and the same one for both: the score and the meter under
   * it are one reading, so they run together and land together. Chaining either
   * off "<" would queue it behind the aura instead — the last thing added above,
   * and nothing to do with the cards.
   *
   * The shared stagger is what keeps each readout inside its own card: the cards
   * arrive 0.1s apart and so do these, so card four's number is still counting
   * while card four is still arriving.
   */
  const { figures } = MOTION.intel;
  countUp(tl, el, figures.after, figures);
  meters(tl, el, figures.after, figures.meter, figures.stagger);
  return tl;
}

/** Row two: the signal cards, with the fan from row one drawing down into them. */
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

  /*
   * The four cards with the container, not after it.
   *
   * Appended here but positioned at 0 rather than chained: every position below
   * is relative, so inserting this into the chain would push the fan dot and the
   * connector along with it. They used to start at 0.45 on a 0.6s tween of their
   * own — the container was still rising when they set off and had stopped
   * before they landed, which is the box arriving and then being filled. They
   * travel a quarter of what it does over the same time instead, so the row
   * fills as it rises.
   */
  tl.to(
    categories,
    { opacity: 1, y: 0, ...inStep(), stagger: MOTION.intel.cardStagger },
    0,
  );

  /* The dot and the run that lands on it belong to the connector rather than to
     the row, so they stay chained off the row's own end. */
  move(
    tl,
    nodes,
    { opacity: 1, ...MOTION.trace.node },
    MOTION.copy.duration - 0.3,
  );
  traceRuns(tl, fan, "-=0.2");
  return tl;
}

/** Row three: the engine, with the run from the signals drawing down into it. */
export function intelHub(el: HTMLElement) {
  const hub = q(el, "hub");
  gsap.set(hub, { opacity: MOTION.enter.from, y: MOTION.intel.rise });

  const tl = beat().to(hub, { opacity: 1, y: 0, ...inStep() }, 0);
  traceRuns(tl, runs(el, "hub"), "-=0.5");
  return tl;
}

/**
 * Row four: the verdict the engine hands down, and the last run into it.
 *
 * Its own beat rather than part of the hub's, because it sits 370px below the
 * hub — far enough that when the hub arrives this is still off the bottom of
 * the screen, and a verdict nobody sees arrive is just a label.
 */
/**
 * The hub's bloom, breathing for as long as the section is on screen.
 *
 * Ambient rather than a beat: it has no arrival to be part of and no end to
 * reach, and the controller pauses it whenever the section is off screen so it
 * is not a ticker callback burning frames for the life of the page.
 *
 * It deliberately does not wait for the hub to arrive. It cannot — the hub's
 * own beat fades that card up from nothing, and a second tween on these
 * children's opacity would be two animations arguing over one property. So the
 * breath runs underneath, on elements the card's own opacity is still hiding,
 * and is already going by the time there is anything to see.
 */
export function intelAmbient(el: HTMLElement) {
  const glow = gsap.utils.toArray<HTMLElement>(
    el.querySelectorAll("[data-glow]"),
  );
  const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true });

  tl.to(glow, {
    opacity: MOTION.intel.glow.dim,
    duration: MOTION.intel.glow.duration,
    ease: MOTION.intel.glow.ease,
    /* From the narrowest layer, which is last in the DOM — the pulse leaves the
       core and travels out, rather than the three plates dimming as one. */
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
 *
 * Its contents travel a fraction of what the card does and set off at the same
 * instant, so the whole thing reads as one panel arriving rather than a box
 * that lands and is then filled.
 */
/* -------------------------------------------------------------------------- */

/*
 * Life Inside Squad: a lane, a cover, and the squad's own health.
 *
 * Split into two beats rather than one, and not because the section is long —
 * it is one screen like every other. It is that the health card sits at the
 * foot of the diagram, and the section's own trigger fires with its top edge a
 * quarter of the way up the window, which puts that card most of a windowful
 * below the fold. Measured at 1440x900: 337px past it. So the two cards the
 * reader can actually see arrive with the heading, and the ledger under them
 * waits for its own moment — the same bargain aloneRails and approveLedger
 * strike, for the same reason. See Beat.own.
 */

/** The top row: the lane being spent down, and the member covering it. */
export function lifeLanes(el: HTMLElement, only?: number) {
  /*
   * `only` is the phone's cut: the lane, then the one covering it. Side by side
   * they are a pair and arrive as a pair; stacked they are 227px apart, which
   * is far enough that the second is below the fold when the first sets off and
   * near enough that the two triggers are barely a flick apart — so the pair
   * survives as a pair, with a beat between them. See SectionSpec.column.
   */
  const both = [...q(el, "lane"), ...q(el, "cover")];
  const cards = only === undefined ? both : both.slice(only, only + 1);
  /* Rooted at the cards rather than the section, so a cut beat takes the items
     that belong to it and no others. Identical to the section-wide set when
     nothing is cut: every [data-reveal='item'] here is inside one of these two. */
  const items = cards.flatMap((card) => q(card, "item"));
  /* The light belongs to the row rather than to either card, so it comes in
     with the first thing that arrives. */
  const aura = only === 1 ? [] : q(el, "aura");

  gsap.set(cards, { opacity: MOTION.enter.from, y: MOTION.enter.lift });
  gsap.set(items, { opacity: MOTION.enter.from, y: MOTION.life.itemRise });
  glowStart(aura);

  /*
   * All three at position 0, all three on the heading's clock — see `inStep`.
   * The items sit inside the cards, so their travel is the card's plus their
   * own; one duration and one ease is what keeps that sum proportional the
   * whole way rather than the cards arriving and their contents then catching
   * up inside them.
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
   *
   * Scoped to the lane card rather than to the section, which is the one thing
   * here that is not like the other counting beats. Every other section counts
   * everything it has in one go; this one has a second card of figures at its
   * foot on a trigger of its own, and a section-wide sweep would spend them
   * from up here — where nobody can see them — a screen before that trigger
   * fires.
   */
  const { figures } = MOTION.life;
  const lane = cards.find((card) => card.dataset.reveal === "lane");
  if (lane) {
    countUp(tl, lane, figures.after, figures);
    meters(tl, lane, figures.after, figures.meter, figures.stagger);
  }

  /* And the hairline between the two faces, drawn last — a payment travelling
     from one of them to the other is the one thing on this row that is an
     event rather than a state. It lives inside the cover card, so a cut beat
     rooted there finds it and the lane's beat correctly finds nothing. */
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

  /* Seven figures on one card — three about the squad and four about the people
     in it — counted in document order, inside the card that is still arriving.
     Scoped to it for the reason lifeLanes is scoped to the lane. */
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

  /*
   * Both at position 0, both on the heading's clock.
   *
   * The items sit inside the card, so their travel is the card's plus their own
   * — sharing one duration and one ease is what keeps that sum proportional the
   * whole way down instead of the card arriving and its contents then sliding
   * the last 22px into a box that has already stopped.
   *
   * Their stagger is kept: four things filling one card is the one place this
   * section has an order worth showing.
   */
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
 * heading, because that is the order it is laid out in. So the card gets the
 * first beat and the copy the second — the reverse of everywhere else, and the
 * reason this section does not use copyIn.
 *
 * It closes the loop the hero opened. The page began with this same card lying
 * flat and on its side, turning counter-clockwise as it stood up; here it comes
 * back up from below with the same quarter turn, and the CTA hinges upright off
 * its bottom edge exactly as the hero's buttons did.
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

  /*
   * All three on the card's clock, and all three at position 0.
   *
   * The card is the thing this section is watched for — it turns as it rises,
   * and it is the only element here that does. Everything beside it has to be
   * travelling while it travels and stop when it stops, or the section reads as
   * the card arriving and the form catching up afterwards. Same duration, same
   * ease, same start: they cover different distances at different speeds and
   * land on one frame.
   *
   * The `to` position argument is 0 on each rather than relative. Relative
   * positions here had been resolving against a timeline whose duration was
   * still 0 or already negative — "-=12" then "-=15" then "-=12" put the whole
   * form at roughly -36 seconds, which is to say finished before the beat had
   * begun. Nothing animated; the copy, the fields and the button were simply
   * there while the card rose alone.
   */
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
