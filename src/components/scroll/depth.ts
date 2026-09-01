/* Depth. */

/** One layer of one section, and how far away it is. */
export type DepthLayer = {
  /** Queried inside the section. */
  find: string;
  /** px at each end of the crossing, positive = further away. */
  depth?: number | number[];
  /**
   * Sideways, px, and SYMMETRIC — the same value at both ends rather than
   * mirrored.
   */
  sway?: number | number[];
  /** Scale at both ends. */
  swell?: number;
  /** Opacity at the two ends: [arriving, leaving]. */
  fade?: [number, number];
  /**
   * This layer is the section's ambient light rather than part of its content.
   */
  light?: true;
  /**
   * How much of this layer survives into the restrained tier — a window too
   * short to be given the full page. 0, the default, means it does not run
   * there at all.
   */
  calm?: number;

  /**
   * What this layer is worth on the phone, in px at each end of the crossing.
   */
  phone?: number | number[];
};

export type SectionDepth = {
  /** Matches data-sequence-section in the markup. */
  id: string;
  /**
   * "exit" for the section that is already in the window when the page opens.
   */
  half?: "both" | "exit";
  /** Everything in the section, scaled at once. */
  gain?: number;
  layers: DepthLayer[];
};

export const PARALLAX = {
  /**
   * The restrained tier: a window too short to be given the full page, less
   * anyone who asked for reduced motion.
   */
  calm: "(prefers-reduced-motion: no-preference) and (max-height: 479px)",

  /**
   * The scrub's catch-up, in seconds, as a function of how far away a layer
   * is.
   */
  lag: { base: 0.2, per: 0.0022, max: 0.62, step: 0.1 },

  /**
   * How much of the space between a section's heading and its payload the
   * depth system may spend, as a fraction of it.
   */
  spend: 0.6,
} as const;

/*
 * ---------------------------------------------------------------------------
 * THE SEVEN SECTIONS, AND THE SIX TRANSITIONS BETWEEN THEM.
 */
