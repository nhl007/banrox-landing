import gsap from "gsap";
import { MOTION } from "./motion";

/*
 * One factory per beat. Each returns a single PAUSED timeline that the
 * controller plays once, when the thing it belongs to comes into view.
 *
 * Sections are split into beats rather than given one timeline each because a
 * section is taller than the window: a heading and the diagram under it are
 * never on screen at the same moment, so they cannot honestly share a trigger.
 * Each beat animates only what is in front of the reader when it fires, and
 * sections.ts is where a beat is married to the element that fires it.
 *
 * Nothing here ever runs backwards. A beat plays forward, once, and that is the
 * whole life of it — so a factory is free to do things that could not be undone,
 * and free to measure the DOM at the moment it is built.
 */

const q = (root: HTMLElement, role: string) =>
  gsap.utils.toArray<HTMLElement>(root.querySelectorAll(`[data-reveal='${role}']`));

/** A paused timeline with the shared ease, which every beat below starts from. */
const beat = () => gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

/**
 * The heading block: badge, headline, sub-paragraph, each scaling up out of
 * nothing as it rises.
 *
 * Six of the seven sections open exactly this way, and deliberately so — the
 * payload underneath is where each one gets to be itself, and seven different
 * heading treatments would flatten that rather than add to it.
 */
export function copyIn(el: HTMLElement) {
  const copy = q(el, "copy");
  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });

  return beat().to(copy, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: MOTION.copy.duration,
    ease: MOTION.copy.ease,
    stagger: MOTION.copy.stagger,
  });
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
    down ? run.offsetHeight + spark.offsetHeight : run.offsetWidth + spark.offsetWidth;

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
const trace = (tl: gsap.core.Timeline, root: HTMLElement, at: number | string) =>
  traceRuns(tl, q(root, "lines"), at);

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
  const tl = gsap.timeline({ paused: true, repeat: -1 }).timeScale(MOTION.pace);

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

  return tl;
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
  const pill = el.querySelector("[data-reveal='nav-pill']") as HTMLElement;

  gsap.set(el, { opacity: 1 });
  /*
   * -el.offsetHeight, not yPercent: -100. The pill is 56px tall but sits 16px
   * down inside the 72px header, so its own height leaves a strip of it still
   * on screen; the header's height is the distance that actually clears the
   * top edge.
   */
  gsap.set(pill, {
    y: -el.offsetHeight,
    rotationX: MOTION.navbar.fold,
    transformOrigin: "50% 0%",
    transformPerspective: 800,
    opacity: 0,
  });

  return beat().to(pill, {
    y: 0,
    rotationX: 0,
    opacity: 1,
    ...MOTION.navbar.drop,
  });
}

/* -------------------------------------------------------------------------- */

/**
 * Hero, movement one: the copy scales up out of nothing, then the CTAs — lying
 * flat on the screen plane — hinge upright off their bottom edge.
 *
 * Held back a beat behind the navbar. Both are on screen the moment the page
 * loads, so without that they would fire together; see MOTION.hero.afterNav.
 */
