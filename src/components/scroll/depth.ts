/*
 * Depth.
 *
 * Everything in this file answers one question: as the reader scrolls a section
 * across the window, which parts of it move at the page's speed, which lag
 * behind it, and which run ahead. That difference — and only that difference —
 * is what makes a flat page read as something with front and back.
 *
 * It is a separate system from motion.ts on purpose, and the split is the same
 * one the sequence already draws elsewhere: an ARRIVAL is an event, it has a
 * duration, it happens once and the reader watches it. DEPTH is not an event.
 * It has no duration at all, only a rate; every frame of it belongs to the
 * reader, and it is running on every section that is anywhere near the window,
 * forwards and backwards, for as long as the page is open. The two never write
 * the same property (see the note on units below), so they compose rather than
 * compete: a heading still rises and fades in the way it always did, on a layer
 * that is now also moving past the reader at its own distance.
 *
 * ---------------------------------------------------------------------------
 * THE SIGN OF `depth`
 *
 * Positive is FURTHER AWAY. A far layer moves less than the page does, which
 * means that relative to the section it belongs to it slides *downwards* the
 * whole way across the window: it is high in its box as the section rises into
 * view and still hanging low as the section leaves. (Think of a background
 * pinned to the window while the content scrolls off it.) Negative is NEARER —
 * the layer overtakes the page, arriving from below and leaving out the top.
 *
 * The number is how far, in px, at the two ends of the crossing. Zero at the
 * middle, always: when a section is squarely in the window it is exactly where
 * the stylesheet put it, and nothing here can be blamed for a layout that does
 * not add up.
 *
 * ---------------------------------------------------------------------------
 * WHY EVERY DISTANCE IS WRITTEN IN PX AND APPLIED AS A PERCENTAGE
 *
 * Because the arrivals own `x` and `y` on every [data-reveal] element on the
 * page, and GSAP folds x/y and xPercent/yPercent into ONE transform without
 * either pair overwriting the other. So depth is applied as xPercent/yPercent
 * throughout — converted from these px at refresh time against each element's
 * own box — and an entrance and a parallax can drive the same element with no
 * arbitration between them and no wrapper elements invented to keep them apart.
 * That is the whole reason this system needed no markup changes.
 *
 * The one consequence to keep in mind: an element inside a .stage is in that
 * stage's coordinates, and the stage is scaled to the window. So a depth of 40
 * on a funnel row is 40 stage units and lands as ~24-40 screen px depending on
 * the window — the same convention MOTION.glow.drift.shift already uses.
 *
 * ---------------------------------------------------------------------------
 * WHAT MAY BE ANIMATED, AND WHAT MAY NOT
 *
 * `depth` and `sway` are translations, which is the one transform the
 * compositor can apply to an already-rasterised layer for free.
 *
 * `swell` is a scale, and it is the one thing in this file with a price.
 *
 * Only on layers that contain no text, first of all — scaling a box full of
 * type re-rasterises every glyph in it on every frame of the scroll, which is
 * the same finding that took the growth out of the invite card and the step
 * cards (see MOTION.invite and MOTION.works). Every layer that carries it here
 * is a glow: an SVG bloom with no edge and nothing to read, and the one place
 * on the page where a scale reads as *depth* rather than as a thing getting
 * bigger.
 *
 * And then only on the section-sized ones. The two ambient layers that belong
 * to a stage rather than to a section (.stage-backdrop, behind the hero's fan
 * and the approve diagram) had it too, and it cost 14 frames a second: a
 * continuous scroll down the page ran at 44.8fps with them and 60.1 without,
 * everything else identical. They are 1828px and 2164px assets sitting inside a
 * stage that is already applying a scale of its own, and a second scale on top
 * of that, changing every frame, is a re-raster of the largest bitmap on the
 * page per frame. Nothing else here registered at all — the fades are free
 * (59.1 vs 58.9 with every one of them removed), and so is all the translation.
 *
 * Those two are no worse off for it. They keep the greatest depth and the
 * widest fade on the page, and the artwork inside them is *already* being
 * slowly scaled by glowDrift on a 14-second clock — which is the same gesture,
 * at a rate at which the raster is reused between frames instead of thrown
 * away.
 *
 * `fade` is opacity, and only on wrapper elements that no arrival touches —
 * .screen-glow, .stage-backdrop, .screen-copy. An arrival owns the opacity of
 * anything carrying [data-reveal], and two systems writing one property is a
 * fight neither wins.
 */

