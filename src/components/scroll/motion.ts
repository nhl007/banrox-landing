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

/**
 * A section that plays as soon as the page is ready rather than when it is
 * scrolled to — written in `trigger` below wherever a ScrollTrigger start
 * position would otherwise go.
 *
 * Only the hero uses it, and only because it is the part of the page that is
 * already there before there is any scrolling to respond to. Everything further
 * down waits to be arrived at, which is the whole point of the system.
 */
export const ON_LOAD = "load";

export const MOTION = {
  /*
   * The gate for the entire system. Below this the page renders static and no
   * trigger is created at all. It MUST stay identical to the @media guard on
   * [data-reveal] in globals.css — that rule holds the pre-hydration state, so
   * any disagreement either flashes the finished page or strands it blank — and
   * to the queries that make a section one screen, since a section that is not
   * a screen cannot honestly be animated on one trigger.
   *
   * The height half is what a phone held sideways fails: 932x430 passes the
   * width test, and at that height the heading is most of the window, so the
   * card fan fitted into what was left came out at 0.076 scale. Measured. See
   * the note above .screen in globals.css.
   */
  enabled:
    "(min-width: 768px) and (min-height: 480px) and (prefers-reduced-motion: no-preference)",

  /**
   * Every beat's timeScale. The numbers below are written as the proportions
   * they were tuned at; this is what turns them into a pace.
   */
  pace: 1.75,

  /*
   * Where every section fires: one entry per section, in the order they happen
   * down the page.
   *
   * One trigger per section, not one per beat. A section is exactly one screen
   * tall (see .screen in globals.css), so its heading and its diagram are in
   * front of the reader at the same moment — and splitting a section into
   * separately-triggered arrivals was answering a problem the layout no longer
   * has. The beats inside a section still play in order; they queue behind each
   * other off this single trigger, which is the controller's job.
   *
   * Nothing here is shared or derived. Each key is a section id, sections.ts
   * reads its start from that key by name, and changing one line moves exactly
   * one section and nothing else. The duplication is the point — a value
   * repeated six times is six values that happen to agree, not one value six
   * sections are stuck with.
   *
   * The syntax is ScrollTrigger's, "<point on the section> <point in the
   * window>": "top 40%" fires once the section's top edge has climbed to 40% of
   * the way down the window — which, the section being a screen tall, is with
   * about 60% of it showing. A LOWER percentage fires LATER, because the
   * section has to travel further up the screen to get there.
   *
   * 40 rather than something later because arriving is not instant: the funnel
   * takes about four seconds to fill, so a trigger that waited for the section
   * to fill the window would spend most of that time behind a reader who has
   * already moved on. Started a little over halfway in, it lands as they do.
   */
  trigger: {
    /**
     * The one section that does not wait for a scroll that has not happened
     * yet: it is the page opening. Its beats fire off the load and queue in
     * reading order — the navbar drops, the copy comes up under it
     * (hero.afterNav), and the card scene follows the copy (hero.afterCopy).
     */
    hero: ON_LOAD,

    alone: "top 40%",

    approve: "top 40%",

    works: "top 40%",

    intelligence: "top 40%",

    invitation: "top 40%",

    early: "top 40%",
  },

  /* --- settling --------------------------------------------------------- */

  /**
   * How the page comes to rest on a section instead of between two.
   *
   * Done here rather than with CSS scroll snapping, and measured rather than
   * assumed. `scroll-snap-type: mandatory` lands every position exactly, but it
   * decides on each gesture in isolation, by whichever position is nearest: a
   * single 400px wheel detent ends closer to where it started than to the next
   * section, so it is snapped straight back and the page does not move at all.
   * Five detents 30ms apart are five gestures, so they do not move it either.
   * Only one continuous sweep of most of a screen gets anywhere. `proximity`
   * keeps the wheel working and gives up on the problem, coming to rest
   * 300-380px into a section about half the time.
   *
   * Nearest is the wrong rule here whoever implements it, which is the other
   * half of why this is not CSS: it puts the decision at the halfway mark, so
   * half of every gesture a reader makes is answered by putting them back where
   * they started. Going where they were headed is `deadzone` below.
   *
   * Waiting for the scrolling to stop is what fixes it: detents accumulate into
   * one distance first, and only then does the page settle. It also settles
   * over a duration with an ease, where the browser's own snap is a cut.
   *
   * Not scaled by `pace`. This is not a beat — it is the page arriving where
   * the reader was already going, and it should take the same time whatever
   * speed the animations are running at.
   */
  settle: {
    /**
     * Quiet time after the last scroll event before the page settles.
     *
     * The whole mechanism rests on this. Too short and a slow wheel is judged
     * one detent at a time, which is CSS mandatory snapping again; too long and
     * the page moves after the reader has decided they have stopped.
     */
    delay: 0.12,
    /**
     * How far the page has to move before it counts as going somewhere, as a
     * fraction of the window.
     *
     * The settle is DIRECTIONAL: a scroll down goes to the top of the next
     * section, however short it was, and a scroll up goes back to the top of
     * the previous one. That is what makes the page navigable a section at a
     * time — one notch of a wheel, one section — where snapping to whichever
     * section is nearest put the decision at the halfway mark and sent
     * everything short of half a screen straight back where it came from.
     *
     * Which leaves the opposite failure to guard: with any movement at all
     * counting, a trackpad brushed by a resting hand is a full screen. This is
     * the width of that guard, and the only thing between here and a page that
     * jumps when nobody asked it to.
     */
    deadzone: 0.06,
    /**
     * How long the slide takes, floor and ceiling. Scaled between them by the
     * distance left to travel, so nudging back 40px does not take as long as
     * carrying most of a screen.
     */
    duration: { min: 0.18, max: 0.5 },
    ease: "power2.out",
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

    /**
     * How long the card scene waits for the copy. Negative for the same reason
     * afterNav is: the two are one opening rather than two animations queueing,
     * so the fan sets off while the second CTA above it is still settling. Zero
     * would read as a pause.
     *
     * There is nothing to scroll to any more. The hero is one screen including
     * the navbar, so the fan is on screen from the first frame — which is what
     * retired the assist that used to drag the page down to it.
     */
    afterCopy: -0.6,

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
