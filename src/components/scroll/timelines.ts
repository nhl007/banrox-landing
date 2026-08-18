import gsap from "gsap";
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

const q = (root: HTMLElement, role: string) =>
  gsap.utils.toArray<HTMLElement>(
    root.querySelectorAll(`[data-reveal='${role}']`),
  );

/** A paused timeline with the shared ease, which every beat below starts from. */
const beat = () =>
  gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

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
const glowIn = (tl: gsap.core.Timeline, el: HTMLElement) => {
  const glow = q(el, "glow");
  if (!glow.length) return tl;

  glowStart(glow);
  return tl.to(
    glow,
    { opacity: 1, x: 0, y: 0, duration: tl.duration(), ease: MOTION.copy.ease },
    0,
  );
};

/**
 * The Squad card travelling from the hero's fan to the approve diagram's slot,
 * driven by the scroll.
 *
 * Returns the machinery for the controller to hang a scrubbed ScrollTrigger on,
 * or null if any of the three elements is missing — a page without an approve
 * section is not an error, it just has nowhere for the card to go.
 *
 * ---------------------------------------------------------------------------
 * PAGE COORDINATES, MEASURED LAZILY
 *
 * Both ends of the journey are fixed points on the page and the card is
 * somewhere on the line between them, which is the whole of the geometry. The
 * two ends are measured rather than derived because neither can be worked out
 * from the markup: both cards sit inside a .stage, a scaled artboard whose
 * scale comes from a container query, and the two stages are different sizes at
 * every window width. getBoundingClientRect knows; nothing else does.
 *
 * Re-measured on every ScrollTrigger refresh, which is what keeps it correct
 * across a resize. And the FIRST measurement has to wait for the hero to finish
 * arriving: the hero's card starts its life lying flat and turned on its side,
 * so a rect taken while that is still playing is the bounding box of a card
 * mid-quarter-turn, and the traveller would spend the whole journey a hundred
 * pixels from where it should have set off.
 *
 * ---------------------------------------------------------------------------
 * WHAT MOVES WHAT
 *
 * The traveller owns its own transform and opacity outright. The hero's card
 * only ever has its opacity written, which is why this can share it with
 * heroCards — that one turns the card upright and never touches opacity.
 *
 * The approve diagram's card is not written at all, by anything: it is left at
 * the stylesheet's opacity 0 and the traveller lands on top of it. It is still
 * in the layout, still holding the space, still what the connectors point at.
 */
export function squadTrail(root: Document | HTMLElement) {
  const card = root.querySelector<HTMLElement>("[data-squad-trail]");
  const heroCard = root.querySelector<HTMLElement>(
    "[data-sequence-section='hero'] [data-fan-anchor]",
  );
  const slot = root.querySelector<HTMLElement>(
    "[data-sequence-section='approve'] [data-reveal='squad']",
  );
  if (!card || !heroCard || !slot) return null;

  const { dim, out, in: back, sag } = MOTION.trail;

  /** An element's box in page coordinates, which is what the card is driven in. */
  const box = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width };
  };

  let from = box(heroCard);
  let to = box(slot);
  let natural = card.offsetWidth;
  /*
   * Nothing is placed or painted until the hero has finished arriving.
   *
   * The first ScrollTrigger refresh happens on load, while the hero's Squad
   * card is still mid-quarter-turn, and placing the traveller against that rect
   * put a second, full-opacity Squad card on the hero for two and a half
   * seconds — until the delayed re-measure snapped it into place. Reported, and
   * reproduced. The card stays at opacity 0 until there is a real measurement
   * to place it against.
   */
  let ready = false;

  const measure = () => {
    /* Unscaled, or the width read back is the width it was last set to. */
    gsap.set(card, { x: 0, y: 0, scale: 1 });
    natural = card.offsetWidth || 1;
    from = box(heroCard);
    to = box(slot);
  };

  /**
   * The card's opacity along the journey: down to `dim` over the first stretch,
   * held there for the middle, back to full over the last.
   *
   * Written as a function of progress rather than as keyframes on a timeline
   * because the position is one too — one place that says where the card is and
   * what it looks like at any point, rather than two that have to agree.
   */
  const fade = (p: number) => {
    if (p <= out) return 1 - (1 - dim) * (p / out);
    if (p >= 1 - back) return dim + (1 - dim) * ((p - (1 - back)) / back);
    return dim;
  };

  const apply = (p: number) => {
    if (!ready) return;
    const w = from.w + (to.w - from.w) * p;
    /*
     * A sag, so the trip reads as one.
     *
     * The straight line between the two slots is shorter than the scroll that
     * gets you between them — 1714px of page against 2100px of wheel at 1440x900
     * — so a card moving evenly along it drifts UP the window for the whole
     * journey, which is exactly backwards. Bending the path below the line
     * pushes the first half of it downwards faster than the page moves, so the
     * card sinks away from the hero before it is drawn back up into the slot.
     * Zero at both ends by construction, so neither of them moves.
     */
    gsap.set(card, {
      x: from.x + (to.x - from.x) * p,
      y: from.y + (to.y - from.y) * p + sag * Math.sin(Math.PI * p),
      scale: w / natural,
      opacity: fade(p),
    });
    /* The hero's own card goes out under the traveller as it takes over. Both
       are the same card at the same size in the same place for the whole of the
       hand-over, so what the reader sees is one card dimming. */
    gsap.set(heroCard, { opacity: 1 - Math.min(1, p / out) });
  };

  /** Called once the hero has settled — see MOTION.trail.settle. */
  const arm = () => {
    ready = true;
    measure();
  };

  return { measure, apply, arm };
}

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
  const anchor = el.querySelector("[data-fan-anchor]") as HTMLElement;

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
      .to(cards, { opacity: 1, x: 0, ...MOTION.hero.fan }, "-=0.35")
  );
}