/** One layer of one section, and how far away it is. */
export type DepthLayer = {
  /** Queried inside the section. */
  find: string;
  /**
   * px at each end of the crossing, positive = further away. An array spreads
   * across the matched elements, which is how a row of three cards becomes a
   * row of three cards at three different distances.
   */
  depth?: number | number[];
  /**
   * Sideways, px, and SYMMETRIC — the same value at both ends rather than
   * mirrored. So a pair given opposing sways is apart as the section arrives,
   * together while it is being read, and apart again as it leaves: a diagram
   * that gathers and disperses rather than one that slides.
   *
   * Only ever inside something that clips horizontally. A rightward translate
   * is scrollable overflow, and a horizontal scrollbar on this page does more
   * than look wrong — it resizes the container queries the stages derive their
   * scale from, and moves every section below. See .screen in globals.css.
   */
  sway?: number | number[];
  /** Scale at both ends. Artwork only — see above. */
  swell?: number;
  /** Opacity at the two ends: [arriving, leaving]. Wrappers only — see above. */
  fade?: [number, number];
  /**
   * This layer is the section's ambient light rather than part of its content.
   *
   * The only thing that turns on: light is exempt from the guard that stops a
   * section's heading and its payload closing on each other (see PARALLAX.spend
   * and `fit` in parallax.ts). A bloom is behind everything, has no edge, and
   * already overlaps the heading at rest — it cannot collide with anything, so
   * measuring it against the heading would clamp it to nothing for no reason.
   */
  light?: true;
  /**
   * How much of this layer survives into the restrained tier — phones, and
   * windows too short to be given the full page. 0, the default, means it does
   * not run there at all.
   *
   * Almost everything is 0. What is left on a phone is the ambient light and
   * nothing else: a phone section is as tall as its contents rather than one
   * window, so its parts are not laid out with the slack that per-element
   * depth needs, and a diagram whose pieces drift relative to each other on a
   * 390px screen stops being a diagram. The light has no edges and no
   * relationships to break, so it can move — and it is the layer that carries
   * most of the effect anyway.
   */
  calm?: number;
};

export type SectionDepth = {
  /** Matches data-sequence-section in the markup. */
  id: string;
  /**
   * "exit" for the section that is already in the window when the page opens.
   * There is no arriving half to animate — it starts at rest, at the top — and
   * giving it one would mean the page opened part-way through its own parallax.
   */
  half?: "both" | "exit";
  /**
   * Everything in the section, scaled at once.
   *
   * This is where the page calms down. The reader meets the hero with fresh
   * eyes and leaves the last section having scrolled seven screens, and motion
   * that is exhilarating at the top is exhausting at the bottom — so the same
   * choreography is played quieter each time, ending at a little over half the
   * amplitude it started at. It is one number rather than seven sets of edited
   * distances so that the taper stays visible as a taper.
   */
  gain?: number;
  layers: DepthLayer[];
};

