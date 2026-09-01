/*
 * Every number the scroll sequence runs on, in one place.
 *
 * Durations are in seconds and distances in pixels unless a comment says
 * otherwise; a few are fractions of the window, which is what lets the same
 * value serve a phone and a desktop.
 */
export const MOTION = {
  /** The two tiers. Below `min-height: 480px` nothing animates at all and the
      server-rendered page is the finished page. */
  enabled:
    "(min-width: 641px) and (min-height: 480px) and (prefers-reduced-motion: no-preference)",
  phone:
    "(max-width: 640px) and (min-height: 480px) and (prefers-reduced-motion: no-preference)",

  /** Windows of scroll a section's beats are scrubbed across. */
  pace: 2.5,

  /* --- the deck's rail of dots (retired with the deck, still driven) ------ */

  rail: {
    travel: { duration: 0.55, ease: "power3.inOut" },
    /** Stretched along the direction of travel as it leaves, round as it lands. */
    squash: { scaleY: 1.9, scaleX: 0.68, duration: 0.2, ease: "power2.out" },
    settle: { duration: 0.5, ease: "elastic.out(1, 0.55)" },
    fill: { duration: 0.7, ease: "power2.out" },
    /** Hover pull: `max` scale at the cursor, falling off over `reach` px. */
    magnet: { max: 2.4, reach: 58, duration: 0.4, ease: "power3.out" },
  },

  navbar: {
    drop: { duration: 1.5, ease: "power1.out" },
  },

  /* --- shared arrival vocabulary ----------------------------------------- */

  /** How far back a card lies before it is brought upright, in degrees. */
  flat: { angle: 78 },

  copy: { rise: 60, duration: 1.5, stagger: 0.1, ease: "power1.out" },

  /** The resting state every `[data-reveal]` arrives from. */
  enter: { from: 0.2, shift: 80, lift: 56 },

  /** Where down the window a section is "arrived" — the line every late beat
      fires on, and both ends of a travel dock. */
  own: { line: 0.85 },

  glow: {
    /** How far a bloom comes in from, along its section's own direction. */
    travel: 140,
    /** The ambient wander that never settles. `step`/`stagger` keep the eight
        sections out of phase with each other. */
    drift: {
      scale: 1.06,
      shift: 26,
      duration: 14,
      step: 3,
      stagger: 3.5,
      ease: "sine.inOut",
    },
  },

  /* --- the travelling Squad card ----------------------------------------- */

  /*
   * One card, three docks, four thousand pixels of page. The Squad card is
   * drawn three times — the hero's fan, the approve diagram, the Early Access
   * form — and this carries the same object between them, scrubbed by the
   * reader rather than played at them. See squadTravel in timelines.ts.
   *
   * Between two docks the card must advance as much page as the reader
   * scrolls, so the average rate is fixed and all the freedom is in how it is
   * DISTRIBUTED: the card quickens through the seam between two sections and
   * eases while one of them is being read. Sideways it lies flat as it is let
   * go, crosses into a lane beside the page's spine, travels down it, and
   * crosses back and stands up into the pose of the dock ahead.
   */
  travel: {
    /** How far above the top of the window the card wants to retreat to
        between two seams, as a fraction of the window. A wish — the path is
        clamped so the card can never move UP the page. */
    lift: 0.1,

    /**
     * How much of that rhythm survives against a steady dock-to-dock glide.
     *
     * Taken neat the rhythm spends a leg's whole page in its falls, so between
     * two of them the card is stationary — and since everything else runs on
     * how far it has travelled, a stationary path is a frozen object. Below
     * one, the mix is strictly increasing: there is no scroll position where
     * the card is not moving, by arithmetic rather than by care.
     */
    rhythm: 0.42,

    /** How much of a leg the steady half spends getting up to speed at either
        end — a trapezoid, so it leaves and lands at rest but holds a genuinely
        constant rate in between. `leave` is short because a dock releases the
        card near the top of the window: any slower and it climbs out of it. */
    ease: { leave: 0.06, land: 0.22 },

    /** How long the hero holds the card after letting go, as a fraction of the
        window. The traveller comes up first, under a card at full strength in
        the same pose; only then does the hero fade. Nothing moves until both
        are settled, which is what keeps it from reading as two cards. */
    handover: 0.08,

    /** The fastest a fall may be, as a multiple of scroll — the test a seam
        appointment has to pass to be kept, not a clamp on the path. */
    dash: 2.5,

    /** Per-fall power warp, ramped `1 + cadence` to `1 - cadence` down a leg,
        so the first fall hangs before it commits and the last glides in. */
    cadence: 0.15,

    /** The hand-over at a dock, as a fraction of the window. Spent INSIDE the
        dock, where the traveller is stationary and exactly on the slot — so it
        is one object changing its light rather than two trading places. */
    grip: 0.18,

    /** How small the card is between docks, as a fraction of its authored
        face, against 0.73 / 0.84 / 1.0 at the three docks. */
    far: 0.34,

    /** Opacity in a seam and over a section's payload. The schedule comes from
        the layout rather than from the journey's progress, which is what makes
        it read as occlusion — the page cannot occlude anything itself. Leg one
        spends its budget on being seen, leg two on being absent. */
    lit: {
      lead: { seam: 0.34, over: 0.16 },
      long: { seam: 0.2, over: 0.05 },
    },

    /** What the phone gets instead: further away, dimmer, narrower lanes. The
        column IS the window down there, so the card is behind something
        wherever it goes. */
    phone: {
      far: 0.28,
      sway: {
        lead: { first: 0.1, second: -0.1 },
        long: { first: 0.1, second: -0.1 },
      },
      lit: {
        lead: { seam: 0.24, over: 0.09 },
        long: { seam: 0.15, over: 0.04 },
      },
    },

    /** Transit brightness falls to this across the page, on SectionDepth.gain's
        own endpoints — the card quietens on the curve everything else does. */
    taper: 0.55,

    /**
     * The lanes each leg travels down, signed, as fractions of window WIDTH.
     * Positive is right of the slots' centre line, zero is straight down it.
     *
     * Two per leg: out into `first`, down it, across to `second`, down that,
     * home. Equal values make it one lane. The long leg is four sections and
     * needs the middle; the short one is a single section and does not.
     *
     * Nothing here can push the card off screen — the pair is fitted to the
     * window at measure time and scaled down together if the wider one would
     * reach an edge. `form` below decides WHEN each part happens.
     */
    sway: {
      lead: { first: 0.4, second: 0.4 },
      long: { first: -0.4, second: 0.4 },
    },

    /** Degrees off plumb, carried on the RATE of the lane rather than its
        value — so the card leans into a crossing and rides level down a lane. */
    bank: 5,

    /**
     * When each part of a crossing happens, in fractions of a leg's travelled
     * page: `flat` ends the way out, `cross` +/- `over`/2 is the lane change,
     * `back` starts the way home.
     *
     * The two legs are not the same size — 1152px of scroll against 4230,
     * covering page half again as fast — so the same fraction buys a third of
     * the time on the short one. Its numbers are pushed out until the two move
     * at something like the same speed, which costs it most of its cruise and
     * is the right trade on a leg one section long.
     *
     * The long leg's `back` is late because it ends with a seam just above its
     * dock, and that is the brightest stretch of its crossing.
     */
    form: {
      lead: { flat: 0.42, back: 0.55, cross: 0.5, over: 0.34 },
      long: { flat: 0.22, back: 0.8, cross: 0.5, over: 0.46 },
    },

    /** The scrub's catch-up, in seconds. Also what rounds the corners where
        the path changes rate. */
    lag: 0.6,
  },

  /* --- hero -------------------------------------------------------------- */

  hero: {
    buttons: { duration: 1.5, stagger: 0, ease: "power1.out" },
    note: { duration: 1, ease: "power1.out" },
    glow: { duration: 1.5, ease: "power1.out" },

    /** Negative so the opening overlaps rather than queues: the bar arrives,
        the words follow while it is still settling, the fan while they are. */
    afterNav: -1.5,
    afterCopy: -1.5,

    /** How far back the stack sits while flat, and the rise to upright. */
    depth: -180,
    lift: { duration: 2, ease: "power1.out" },
    turn: 90,

    fan: { duration: 2, stagger: 0.2, ease: "power1.out" },
    fanPhone: { duration: 1.2, stagger: 0.14, ease: "power1.out" },

    /** The outro: the four passports fold in behind the Squad card and leave
        it alone on the screen, which is where the traveller takes over.
        `out` is in windows of scroll; the phone hangs it on the deck's own
        bottom edge instead, `lead` later and over a shorter distance. */
    fold: { out: 0.6, stagger: 0.12, lag: 0.6, settle: 2.5 },
    foldPhone: { lead: 0.3, out: 0.35 },

    float: {
      rise: 9,
      duration: 3.4,
      each: 0.55,
      ease: "sine.inOut",
    },
  },

  /* --- sections ---------------------------------------------------------- */

  alone: {
    lift: 100,
    cards: { duration: 1.5, stagger: 0.1, ease: "power1.out" },
    vs: { duration: 0.6, ease: "power2.out" },
    bar: { duration: 1.5, stagger: 0.1, ease: "power2.out" },
    figures: {
      count: { duration: 2.6, ease: "power2.out" },
      stagger: 0.08,
      after: 0.35,
    },
  },

  approve: {
    glow: { duration: 1.1, ease: "power1.out" },
    chips: { duration: 0.8, stagger: 0.3, ease: "power2.out" },
  },

  /** A light running along a wire travels at a constant speed, so `none` on
      both. `gap` is the pause between a line finishing and its node lighting. */
  trace: {
    lines: { duration: 1, ease: "none" },
    spark: { duration: 3, ease: "none" },
    stagger: 0.25,
    gap: 6,
    node: { duration: 0.5, ease: "power2.out" },
  },

  works: {
    stagger: 0.14,
    glow: { duration: 1.6, stagger: 0.22, ease: "sine.inOut", dim: 0.4 },
    orbit: { turn: 30 },
  },

  intel: {
    rise: 72,
    memberStagger: 0.1,
    figures: {
      count: { duration: 1, ease: "power1.out" },
      meter: { duration: 1, ease: "power1.out" },
      stagger: 0.1,
      after: 0.8,
    },
    cardRise: 16,
    cardStagger: 0.1,
    glow: { duration: 2.2, stagger: 0.28, ease: "sine.inOut", dim: 0.5 },
  },

  life: {
    cardStagger: 0.09,
    itemRise: 22,
    itemStagger: 0.08,
    figures: {
      count: { duration: 1.8, ease: "power2.out" },
      meter: { duration: 1.8, ease: "power2.out" },
      stagger: 0.1,
      after: 0.25,
    },
    scoreRise: 18,
    scoreStagger: 0.09,
  },

  invite: {
    itemRise: 22,
    itemStagger: 0.13,
  },

  /** Everything travels less the closer it is to the card it hangs off — an
      item's travel is the card's plus its own. */
  early: {
    card: { duration: 3, ease: "power3.out" },
    copyRise: 200,
    fieldRise: 200,
    ctaRise: 100,
    copyStagger: 0.1,
    fieldStagger: 0.12,
  },
} as const;
