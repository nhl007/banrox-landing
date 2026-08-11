/*
 * Every tunable in the scroll sequence lives here. Nothing else in
 * src/components/scroll hard-codes a duration, ease, stagger or distance, so
 * this file is the whole tuning surface.
 *
 * Note on durations: nothing plays at wall-clock speed. Every timeline is
 * scrubbed by scroll position, so these numbers set the *proportions* of a
 * timeline — how much of the section's scroll each beat gets — not how long it
 * takes. Doubling one beat's duration gives it twice the scroll distance.
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

  /** Seconds the playhead takes to catch up with the scrollbar. */
  scrub: 0.6,

  /*
   * How much scroll a pinned section consumes, in viewport heights. This is
   * the pace dial: the whole intro, hold and outro are spread across it, so
   * raising it makes everything advance more slowly per wheel notch without
   * changing any beat's share of the sequence.
   */
  pinLength: 2,

  /* --- navbar ----------------------------------------------------------- */

  navbar: {
    /** Hinges on its top edge, so it folds away rather than just sliding. */
    fold: 55,
    /*
     * The fold is spent by the time the hero pins, which happens as soon as
     * the header has scrolled off — so its range is the header's own height,
     * measured at runtime. It folds away exactly as it leaves.
     */
    /** The one thing that is not scrubbed: it drops in once, on load. */
    drop: { duration: 0.7, ease: "power3.out" },
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
  copy: { rise: 48, duration: 0.7, stagger: 0.12, ease: "back.out(1.6)" },

  /*
   * How a section hands over to the next one.
   *
   * Between two pins the page still scrolls a full viewport height — the
   * outgoing section clearing the top while the incoming one climbs from the
   * fold. Left alone that means every section rides up from the very bottom of
   * the screen, which is a lot of travel for something that is meant to feel
   * like it was already there, waiting behind the section in front of it.
   *
   * So the controller cancels that scroll: it counter-translates the incoming
   * section by exactly what the page moves it, and the content simply holds its
   * final position and dissolves in. `settle` is how much of the travel is
   * deliberately left uncancelled, so the section still drifts up into place
   * rather than hanging perfectly still.
   */
  arrival: {
    settle: 120,
    dissolve: { duration: 0.6, ease: "power1.out" },
  },

  /* --- hero ------------------------------------------------------------- */

  hero: {
    buttons: { duration: 0.8, stagger: 0.12, ease: "back.out(1.4)" },
    note: { duration: 0.5, ease: "power3.out" },
    glow: { duration: 1.2, ease: "power1.out" },

    /**
     * Slides the section's content up inside the pin, so the card scene is on
     * screen when its beat plays. The section is taller than any desktop
     * viewport and the pin holds it still, so this is what "scrolling down to
     * the cards" becomes once the page itself has stopped moving.
     */
    reveal: { duration: 1, ease: "power2.inOut" },

    /** How far back the stack sits while flat, and the rise to upright. */
    depth: -180,
    lift: { duration: 1.4, ease: "power2.out" },

    /**
     * The Squad card starts lying flat AND on its side — landscape, the way a
     * card actually sits on a table, and the same horizontal pose the CTAs
     * above it start in. +90 here reads as a counter-clockwise quarter turn on
     * the way to 0, because CSS rotation is positive-clockwise.
     */
    turn: 90,

    /** The fan-out from behind the Squad card, once the stack is upright. */
    fan: { duration: 0.9, stagger: 0.1, ease: "power3.out" },
  },

  /* --- alone vs together ------------------------------------------------ */

  /*
   * Every other section. One shared shape — copy up, content revealed, payload
   * rises in — so the page reads as one system rather than seven ideas.
   */
  section: {
    reveal: { duration: 1, ease: "power2.inOut" },
    /**
     * Overhang a section is allowed before it earns a reveal beat. Zero: if any
     * of it is off screen it has to be reachable, and since every reveal also
     * spends `tail` the beat can never be the few-pixel no-op — pure dead scroll
     * in the middle of a pin — that a threshold would otherwise be guarding
     * against. Sections that already fit skip it entirely.
     */
    revealMin: 0,
    /**
     * Breathing room left under the content once it has been revealed, so a
     * section that overhangs does not end flush against the bottom edge.
     */
    tail: 48,
    bodyRise: 56,
    body: { duration: 0.9, ease: "power3.out" },
  },

  alone: {
    reveal: { duration: 1, ease: "power2.inOut" },
    /** Panels slide in from the viewport edges. Travel is measured at runtime. */
    cards: { duration: 1.7, stagger: 0.12, ease: "power3.out" },
    vs: { duration: 0.5, ease: "power2.out" },
    /**
     * The strength rails arrive last, wiped open downwards from their own top
     * edge so each panel looks like it is extending to make room for one —
     * rather than a block fading in on top of a card that was already whole.
     */
    bar: { duration: 0.8, stagger: 0.12, ease: "power2.out" },
  },

  /* --- squad approves --------------------------------------------------- */

  approve: {
    reveal: { duration: 1, ease: "power2.inOut" },

    /**
     * One duration for all four pieces of the diagram, so they land on the same
     * frame. That is the whole idea of the section — a group acting as one — and
     * it only reads if the diagram arrives as a single object rather than as
     * four elements taking turns. Only the ease differs between them.
     */
    land: 1.4,
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
    chips: { duration: 0.5, stagger: 0.11, ease: "back.out(2)" },
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
    lines: { duration: 0.9, ease: "none" },
    spark: { duration: 1.15, ease: "none" },
    /** Between one run and the next where a diagram has several in series. */
    stagger: 0.25,
    /** Endpoint dots and flow ticks: the things a drawn line arrives at. */
    node: { duration: 0.5, ease: "power2.out" },
  },

  /* --- how squad works -------------------------------------------------- */

  works: {
    reveal: { duration: 1, ease: "power2.inOut" },
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
    hop: 26,
    cards: { duration: 1.1, stagger: 0.14, ease: "power4.out" },
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
   * 948px, so the pin has to travel down it. Its beats are therefore laid
   * *across* the reveal rather than after it — each part of the funnel plays
   * while it is the part on screen, the way the hero's card scene does.
   */
  intel: {
    reveal: { duration: 1.6, ease: "power2.inOut" },
    rise: 72,
    members: { duration: 0.9, stagger: 0.1, ease: "power3.out" },
    signals: { duration: 0.9, ease: "power3.out" },
    /** The engine, and the verdict it hands down. */
    hub: { duration: 1, stagger: 0.14, ease: "power3.out" },
  },

  /* --- squad invitation ------------------------------------------------- */

  invite: {
    reveal: { duration: 1, ease: "power2.inOut" },
    /** Rises and grows at once, so it arrives rather than just sliding up. */
    cardFrom: { y: 160, scale: 0.88 },
    card: { duration: 1.2, ease: "back.out(1.3)" },
    /** Then it fills: QR, invite link, copy, CTA. */
    itemFrom: { y: 22, scale: 0.9 },
    items: { duration: 0.55, stagger: 0.13, ease: "back.out(1.9)" },
  },

  /* --- early access ----------------------------------------------------- */

  early: {
    reveal: { duration: 1, ease: "power2.inOut" },
    /**
     * The page opened on this card standing upright and turning into place; it
     * closes on the same card lying flat and turning the other way. +90 reads
     * as a counter-clockwise quarter turn on the way to 0, because CSS rotation
     * is positive-clockwise — same convention as the hero.
     */
    turn: 90,
    card: { duration: 1.5, ease: "power3.out" },
    fieldRise: 28,
    fields: { duration: 0.7, stagger: 0.12, ease: "power3.out" },
    /** Hinges upright off its bottom edge, the same gesture as the hero CTAs. */
    cta: { duration: 0.8, ease: "back.out(1.4)" },
  },
} as const;