export const PARALLAX = {
  /**
   * The restrained tier: everything MOTION.enabled excludes, less anyone who
   * asked for reduced motion. Narrow OR short — the two halves of the full
   * gate — so between them the two queries cover every window exactly once.
   *
   * Nothing about the sequence runs here: no arrivals, no ambient loops, no
   * scrubbed fold. The page is delivered finished by the server and this adds
   * the one thing that still works when a section is a column of its own height
   * rather than a screen — light that does not move at the speed of the text
   * over it.
   */
  calm:
    "(prefers-reduced-motion: no-preference) and (max-width: 640px)," +
    "(prefers-reduced-motion: no-preference) and (max-height: 479px)",

  /**
   * The scrub's catch-up, in seconds, as a function of how far away a layer is.
   *
   * This is the part that turns a parallax into a physical one. A rigid scrub
   * ties every layer to the scrollbar exactly, and a page whose every element
   * is locked to the wheel with no give reads as a slideshow being dragged —
   * correct, and lifeless. A lag lets a layer trail the wheel and coast to a
   * stop after it, which is what mass looks like.
   *
   * Deriving it from `depth` rather than declaring it per layer is the whole
   * trick: the far layers are also the heavy ones, so the light behind a
   * section keeps drifting for a beat after the reader stops while the heading
   * over it has already settled. Two layers that differ only in rate read as
   * one plate sliding over another; two that differ in rate AND in how long
   * they take to stop read as two objects at two distances. The same idea, and
   * the same numbers within a rounding, as MOTION.hero.fold.lag.
   *
   * Quantised to `step` so that layers at similar distances share a scrub and
   * therefore share a ScrollTrigger: a section resolves to two or three of
   * them rather than one per element.
   */
  lag: { base: 0.2, per: 0.0022, max: 0.62, step: 0.1 },

  /**
   * How much of the space between a section's heading and its payload the depth
   * system may spend, as a fraction of it.
   *
   * The two move independently and they can move towards each other: in most
   * of them the heading is a near layer, so it drifts DOWN as the section
   * rises into the window, while something at the top of the payload is a far
   * layer drifting UP to meet it. The space they have to do that in is
   * --screen-gap, which is 3.2svh — 34px on a 1080-tall window and 23px on a
   * 720-tall one — and on the short window they ran straight through it.
   * Measured: the approve diagram's Squad card crossed 30px into "When one
   * member needs to spend above their limit" at 1440x720, 22px at 1512x850,
   * 31px at 1280x800, and nothing at all at 1440x900 or 1920x1080.
   *
   * So the distances in this file are what a section asks for, and `fit` in
   * parallax.ts is what it gets: on a window with room, all of it; on a short
   * one, whatever leaves this much of the gap still showing. The same bargain
   * `room` already strikes sideways, and the same one --stage-scale strikes
   * with the diagrams themselves.
   *
   * It is what may be SPENT, not what is kept: at 0.6 the two blocks may close
   * by six tenths of the space between them and four tenths of it survives.
   * Not 1, and not close to it — two blocks that just miss each other read as a
   * near miss, and the gap has to stay legible as a gap.
   */
  spend: 0.6,
} as const;

/*
 * ---------------------------------------------------------------------------
 * THE SEVEN SECTIONS, AND THE SIX TRANSITIONS BETWEEN THEM.
 *
 * There is no formula here and there deliberately is not one. Every section is
 * a different object — a fan of cards, a comparison, a diagram, three steps, a
 * funnel, one card, a form — and the layering follows what the section is
 * about, not what the section before it happened to do.
 */