export function heroCopy(el: HTMLElement) {
  const copy = q(el, "copy");
  const buttons = q(el, "button");
  const note = q(el, "note");

  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(note, { opacity: 0, y: 12 });
  gsap.set(buttons, {
    opacity: 0,
    rotationX: MOTION.flat.angle,
    transformOrigin: "50% 100%",
    transformPerspective: 600,
  });

  return beat()
    .to(copy, { opacity: 1, scale: 1, y: 0, duration: MOTION.copy.duration, ease: MOTION.copy.ease, stagger: MOTION.copy.stagger })
    .to(buttons, { opacity: 1, rotationX: 0, ...MOTION.hero.buttons }, "-=0.35")
    .to(note, { opacity: 1, y: 0, ...MOTION.hero.note }, "-=0.4");
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
  const anchor = el.querySelector("[data-fan-anchor]") as HTMLElement;

  /*
   * Every passport card is pulled onto the Squad card's exact centre, so the
   * deck is a single stack with nothing peeking out — they only exist once they
   * come out from behind it. Measured off the DOM in unscaled stage units,
   * which is the space GSAP's x lives in.
   */
  const stacked = (card: HTMLElement) =>
    anchor.offsetLeft + anchor.offsetWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);

  gsap.set(glow, { opacity: 0 });
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
  gsap.set(cards, { opacity: 0, x: (_i, card: HTMLElement) => stacked(card) });
  /*
   * The Squad card starts on its side. The component already turns its face
   * -90deg to stand upright, so +90 here cancels that back to landscape; the
   * tween to 0 is the counter-clockwise quarter turn into its real position.
   */
  gsap.set(anchor, { rotationZ: MOTION.hero.turn });

  return beat()
    .to(glow, { opacity: 1, ...MOTION.hero.glow }, 0)
    .to(fan, { opacity: 1, duration: 0.3, ease: "none" }, 0.2)
    /* Lifts off the display plane and turns upright in one movement. */
    .to(fan, { rotationX: 0, z: 0, ...MOTION.hero.lift }, "<")
    .to(anchor, { rotationZ: 0, ...MOTION.hero.lift }, "<")
    /* Only now does anything come out from behind the Squad card — overlapped
       with the last of the lift, so they start emerging as it finishes standing
       rather than after a pause with nothing happening. */
    .to(cards, { opacity: 1, x: 0, ...MOTION.hero.fan }, "-=0.35");
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
  const cells = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-count]"));

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
  const bars = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-meter]"));

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
 * Alone vs Together: the two panels slide in from the left and right viewport
 * edges, the VS mark fades up between them, and the strength rails arrive last,
 * counting their figures up as they open.
 *
 * Travel is measured rather than hard-coded. The panels are flush with their
 * 1240px stage's edges, so how far off-screen they must start depends on how
 * much wider the window is than the (scaled) stage.
 */
