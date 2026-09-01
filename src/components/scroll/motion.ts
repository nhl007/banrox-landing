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
  /*
   * THE TRAVELLING CARD.
   *
   * Beats are PIXELS OF SCROLL. Bare fractions under 1 are fractions of the
   * window — innerWidth for anything lateral, innerHeight for anything
   * vertical — unless the note says otherwise. Angles are degrees.
   */
  travel: {
    /** The card's rhythm, in pixels of scroll. */
    beat: {
      /** Head-room demanded ahead of the first dock when choosing where the
          hero lets go. */
      lead: 340,
      /** How long the card sits parked IN a dock, spent on each side of the
          slot's centre — so a dock is twice this wide. */
      dwell: 200,
      /** The ramp either side of a dock, and the half-width of the face
          cross-fade window. */
      morph: 150,
      /** The pause held in the side lane beside the Life board, spent half
          each side of its centre. */
      hover: 220,
      /** The run in from that side lane to the Intelligence dock. */
      approach: 180,
    },

    /**
     * THE WORKS HAND-OVER, in pixels of scroll.
     *
     * The card comes apart into three over `fan`, holds fully apart for
     * `hand`, and puts itself together again over `fan`. It trades with the
     * section's own three cards only DURING the hold, and that is the whole
     * point of there being one: full spread is the only place the three things
     * the card is showing are where those three cards are. Trading anywhere
     * else means handing over from the wrong position, which is seen as the
     * card jumping — going in, and again coming back.
     *
     * Each trade takes `trade`, and two of them plus a beat of daylight have
     * to fit inside `hand`. `fan + hand / 2` is the beat's half width: the card
     * is docked on the middle step from that far out either side, and the runs
     * in and out are timed against it.
     */
    works: { fan: 270, hand: 460, trade: 120 },

    /** ScrollTrigger scrub, in seconds. */
    lag: 0.45,

    /**
     * The least page a transit wants, as a fraction of window HEIGHT, before
     * a HOLD next to it starts giving up its own scroll to pay for it. Sections
     * do not always leave the card room: pack two of them close enough and a
     * leg can end up a few dozen pixels of scroll long, which is not a journey,
     * it is a cut. A beat spent waiting is one the card can afford to lose;
     * a beat spent moving is not.
     */
    room: 0.3,

    /**
     * The hero hand-over, as a fraction of the window: the traveller comes up
     * over the first 35% of it and the hero's own anchor goes out over the
     * rest, both on `soft`.
     */
    handover: 0.08,
    /** Extra window ahead of that, so the whole trade is done before the card
        is asked to move. */
    grip: 0.18,

    /** The yaw swung through while two faces trade places, and the pitch
        carried with it as a fraction of that yaw. Applied negative, and as a
        there-and-back rather than a swing through. */
    turn: { yaw: 54, pitch: 0.3 },

    /** Half-width of the cross-fade band, in units of swap progress. */
    band: 0.08,
    /** A face comes in from this fraction of its final scale. */
    grow: 0.85,

    /** The side lane the card travels down between docks. */
    margin: {
      scale: 0.58,
      /** y down the window. */
      line: 0.46,
      /** x from centre as a fraction of window WIDTH, signed by side — the
          WIDE tier only. The phone puts the card's centre on the window edge
          and ignores this. */
      side: 0.37,
      /** Added to the -90 base roll, signed by side. */
      tilt: 9,
      /** Pitch, unsigned. */
      rx: 12,
      /** Yaw, signed against the side. */
      ry: 20,
    },

    /**
     * How much of the card must stay on screen, as a fraction of its own size
     * — applied UNLESS both ends of the segment are docks, so it is live on
     * every approach and departure and off only while parked between two.
     */
    keep: { full: 0.38, phone: 0.5 },

    /**
     * The bowed arc between two docks: two control points at a third and two
     * thirds of the leg, alternating side each time a leg is built. Legs
     * shorter than 3px of scroll are not bowed at all.
     */
    bow: {
      /** Leg length is normalised by innerWidth times this to get the bow's
          strength — after the vertical is scroll-compensated, so a leg that
          merely keeps pace with the page counts as short. */
      reach: 0.33,
      /** The floor that strength is lifted off on the wide tier. The phone
          uses 1 flat, and a `hug` leg uses 0.15 and overrides both. */
      floor: 0.22,
      /** Lateral throw as a fraction of window WIDTH. The phone's is large on
          purpose: with `keep.phone` bounding the centre to the window exactly,
          the phone arc rides its edges. */
      lat: { full: 0.07, phone: 0.5 },
      /** Vertical throw as a fraction of window HEIGHT. */
      drop: 0.045,
      /** How much the scale dips at mid-arc. */
      dip: 0.07,
      /** Roll, jittered once per leg, signed one way at the first control
          point and the other at the second. */
      roll: 12,
      /** Pitch at the control points. */
      tip: { full: 15, phone: 38 },
      /** Yaw at the control points — the sign does NOT flip between them. */
      yaw: { full: 19, phone: 29 },
      /** The second control point's share of roll and yaw. */
      trail: 0.45,
    },

    /** The three hops the card makes crossing from Life to Early Access:
        left, right, left. */
    flight: {
      /** Lateral spread as a fraction of window WIDTH, jittered. */
      spread: 0.27,
      /** y as a fraction of window HEIGHT. */
      high: 0.15,
      /** Added to `high` on the middle hop only. */
      dip: 0.38,
      /** Pitch: this on the middle hop, a third of it the other way on the
          other two. */
      flat: 55,
      /** Roll off the -90 base, jittered, signed by side. */
      tilt: 20,
      /** Yaw, signed by side. */
      yaw: 29,
    },

    /** scaleY while the card lies edge-on over the Works steps. */
    squash: 0.03,

    /**
     * The flat lay-down over the three Works steps, which happens only where
     * they are STACKED — the test is on their authored centres.
     */
    flat: {
      /** Pixels above the first step's authored top edge that it parks. */
      above: 46,
      /** Pixels of scroll before the lay-down in which it turns flat. */
      turn: 240,
      /** A step's reveal starts this fraction of a window above its top
          edge... */
      open: 0.92,
      /** ...and finishes this fraction above it. */
      shut: 0.5,
      /** Pixels of scroll after the last step's reveal for the slide-out. */
      slide: 260,
    },
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