export const SCENE: SectionDepth[] = [
  {
    /*
     * HERO → ALONE VS TOGETHER — you pass through the hero; its light stays.
     *
     * The hero does not leave. The reader goes past it, and the three things on
     * it part company on the way: the words are nearest and overtake the page
     * out of the top of the window, the card fan is carried off by the
     * choreography it already has, and the bloom behind all of it barely moves
     * at all — swelling slightly, as a light does when you sink into it, and
     * still burning at half strength when the next section's own light comes up
     * to meet it in the gap.
     *
     * That last part is the join. Alone Vs Together's bloom sits behind its
     * HEADINGS and arrives downwards from above (see SectionBloom), so what
     * happens across this boundary is one light handing over to another in the
     * same band of the screen rather than one room going dark and another
     * coming on.
     */
    id: "hero",
    half: "exit",
    layers: [
      /*
       * The furthest thing on the page, and the slowest to stop. 150 against
       * the copy's -95 is a quarter of a window of separation between the front
       * and the back of the hero by the time it is gone.
       */
      {
        find: ".stage-backdrop",
        depth: 150,
        fade: [1, 0.5],
        calm: 0.4,
        light: true,
      },
      /*
       * Nearest, and the only layer on the page that fades out almost
       * completely. The headline and the two CTAs are the one piece of content
       * the reader is done with the moment they scroll — everything else on the
       * page is something they may scroll back up to.
       */
      { find: ".screen-copy", depth: -95, fade: [1, 0.1] },
      /*
       * .screen-payload is deliberately absent.
       *
       * It holds the card fan, and the fan already has the most specific exit
       * on the page: as the reader scrolls off the hero the four passport cards
       * fold back in behind the Squad card and are gone (heroFold), leaving the
       * product alone on the screen. That IS this section's foreground exit,
       * and it says far more than a translate would — a payload that merely
       * drifted upwards a little faster than the page, underneath a fold, would
       * be two answers to the same question.
       */
    ],
  },

  {
    /*
     * ALONE VS TOGETHER → SQUAD APPROVES — the comparison comes apart.
     *
     * The section is one argument: alone you fall short, together you qualify.
     * So the two panels are not at the same distance. "Alone" is the near one
     * and it leaves first; "Together" sits further back and is the last thing
     * out of the window. Scrolling off this section therefore does the thing
     * the section is claiming — the two are read as a pair while they are in
     * front of you and separate as you go, and the one that survives is the one
     * the page is arguing for.
     *
     * It costs two numbers with opposite signs, and it is the reason this
     * section is not simply "two cards that rise".
     */
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
      /* Slightly behind, not ahead: the heading here belongs to the light — it
         is lit from directly behind — so it travels with it rather than with
         the panels below. */
      { find: ".screen-copy", depth: 30 },
      { find: "[data-reveal='card-left']", depth: -46 },
      { find: "[data-reveal='card-right']", depth: 34 },
    ],
  },

  {
    /*
     * SQUAD APPROVES → HOW SQUAD WORKS — the group closes around the decision.
     *
     * The diagram is a request on the left, a vote list on the right and the
     * Squad card between them. Give the outer two an equal and opposite `sway`
     * and the whole thing gathers as it comes into the window and disperses as
     * it leaves, with the middle given no sway at all to be the thing they
     * gather on — which is a picture of exactly what the section says happens.
     * (It has plenty of depth; it is sideways that it does not move.) It is
     * also the only place on the page
     * where a horizontal move is safe and earns its keep: the stage clips on
     * both axes precisely so its contents can start off the edge.
     *
     * The ledger underneath sits further back still, because it is the record
     * rather than the event — and the Squad card at the centre is deeper than
     * either, so the diagram comes away from it rather than the other way
     * round.
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
      { find: ".screen-copy", depth: -40 },
      { find: "[data-reveal='request']", depth: -56, sway: -26 },
      { find: "[data-reveal='votes']", depth: -56, sway: 26 },
      { find: "[data-reveal='ledger']", depth: 40 },
      /*
       * And the card itself is the deepest thing in the diagram — the only
       * payload on the page set further back than the record underneath it.
       *
       * That is the whole reason for the arrangement: the request and the votes
       * are near and leave first, the ledger follows, and the Squad card they
       * are all pointed at is the last thing out of the window. The section
       * gathers around a decision on the way in and comes away from it on the
       * way out, and the thing being decided about is the thing that stays.
       */
      { find: "[data-reveal='squad']", depth: 46 },
    ],
  },

  {
    /*
     * HOW SQUAD WORKS → INTELLIGENCE LAYER — three steps in a row become three
     * steps at three distances.
     *
     * The one thing this section has that no other does is ORDER: it is 1, 2, 3
     * laid out left to right, and the arrival already says so with a stagger.
     * Depth says it a second way and says it for the whole time the section is
     * on screen rather than for a second and a half — the first card is nearest
     * and the third furthest, so the row is read as receding and the eye starts
     * where the numbering does without being told to.
     *
     * The array is the whole mechanism: one entry per card, in document order.
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
      { find: ".screen-copy", depth: -35 },
      { find: "[data-reveal='step']", depth: [-38, 0, 38] },
    ],
  },

  {
    /*
     * INTELLIGENCE LAYER → INVITE YOUR SQUAD — the funnel telescopes.
     *
     * Four rows, each drawing itself into the one below: scores, then signals,
     * then the engine, then the verdict. The arrival builds it top to bottom.
     * Depth turns that chain into a tunnel — the raw readings at the top are
     * nearest, and each row below sits a little further back, so the funnel
     * narrows away from the reader in space as well as on the page. The verdict
     * is the deepest thing in the section and the last to leave it, which is
     * the right order for a conclusion.
     *
     * The aura is left to move on yPercent alone: glowDrift owns its x, y and
     * scale for the life of the section, and the percentage pair is what lets
     * this share the element without arbitration.
     */
    id: "intelligence",
    gain: 0.8,
    layers: [
      { find: "[data-reveal='aura']", depth: 140, light: true },
      { find: ".screen-copy", depth: -30 },
      { find: "[data-reveal='member']", depth: -40 },
      { find: "[data-reveal='signals']", depth: -12 },
      { find: "[data-reveal='hub']", depth: 30 },
      { find: "[data-reveal='verdict']", depth: 55 },
    ],
  },

  {
    /*
     * LIFE INSIDE SQUAD → INVITE YOUR SQUAD — a week, laid out flat.
     *
     * The funnel above this was a tunnel; this is the opposite arrangement and
     * is layered to say so. Nothing here is behind anything else: the two cards
     * on the top row are both NEAR layers, drifting up out of the window a
     * little faster than the page does, and the ledger under them is the one
     * thing set back — it is the summary the two above it add up to, so it
     * lingers while they leave.
     *
     * The two are swayed apart rather than given different depths, because they
     * are a pair and a pair that separates in Z reads as one of them being
     * wrong. Sideways they simply open and close, which is what a pair does.
     * Safe here because the stage clips both axes — see .stage-viewport-clip.
     */
    id: "life",
    gain: 0.74,
    layers: [
      { find: "[data-reveal='aura']", depth: 120, light: true },
      { find: ".screen-copy", depth: -30 },
      { find: "[data-reveal='lane']", depth: -36, sway: -14 },
      { find: "[data-reveal='cover']", depth: -36, sway: 14 },
      { find: "[data-reveal='health']", depth: 46 },
    ],
  },

  {
    /*
     * INVITE YOUR SQUAD → EARLY ACCESS — the machine hands off to a person.
     *
     * After the funnel this section is deliberately still. It is one card with
     * a QR code on it and it wants to look planted, not passing through, so it
     * is the only payload on the page set BEHIND its own heading: the card
     * lingers while the words over it move on. The four things on the card
     * drift a hair the other way, which is enough to stop the card reading as a
     * single flat rectangle without anything on it appearing to come loose.
     *
     * The gain drops hardest here — this is where the page starts landing.
     */
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
      { find: ".screen-copy", depth: -28 },
      { find: "[data-reveal='card']", depth: 30 },
      { find: "[data-reveal='item']", depth: -14 },
    ],
  },

  {
    /*
     * EARLY ACCESS → the footer. The page settles.
     *
     * The calmest section by a distance, and the only one that leads with its
     * artwork rather than a heading, so the card is the near layer and the form
     * under it barely moves at all — nobody should be reading a label that is
     * drifting relative to the field it names.
     *
     * The two blooms behind the card are given different depths on purpose:
     * they are drawn as a front and a back (glow-front.svg, glow-back.svg) and
     * this is the one place on the page where two pieces of the same light can
     * be separated in space, which is what stops them reading as one flat
     * decal.
     */
    id: "early",
    gain: 0.55,
    layers: [
      {
        find: "[data-reveal='glow']",
        depth: [150, 105],
        calm: 0.3,
        light: true,
      },
      { find: "[data-reveal='card']", depth: -28 },
      { find: ".screen-copy", depth: -12 },
    ],
  },
];