export function alonePanels(el: HTMLElement) {
  const left = q(el, "card-left");
  const right = q(el, "card-right");
  const vs = q(el, "vs");
  const bars = q(el, "bar");
  const stage = el.querySelector(".stage") as HTMLElement;
  const viewport = el.querySelector(".stage-viewport") as HTMLElement;

  /*
   * GSAP's x is applied inside .stage, before its scale, so the travel has to
   * be expressed in unscaled stage units too — hence dividing the viewport
   * width by the stage's current scale. The +8 clears the 2px outward ring and
   * its shadow so nothing peeks at the edge.
   */
  const travel = () => {
    const scale = stage.getBoundingClientRect().width / stage.offsetWidth || 1;
    const overhang = Math.max(0, (viewport.clientWidth / scale - stage.offsetWidth) / 2);
    return stage.offsetWidth / 2 + overhang + 8;
  };

  gsap.set(vs, { opacity: 0, scale: 0.6 });
  gsap.set(left, { opacity: 1, x: () => -travel() });
  gsap.set(right, { opacity: 1, x: () => travel() });

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
  const panels = [...left, ...right];
  const fullHeight = new WeakMap<HTMLElement, number>();
  for (const panel of panels) fullHeight.set(panel, panel.offsetHeight);
  /* Captured before anything overwrites it, so re-measuring cannot read back a
     height this timeline itself set. */
  const grown = (panel: HTMLElement) => fullHeight.get(panel) ?? panel.offsetHeight;
  const shortHeight = (panel: HTMLElement) =>
    panel.querySelector<HTMLElement>("[data-reveal='bar']")?.offsetTop ?? grown(panel);

  gsap.set(bars, { opacity: 1 });
  gsap.set(panels, { height: (_i, panel: HTMLElement) => shortHeight(panel) });

  const tl = beat()
    .to(panels, { x: 0, ...MOTION.alone.cards })
    .to(vs, { opacity: 0.7, scale: 1, ...MOTION.alone.vs }, "-=0.5")
    /* Last, and only once both panels have landed. */
    .to(panels, { height: (_i, panel: HTMLElement) => grown(panel), ...MOTION.alone.bar }, "-=0.15");

  /* `<` is the start of the growth above rather than its end: the figures count
     while the rails are coming out, not after they have arrived. */
  countUp(tl, el, `<+=${MOTION.alone.figures.after}`, MOTION.alone.figures);

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Squad Approves: the diagram assembles from its own edges, and only then do
 * the connectors between the pieces light up.
 *
 * The four pieces — the request card in from the left, the vote list in from
 * the right, the ledger bar up from under the stage floor, and the Squad card
 * scaling open in the middle with nowhere to come from — share one duration and
 * land on the same frame. Nothing takes a turn: the section is about a group
 * acting as one, so the diagram has to arrive as one object.
 *
 * Once it has, a light runs left to right along the connectors, drawing them as
 * it goes — out from the request, through the card, back along all three
 * branches to the votes. The ledger's member chips then count in one at a time,
 * carrying that same left-to-right motion down into the total.
 */
export function approveDiagram(el: HTMLElement) {
  const request = q(el, "request");
  const votes = q(el, "votes");
  const squad = q(el, "squad");
  const halo = q(el, "squad-glow");
  const ledger = q(el, "ledger");
  const chips = q(el, "chip");
  const stage = el.querySelector(".stage") as HTMLElement;
  const viewport = el.querySelector(".stage-viewport") as HTMLElement;

  /*
   * Same unit problem as the comparison panels: GSAP's x lands inside .stage,
   * underneath the scale CSS puts on it, so every distance here has to be
   * expressed in unscaled stage units — hence dividing the measured viewport by
   * the stage's current scale.
   *
   * A piece leaves past the *viewport* edge rather than the stage's. The stage
   * is narrower than the window on a desktop, so stopping at its edge would
   * have both cards appear out of thin air a couple of hundred pixels in.
   */
  const overhang = () => {
    const scale = stage.getBoundingClientRect().width / stage.offsetWidth || 1;
    return Math.max(0, (viewport.clientWidth / scale - stage.offsetWidth) / 2);
  };
  const offLeft = (node: HTMLElement) => -(overhang() + node.offsetLeft + node.offsetWidth);
  const offRight = (node: HTMLElement) => overhang() + stage.offsetWidth - node.offsetLeft;
  /*
   * Far enough down that the bar clears the stage floor, which .stage-viewport
   * clips — plus its own height again, because it carries an ambient glow well
   * above its top edge and a glow hanging in the middle of an empty stage is
   * the one part of it you would notice waiting.
   */
  const below = (node: HTMLElement) =>
    stage.offsetHeight - node.offsetTop + node.offsetHeight;

  gsap.set(request, { opacity: 1, x: (_i, node: HTMLElement) => offLeft(node) });
  gsap.set(votes, { opacity: 1, x: (_i, node: HTMLElement) => offRight(node) });
  gsap.set(ledger, { opacity: 1, y: (_i, node: HTMLElement) => below(node) });
  gsap.set(squad, { opacity: 1, scale: 0, y: MOTION.approve.pop.hop });
  gsap.set(halo, { opacity: 0 });
  gsap.set(chips, { opacity: 0, scale: 0.7, y: 14, transformOrigin: "50% 100%" });

  const tl = beat();
  const land = { duration: MOTION.approve.land, ease: MOTION.approve.slide };
  tl.to(request, { x: 0, ...land }, 0)
    .to(votes, { x: 0, ...land }, "<")
    .to(ledger, { y: 0, ...land }, "<")
    .to(squad, { scale: 1, y: 0, duration: MOTION.approve.land, ease: MOTION.approve.pop.ease }, "<")
    .to(halo, { opacity: 1, ...MOTION.approve.glow }, "<");

  trace(tl, el, "-=0.25");

  /* Picked up as the light reaches the far end, so the two read as one move. */
  tl.to(chips, { opacity: 1, scale: 1, y: 0, ...MOTION.approve.chips }, "<+=0.8");

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * How Squad Works: three step cards grow up out of nothing, then the wiring
 * inside the last two draws itself.
 *
 * Staggered rather than simultaneous, unlike the approve diagram — these are
 * three sequential steps, and having them land one after the other is the only
 * thing in the section that says so.
 *
 * The rings in steps 1 and 2 are handled separately and never stop; see
 * worksAmbient.
 */
export function worksCards(el: HTMLElement) {
  const steps = q(el, "step");
  gsap.set(steps, { opacity: 1, scale: 0, y: MOTION.works.hop });

  const tl = beat().to(steps, { scale: 1, y: 0, ...MOTION.works.cards }, 0);
  /* Then the wiring inside the last two, as the cards settle. */
  trace(tl, el, "-=0.2");
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
  const rings = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-glow]"));
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

  gsap.set(members, { opacity: 0, y: MOTION.intel.rise });
  gsap.set(aura, { opacity: 0 });

  const tl = beat()
    .to(members, { opacity: 1, y: 0, ...MOTION.intel.members }, 0)
    .to(aura, { opacity: 1, duration: 1.2, ease: "power1.out" }, 0);

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
  const fan = q(el, "lines").slice(0, 1);

  gsap.set(signals, { opacity: 0, y: MOTION.intel.rise });
  gsap.set(categories, { opacity: 0, ...MOTION.intel.cardFrom });
  gsap.set(nodes, { opacity: 0 });

  const tl = beat()
    .to(signals, { opacity: 1, y: 0, ...MOTION.intel.signals }, 0)
    .to(nodes, { opacity: 1, ...MOTION.trace.node }, "-=0.3");
  traceRuns(tl, fan, "-=0.2");

  /*
   * Appended last but positioned early, at an absolute time rather than off
   * the end of whatever precedes it. Every position above is relative, so
   * inserting this into the chain would push the fan dot and the connector
   * along with it — the cards would animate and the diagram's timing would
   * quietly change with them.
   */
  tl.to(
    categories,
    { opacity: 1, y: 0, scale: 1, ...MOTION.intel.cards },
    MOTION.intel.fill,
  );
  return tl;
}

/** Row three: the engine, with the run from the signals drawing down into it. */
export function intelHub(el: HTMLElement) {
  const hub = q(el, "hub");
  gsap.set(hub, { opacity: 0, y: MOTION.intel.rise });

  const tl = beat().to(hub, { opacity: 1, y: 0, ...MOTION.intel.hub }, 0);
  traceRuns(tl, q(el, "lines").slice(1, 2), "-=0.5");
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
  const glow = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-glow]"));
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
  gsap.set(verdict, { opacity: 0, y: MOTION.intel.rise });

  const tl = beat().to(verdict, { opacity: 1, y: 0, ...MOTION.intel.hub }, 0);
  traceRuns(tl, q(el, "lines").slice(2), 0);
  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Squad Invitation: the invite card rises and grows into place, then fills
 * itself in.
 *
 * Rise and grow together rather than one then the other — a card that slides up
 * at full size reads as a panel being pushed on screen, and the growth is what
 * makes it read as arriving. Its contents wait until it has landed, so nothing
 * is animating inside a box that is itself still moving.
 */
export function inviteCard(el: HTMLElement) {
  const card = q(el, "card");
  const items = q(el, "item");

  gsap.set(card, { opacity: 0, ...MOTION.invite.cardFrom });
  gsap.set(items, { opacity: 0, ...MOTION.invite.itemFrom });

  return beat()
    .to(card, { opacity: 1, y: 0, scale: 1, ...MOTION.invite.card }, 0)
    .to(items, { opacity: 1, y: 0, scale: 1, ...MOTION.invite.items }, "-=0.35");
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
  const card = q(el, "card");
  gsap.set(card, { opacity: 1, y: MOTION.early.rise, rotationZ: MOTION.early.turn });
  return beat().to(card, { y: 0, rotationZ: 0, ...MOTION.early.card });
}

export function earlyForm(el: HTMLElement) {
  const copy = q(el, "copy");
  const fields = q(el, "field");
  const cta = q(el, "cta");

  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(fields, { opacity: 0, y: MOTION.early.fieldRise });
  gsap.set(cta, {
    opacity: 0,
    rotationX: MOTION.flat.angle,
    transformOrigin: "50% 100%",
    transformPerspective: 600,
  });

  return beat()
    .to(copy, { opacity: 1, scale: 1, y: 0, duration: MOTION.copy.duration, ease: MOTION.copy.ease, stagger: MOTION.copy.stagger })
    .to(fields, { opacity: 1, y: 0, ...MOTION.early.fields }, "-=0.3")
    .to(cta, { opacity: 1, rotationX: 0, ...MOTION.early.cta }, "-=0.35");
}