/**
 * The hero's fan closing again, scrubbed by the scroll.
 *
 * The last thing heroCards does is bring the four passport cards out from
 * behind the Squad card; this is that, run backwards, and it is what the reader
 * does rather than what they watch. Scroll away from the hero and the four fold
 * back in behind the Squad card and are gone, leaving one card on the screen —
 * which is the card that then travels down the page (see squadTrail).
 *
 * It replaced a straight fade. The Squad card used to simply dim out with the
 * fan still spread around it, which said nothing: four cards fading in place is
 * four things being switched off, and the one that carries on down the page had
 * no reason to be the one that was left. Folding them into it makes the Squad
 * card the thing they came out of, so what leaves the hero is what the hero was
 * about.
 *
 * Backwards through the fan, too — `from: "end"` — so they close in the reverse
 * of the order they opened.
 *
 * Only the four. The Squad card between them keeps its place and its size: it
 * is about to be handed to the traveller, which is upright and unrotated, and
 * turning it back onto its side (the other half of heroCards) would mean
 * handing over mid-quarter-turn.
 *
 * Returns null if the hero is not on the page.
 */
export function heroFold(el: HTMLElement) {
  const cards = q(el, "card");
  const anchor = el.querySelector<HTMLElement>("[data-fan-anchor]");
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
  gsap.set(cards, { willChange: "transform", force3D: true });

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

  const layers = gsap.utils.toArray<HTMLElement>(
    el.querySelectorAll("[data-glow-from]"),
  );

  /* Promoted once and left promoted, like the passport cards: these animate for
     as long as their section is on screen, so a compositor layer each is the
     difference between stretching a raster and repainting a window's worth of
     soft light on every frame. */
  gsap.set(layers, { willChange: "transform", force3D: true });

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
export function alonePanels(el: HTMLElement) {
  const left = q(el, "card-left");
  const right = q(el, "card-right");
  const vs = q(el, "vs");
  const bars = q(el, "bar");

  /* No scale. It was the last grow in this section and, at 48px of display
     italic, the one where it showed most. */
  gsap.set(vs, { opacity: 0 });

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
  const grown = (panel: HTMLElement) =>
    fullHeight.get(panel) ?? panel.offsetHeight;
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
    .to(panels, { opacity: 1, y: 0, ...MOTION.alone.cards })
    .to(vs, { opacity: 0.7, ...MOTION.alone.vs }, "-=0.5")
    /* Last, and only once both panels have landed. */
    .to(
      panels,
      { height: (_i, panel: HTMLElement) => grown(panel), ...MOTION.alone.bar },
      "-=0.15",
    );

  /* `<` is the start of the growth above rather than its end: the figures count
     while the rails are coming out, not after they have arrived. */
  countUp(tl, el, `<+=${MOTION.alone.figures.after}`, MOTION.alone.figures);

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Squad Approves: the diagram gathers into place, and only then do the
 * connectors between the pieces light up.
 *
 * The four pieces — the request card nudged in from the left, the vote list
 * from the right, the ledger and the Squad card lifting — share one duration
 * and land on the same frame. Nothing takes a turn: the section is about a
 * group acting as one, so the diagram has to arrive as one object.
 *
 * Once it has, a light runs left to right along the connectors, drawing them as
 * it goes — out from the request, through the card, back along all three
 * branches to the votes. The ledger's member chips then count in one at a time,
 * carrying that same left-to-right motion down into the total.
 */
export function approveDiagram(el: HTMLElement) {
  const request = q(el, "request");
  const votes = q(el, "votes");
  /* No `squad` here. This diagram's Squad card slot is filled by the card that
     travelled down from the hero — see squadTrail — so the element itself is
     never revealed; it stays at the stylesheet's opacity 0 and does nothing but
     hold the space the traveller lands in and the connectors point at. */
  const halo = q(el, "squad-glow");
  const ledger = q(el, "ledger");
  const chips = q(el, "chip");

  const { from, shift, lift } = MOTION.enter;

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
  gsap.set(request, { opacity: from, x: -shift });
  gsap.set(votes, { opacity: from, x: shift });
  gsap.set(ledger, { opacity: from, y: lift });
  glowStart(halo);
  gsap.set(chips, { opacity: from, y: lift / 4 });

  /* One position for all five, so they are one object arriving rather than
     five elements taking turns — and on the heading's clock, so the diagram and
     the words above it are one movement. */
  const tl = beat();
  tl.to(request, { opacity: 1, x: 0, ...inStep() }, 0)
    .to(votes, { opacity: 1, x: 0, ...inStep() }, "<")
    .to(ledger, { opacity: 1, y: 0, ...inStep() }, "<")
    .to(halo, { opacity: 1, x: 0, y: 0, ...MOTION.approve.glow }, "<");

  trace(tl, el, "-=0.25");

  /* Picked up as the light reaches the far end, so the two read as one move. */
  tl.to(chips, { opacity: 1, y: 0, ...MOTION.approve.chips }, "<+=0.8");

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
export function worksCards(el: HTMLElement) {
  const steps = q(el, "step");
  gsap.set(steps, { opacity: MOTION.enter.from, y: MOTION.enter.lift });

  const tl = beat().to(
    steps,
    { opacity: 1, y: 0, ...inStep(), stagger: MOTION.works.stagger },
    0,
  );
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
  const tl = beat()
    .to(
      members,
      { opacity: 1, y: 0, ...inStep(), stagger: MOTION.intel.memberStagger },
      0,
    )
    .to(aura, { opacity: 1, x: 0, y: 0, ...inStep() }, 0);

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

  gsap.set(signals, { opacity: MOTION.enter.from, y: MOTION.intel.rise });
  gsap.set(categories, {
    opacity: MOTION.enter.from,
    y: MOTION.intel.cardRise,
  });
  gsap.set(nodes, { opacity: 0 });

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
  tl.to(
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
  traceRuns(tl, q(el, "lines").slice(2), 0);
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
  const card = q(el, "card");
  /* The turn stays — it is the gesture the hero opened on, mirrored, and a
     quarter turn is not a grow. Only the distance changed, from 440px (off the
     bottom of the window) down to the shared lift. */
  gsap.set(card, {
    opacity: MOTION.enter.from,
    y: MOTION.early.cardRise,
    rotationZ: MOTION.early.turn,
  });
  const tl = beat().to(card, {
    opacity: 1,
    y: 0,
    rotationZ: 0,
    ...MOTION.early.card,
  });

  /* The two glows behind the card arrive with it rather than with the words —
     this section leads with its artwork, so that beat is where they begin. */
  return glowIn(tl, el);
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
