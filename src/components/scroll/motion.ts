/*
 * Every tunable in the sequence lives here. Nothing else in
 * src/components/scroll hard-codes a duration, ease, stagger or distance, so
 * this file is the whole tuning surface.
 *
 * Durations are seconds of wall clock. Scroll decides *when* a beat starts and
 * nothing else — once it starts it plays at its own speed, to the end, once.
 * `pace` scales all of them at the same time, which is the dial to reach for
 * when the page feels slow rather than any individual number.
 *
 * Distances are px, angles degrees.
 */
export const MOTION = {
  /*
   * The gate for the entire system. Below this the page renders static and no
   * trigger is created at all. It MUST stay identical to the @media guard on
   * [data-reveal] in globals.css — that rule holds the pre-hydration state, so
   * any disagreement either flashes the finished page or strands it blank.
   */
  enabled: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",

  /**
   * Every beat's timeScale. The numbers below are written as the proportions
   * they were tuned at; this is what turns them into a pace.
   */
  pace: 1.6,

  /*
   * Where every beat fires: one entry per beat, in the order they happen down
   * the page.
   *
   * Nothing here is shared or derived. Each key is a [data-beat] anchor in the
   * markup, sections.ts reads its beat's start from that key by name, and so
   * changing one line here moves exactly one animation and nothing else. The
   * duplication is the point — a value repeated seven times is seven values
   * that happen to agree, not one value seven beats are stuck with.
   *
   * The syntax is ScrollTrigger's, "<point on the element> <point in the
   * window>": "top 80%" fires when the element's top edge reaches 80% of the
   * way down the window. A LOWER percentage fires LATER, because the element
   * has to travel further up the screen to get there. The element side takes
   * `top`, `center`, `bottom` or a percentage of its own height, so `center`
   * is how a beat waits for the middle of its subject rather than its leading
   * edge — which is what a tall element wants, since its top arrives long
   * before the thing itself does.
   *
   * The rules of thumb behind the numbers below: copy fires early at 80%
   * because a heading is short and reads the instant it appears, and a payload
   * waits until 65% because it is a diagram several hundred pixels tall and
   * firing it with the copy would play most of it below the fold.
   */
  trigger: {
    /**
     * Above the fold, so these are about the page opening rather than about
     * scrolling. The copy fires at load whatever it says — on an unscrolled
     * page the hero's top edge is already past every start position there is —
     * and it queues behind the navbar (see hero.afterNav).
     *
     * The cards are the exception on the whole page. They are the one payload
     * already on screen at load, so a top-edge trigger also fires immediately,
     * opening the fan while the reader is still on the headline and finishing
     * it before they look down. Measured from the middle of the fan instead, it
     * waits to be arrived at.
     */
    hero: { copy: "center 80%", cards: "center 68%" },

    alone: { copy: "center 80%", payload: "center 58%" },

    approve: { copy: "center 80%", payload: "center 65%" },

    works: { copy: "center 80%", payload: "center 65%" },

    /**
     * Five rather than two: the funnel is 948px tall, so a single trigger for
     * all of it would play the engine three viewports before anyone reached it.
     * Each row waits for itself.
     */
    intelligence: {
      copy: "center 80%",
      members: "top 65%",
      signals: "top 65%",
      hub: "top 65%",
      verdict: "top 65%",
    },

    invitation: { copy: "center 80%", payload: "center 65%" },

    /** The one section with no heading: the card leads and the words follow. */
    early: { card: "center 70%", form: "center 75%" },
  },

  /* --- navbar ----------------------------------------------------------- */

  navbar: {
    /**
     * Hinges on its top edge, so it drops in rather than just sliding down.
     * The page opens on it: it is the first thing that moves, and the hero's
     * copy waits on it (see hero.afterNav).
     */
    fold: 40,
    drop: { duration: 1.5, ease: "power3.out" },
  },

  /* --- shared ----------------------------------------------------------- */

  /*
   * The "lying flat on the screen plane" pose, shared by the CTAs and the card
   * stack so they read as the same gesture.
   *
   * Not 90. A plane rotated exactly 90deg is edge-on to the camera and projects
   * to a zero-height line — there is nothing left to see, let alone a legible
   * stack. At 78deg with the perspective in CardFan the stack still projects
   * ~160px of depth while reading as flat.
   */
  flat: { angle: 78 },

  /** Copy everywhere: rises from below while scaling up out of nothing. */
  copy: { rise: 190, duration: 1.4, stagger: 0.1, ease: "back.out(1.6)" },

  /* --- hero ------------------------------------------------------------- */

  hero: {
    buttons: { duration: 2, stagger: 0.5, ease: "back.out(1.4)" },
    note: { duration: 0.2, ease: "power3.out" },
    glow: { duration: 1.2, ease: "power1.out" },

    /**
     * How long the hero's copy waits for the navbar. Both are on screen at load
     * so both would otherwise fire at once; this is what makes the page open in
     * the order it reads — the bar arrives, then the words under it. Shorter
     * than the drop itself on purpose: they overlap rather than queue.
     */
    afterNav: -0.5,

    /** How far back the stack sits while flat, and the rise to upright. */
    depth: -180,
    lift: { duration: 1.5, ease: "power2.out" },

    /**
     * The Squad card starts lying flat AND on its side — landscape, the way a
     * card actually sits on a table, and the same horizontal pose the CTAs
     * above it start in. +90 here reads as a counter-clockwise quarter turn on
     * the way to 0, because CSS rotation is positive-clockwise.
     */
    turn: 90,

    /** The fan-out from behind the Squad card, once the stack is upright. */
    fan: { duration: 1.2, stagger: 0.2, ease: "power3.out" },
  },

  /* --- alone vs together ------------------------------------------------ */

  alone: {
    /** Panels slide in from the viewport edges. Travel is measured at runtime. */
    cards: { duration: 1.7, stagger: 0.1, ease: "power3.out" },
    vs: { duration: 0.6, ease: "power2.out" },
    /**
     * The strength rails arrive last, wiped open downwards from their own top
     * edge so each panel looks like it is extending to make room for one —
     * rather than a block fading in on top of a card that was already whole.
     */
    bar: { duration: 1.5, stagger: 0.1, ease: "power2.out" },
    /**
     * Each rail's three figures count up to the value printed on them.
     *
     * The whole section is one number beating another, so the figures are the
     * argument and arriving already settled states it rather than makes it.
     * Counting is also what ties the two rails together: they run as one sweep
     * across both panels, which reads as a single comparison being totted up
     * rather than each card totalling itself.
     *
     * Decelerating rather than linear. A figure that lands on its value at full
     * speed reads as a number that was cut off; `out` lets the last few tick
     * over slowly enough to be read as they settle.
     */
    figures: {
      count: { duration: 1.6, ease: "power2.out" },
      /** Between one figure and the next, left to right across both rails. */
      stagger: 0.08,
      /**
       * Held after the rails begin opening. The rail grows out of the panel's
       * bottom edge, so with no delay the first digits would be moving while
       * still half-clipped by it.
       */
      after: 0.35,
    },
  },

  /* --- squad approves --------------------------------------------------- */

  approve: {
    /**
     * One duration for all four pieces of the diagram, so they land on the same
     * frame. That is the whole idea of the section — a group acting as one — and
     * it only reads if the diagram arrives as a single object rather than as
     * four elements taking turns. Only the ease differs between them.
     */
    land: 2,
    slide: "power3.out",
    /**
     * The Squad card is the one with nowhere to travel from, so it scales up out
     * of nothing while the other three slide. The hop is what makes that read as
     * landing rather than inflating — small on purpose, enough to feel like it
     * arrives, not enough to look like it slid in too.
     *
     * The ease must not overshoot, and this is a geometry constraint rather than
     * taste. The card's top edge sits exactly on the stage's, and the stage is
     * clipped so the request card and vote list can start off the viewport — so
     * a back ease growing it to 1.1 about its own centre shears 15px off the top
     * of it every time. power4 gives the same snap with nothing past full size.
     */
    pop: { ease: "power4.out", hop: 18 },
    /** The ambient bloom behind the card, which has no edge to pop. */
    glow: { duration: 1.1, ease: "power1.out" },

    /** The ledger counts itself in, one member at a time. */
    chips: { duration: 1, stagger: 0.3, ease: "back.out(2)" },
  },

  /* --- connectors ------------------------------------------------------- */

  /*
   * Shared by every diagram that has wiring between its parts: the run draws
   * itself from one end while a light rides the drawing edge.
   *
   * `none` on both: a light running along a wire travels at a constant speed,
   * and easing either of these makes it accelerate down a straight line. The
   * sweep outlasts the wipe so it carries on past the last branch and leaves —
   * a glow that stops dead at the far end just becomes a parked highlight.
   */
  trace: {
    lines: { duration: 1.5, ease: "none" },
    spark: { duration: 1.15, ease: "none" },
    /** Between one run and the next where a diagram has several in series. */
    stagger: 0.25,
    /**
     * Between one pass down the wiring and the next, once the diagram has
     * arrived and the light is looping (see traceLoop).
     *
     * Long on purpose, and the dial to reach for if the page feels busy. The
     * pass itself is barely half a second, so this is almost the whole cycle:
     * short enough and three diagrams pulsing away turn into the thing the eye
     * keeps going back to instead of the content they wire together.
     */
    gap: 6,
    /** Endpoint dots and flow ticks: the things a drawn line arrives at. */
    node: { duration: 0.5, ease: "power2.out" },
  },

  /* --- how squad works -------------------------------------------------- */

  works: {
    /**
     * Three cards scaling up out of nothing, each landing with a hop so it reads
     * as arriving rather than inflating.
     *
     * Same constraint as the Squad card: the ease must not overshoot. A card is
     * exactly as tall as the stage that holds it, so a back ease growing it to
     * 1.08 sheared 18px off its top and bottom; sideways it pushed past the
     * stage's own width, which at a viewport near 1240 would raise a scrollbar
     * inside .stage-viewport — and that resizes the container query the sizer
     * derives its height from, moving every section below it.
     */
    hop: 86,
    cards: { duration: 2, stagger: 0.14, ease: "power4.out" },
    /**
     * The one thing on the page that never finishes. Steps 1 and 2 are about a
     * group being continuously assessed, so their rings breathe for as long as
     * the section is on screen instead of settling into a still diagram.
     *
     * Staggered from the middle out, so it reads as a pulse leaving the centre
     * rather than every ring blinking together. Paused whenever the section is
     * off screen — see the controller.
     */
    glow: { duration: 1.6, stagger: 0.22, ease: "sine.inOut", dim: 0.4 },
  },

  /* --- intelligence layer ----------------------------------------------- */

  /*
   * The one section taller than the rest by a wide margin: the funnel alone is
   * 948px, so no single trigger point can serve all of it. Each row of it gets
   * its own beat and its own trigger instead, so a row animates as you arrive
   * at it rather than three viewports before you do.
   */
  intel: {
    rise: 72,
    members: { duration: 1.5, stagger: 0.1, ease: "power3.out" },

    /**
     * What is *on* each score card: the number counts up while the meter under
     * it fills to match.
     *
     * Both together, on one duration, because they are one fact stated twice —
     * a meter that arrives full under a number still climbing reads as two
     * unrelated readouts sharing a card. The row is the raw material the rest
     * of the funnel processes, so it should look like it is being read off a
     * file rather than printed already complete.
     *
     * `stagger` deliberately repeats members.stagger rather than deriving from
     * it: matching it is what keeps each number counting inside the card that
     * is arriving, instead of a second wave crossing the row at its own speed.
     * They agree; they are not the same value.
     */
    figures: {
      count: { duration: 1.4, ease: "power2.out" },
      meter: { duration: 1.4, ease: "power2.out" },
      stagger: 0.1,
      /**
       * When the first card's readout starts, in seconds into the beat — held
       * just long enough that the card is legibly on its way in before the
       * number inside it starts moving.
       */
      after: 0.3,
    },
    signals: { duration: 1.5, ease: "power3.out" },

    /**
     * The four category cards, which fill the signal container rather than
     * arriving with it.
     *
     * The container is the one thing in the funnel that is a container — the
     * row above it is four separate cards and the hub below is one object — so
     * it is the one place the diagram can show something being assembled
     * instead of delivered. Riding in as a single slab spends that for nothing.
     *
     * Scaled up rather than only risen, and the only `back` ease in the
     * section: a card that overshoots reads as dropping into a slot, which is
     * what these do. Safe against the neighbours, and by a wide margin — a back
     * ease overshoots a fraction of the distance it travels, not of the value,
     * so over 0.94-to-1 it peaks at 1.005. That is 1.2px on a 230px card,
     * against an 8px gap.
     */
    cardFrom: { y: 16, scale: 0.94 },
    cards: { duration: 0.6, stagger: 0.1, ease: "back.out(1.6)" },
    /**
     * When they start, in seconds into the beat. Absolute rather than chained
     * off the container's rise, because it lands *during* that rise — early
     * enough that the two read as one movement, late enough that there is a box
     * to drop into.
     */
    fill: 0.45,

    /**
     * The hub's bloom, which breathes for as long as the section is on screen.
     *
     * This is the only thing in the funnel that never finishes, and it is the
     * one element that should not: everything above it arrives and settles
     * because it is a file or a reading, and the engine is the thing still
     * working. Held to opacity — the glow layers sit behind the logomark and
     * the two lines of type under it, and scaling them would re-raster that
     * text every frame for the life of the section.
     *
     * Staggered from the innermost layer out, so the breath leaves the core
     * rather than the whole bloom pulsing as one plate.
     */
    glow: { duration: 2.2, stagger: 0.28, ease: "sine.inOut", dim: 0.5 },
    /** The engine, and the verdict it hands down. */
    hub: { duration: 1.5, stagger: 0.14, ease: "power3.out" },
  },

  /* --- squad invitation ------------------------------------------------- */

  invite: {
    /** Rises and grows at once, so it arrives rather than just sliding up. */
    cardFrom: { y: 160, scale: 0.88 },
    card: { duration: 1.2, ease: "back.out(1.3)" },
    /** Then it fills: QR, invite link, copy, CTA. */
    itemFrom: { y: 22, scale: 0.9 },
    items: { duration: 0.55, stagger: 0.13, ease: "back.out(1.9)" },
  },

  /* --- early access ----------------------------------------------------- */

  early: {
    /**
     * The page opened on this card standing upright and turning into place; it
     * closes on the same card lying flat and turning the other way. +90 reads
     * as a counter-clockwise quarter turn on the way to 0, because CSS rotation
     * is positive-clockwise — same convention as the hero.
     */
    turn: 90,
    /**
     * How far below its resting place the card starts. Its beat fires with the
     * card's top around two thirds down the window, so a little over a third of
     * a viewport puts it just off the bottom edge when it sets out.
     */
    rise: 440,
    card: { duration: 3, ease: "power3.out" },
    fieldRise: 28,
    fields: { duration: 1, stagger: 0.12, ease: "power3.out" },
    /** Hinges upright off its bottom edge, the same gesture as the hero CTAs. */
    cta: { duration: 1.5, ease: "back.out(1.4)" },
  },
} as const;