export const SCENE: SectionDepth[] = [
  {
    /*
     * HERO → ALONE VS TOGETHER — you pass through the hero; its light stays.
     */
    id: "hero",
    half: "exit",
    layers: [
      /*
       * The furthest thing on the page, and the slowest to stop. 150 against
       * the copy's -95 is a quarter of a window of separation between the
       * front and the back of the hero by the time it is gone.
       */
      {
        find: ".stage-backdrop",
        depth: 150,
        fade: [1, 0.5],
        calm: 0.4,
        light: true,
      },
      /*
       * The phone's own bloom, which is a different circle in a different
       * place: 634px centred on the fan against the 1028 the wide layout
       * carries, because Figma's blur does not scale with the shape it is on
       * (see HeroFanPhone).
       */
      { find: "[data-reveal='glow']", phone: 120, light: true },
      /*
       * Nearest, and the only layer on the page that fades out almost
       * completely.
       */
      { find: ".screen-copy", depth: -95, fade: [1, 0.1], phone: -54 },
      /* .screen-payload is deliberately absent. */
    ],
  },

  {
    /* ALONE VS TOGETHER → SQUAD APPROVES — the comparison comes apart. */
    id: "alone",
    layers: [
      {
        find: ".screen-glow",
        depth: 175,
        sway: 20,
        swell: 1.12,
        fade: [0.3, 0.5],
        calm: 0.4,
        light: true,
      },
      /*
       * Slightly behind, not ahead: the heading here belongs to the light — it
       * is lit from directly behind — so it travels with it rather than with
       * the panels below.
       */
      { find: ".screen-copy", depth: 30, phone: -18 },
      /* The one section whose argument survives being stacked. */
      { find: "[data-reveal='card-left']", depth: -46, phone: -12 },
      { find: "[data-reveal='card-right']", depth: 34, phone: 12 },
    ],
  },

  {
    /*
     * SQUAD APPROVES → HOW SQUAD WORKS — the group closes around the decision.
     */
    id: "approve",
    gain: 0.95,
    layers: [
      {
        find: ".stage-backdrop",
        depth: 165,
        fade: [0.3, 0.55],
        calm: 0.4,
        light: true,
      },
      { find: ".screen-copy", depth: -40, phone: -18 },
      /*
       * The three parts of the diagram are wired to each other by two dashed
       * drops exactly as long as the gaps they cross, so on the phone they
       * move as one plane and the payload carries all of them.
       */
      { find: ".screen-payload", phone: 12 },
      { find: "[data-reveal='request']", depth: -56, sway: -26 },
      { find: "[data-reveal='votes']", depth: -56, sway: 26 },
      { find: "[data-reveal='ledger']", depth: 40, phone: 16 },
      /*
       * And the card itself is the deepest thing in the diagram — the only
       * payload on the page set further back than the record underneath it.
       */
      { find: "[data-reveal='squad']", depth: 46 },
    ],
  },

  {
    /*
     * HOW SQUAD WORKS → INTELLIGENCE LAYER — three steps in a row become three
     * steps at three distances.
     */
    id: "works",
    gain: 0.88,
    layers: [
      {
        find: ".screen-glow",
        depth: 155,
        sway: -18,
        swell: 1.1,
        fade: [0.35, 0.55],
        calm: 0.35,
        light: true,
      },
      { find: ".screen-copy", depth: -35, phone: -18 },
      /*
       * The receding row is a wide idea and does not survive the column: three
       * cards stacked 24px apart at three distances do not read as 1, 2, 3
       * going back — they read as three gaps that will not hold still.
       */
      { find: ".screen-payload", phone: 12 },
      { find: "[data-reveal='step']", depth: [-38, 0, 38] },
    ],
  },

  {
    /* INTELLIGENCE LAYER → INVITE YOUR SQUAD — the funnel telescopes. */
    id: "intelligence",
    gain: 0.8,
    layers: [
      { find: "[data-reveal='aura']", depth: 140, light: true },
      /*
       * The phone's light, which is a section-sized ellipse behind the column
       * rather than the aura that belongs to the wide funnel.
       */
      { find: ".screen-glow", phone: 90, light: true },
      { find: ".screen-copy", depth: -30, phone: -18 },
      /* Four rows joined by three dashed drops: one plane. */
      { find: ".screen-payload", phone: 12 },
      { find: "[data-reveal='member']", depth: -40 },
      { find: "[data-reveal='signals']", depth: -12 },
      { find: "[data-reveal='hub']", depth: 30 },
      { find: "[data-reveal='verdict']", depth: 55 },
    ],
  },

  {
    /* LIFE INSIDE SQUAD → INVITE YOUR SQUAD — a week, laid out flat. */
    id: "life",
    gain: 0.74,
    layers: [
      { find: "[data-reveal='aura']", depth: 120, light: true },
      { find: ".screen-glow", phone: 90, light: true },
      { find: ".screen-copy", depth: -30, phone: -18 },
      /*
       * Nothing is wired between the three cards down here, but they are 16px
       * and 15px apart — closer than any other stack on the page — so the
       * payload is still one plane and the separation this section is layered
       * for stays a wide-layout idea.
       */
      { find: ".screen-payload", phone: 12 },
      { find: "[data-reveal='lane']", depth: -36, sway: -14 },
      { find: "[data-reveal='cover']", depth: -36, sway: 14 },
      { find: "[data-reveal='health']", depth: 46 },
    ],
  },

  {
    /* INVITE YOUR SQUAD → EARLY ACCESS — the machine hands off to a person. */
    id: "invitation",
    gain: 0.68,
    layers: [
      {
        find: ".screen-glow",
        depth: 130,
        swell: 1.08,
        fade: [0.45, 0.6],
        calm: 0.3,
        light: true,
      },
      { find: ".screen-copy", depth: -28, phone: -16 },
      { find: "[data-reveal='card']", depth: 30, phone: 10 },
      /*
       * The four things on the card drift against the card down here too, and
       * they can: they are inside it, 16px apart, and all four are given the
       * same distance — so they move relative to the card that holds them and
       * not one bit relative to each other.
       */
      { find: "[data-reveal='item']", depth: -14, phone: -7 },
    ],
  },

  {
    /* EARLY ACCESS → the footer. */
    id: "early",
    gain: 0.55,
    layers: [
      {
        find: "[data-reveal='glow']",
        depth: [150, 105],
        calm: 0.3,
        light: true,
      },
      /*
       * Two 260px circles rather than the 412s above the gate, and placed
       * against the section instead of the card's slot — so the phone's light
       * is reached through the layer that holds it.
       */
      { find: ".screen-glow", phone: 80, light: true },
      { find: "[data-reveal='card']", depth: -28, phone: -16 },
      { find: ".screen-copy", depth: -12, phone: -6 },
    ],
  },
];
