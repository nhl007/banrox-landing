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
   * any disagreement either flashes the finished page or strands it blank — and
   * to the queries that make a section one screen, since a section that is not
   * a screen cannot honestly be animated on one trigger.
   *
   * 641px is the top of the phone range — below it the page is rebuilt as a
   * column that was designed for a phone rather than a desktop folded into one,
   * and none of this runs. Above it a tablet gets the same page, scaled.
   *
   * The height half is what a phone held sideways fails: 932x430 passes the
   * width test, and at that height the heading is most of the window, so the
   * card fan fitted into what was left came out at 0.076 scale. Measured. See
   * the note above .screen in globals.css.
   */
  enabled:
    "(min-width: 641px) and (min-height: 480px) and (prefers-reduced-motion: no-preference)",

  /**
   * Every beat's timeScale. The numbers below are written as the proportions
   * they were tuned at; this is what turns them into a pace.
   */
  pace: 2.5,

  /* --- the navigation rail ---------------------------------------------- */

  /**
   * The lit marker on the rail of dots, travelling from the section you were on
   * to the section you asked for.
   *
   * One light that moves rather than two that swap: a dot going out while
   * another comes on is two events, and the reader has to work out that they
   * were the same one. Something that travels the distance says it for them,
   * and on a rail seven dots long the distance is the only thing that tells you
   * how far you just went.
   *
   * The squash is what stops it reading as a sprite being repositioned. It
   * stretches along the direction of travel as it leaves and rounds out as it
   * lands — the oldest trick there is, and the reason this feels like a bead of
   * light rather than a div with a new `top`.
   */
  rail: {
    travel: { duration: 0.55, ease: "power3.inOut" },
    /** Thrown forward: taller than it is wide, for the length of the trip. */
    squash: { scaleY: 1.9, scaleX: 0.68, duration: 0.2, ease: "power2.out" },
    /** And rounding out at the far end, overshooting just enough to land. */
    settle: { duration: 0.5, ease: "elastic.out(1, 0.55)" },
    /**
     * The lit part of the rail, growing from the first dot to the current one.
     *
     * The ring says which section you are on; this says how far through you
     * are, in seven steps rather than in the scrollbar's continuous inch. Slower than the ring on purpose — the ring is the thing
     * you asked for and should feel immediate, the line is the consequence and
     * can take its time catching up.
     */
    fill: { duration: 0.7, ease: "power2.out" },

    /**
     * The dots swelling towards the pointer, largest under it and falling away
     * either side.
     *
     * The rail is eight targets 5px across in a 22px column, which is a hard
     * thing to hit and an unrewarding thing to try. Magnifying under the
     * pointer makes the whole column behave like one control that knows you are
     * there, and makes the dot you are about to press the biggest thing on it
     * before you press it.
     *
     * Squared falloff rather than linear: linear spreads the effect evenly over
     * `reach` and the rail bulges as a whole, where squaring keeps it tight
     * around the pointer and reads as one dot rising rather than half of them
     * drifting.
     */
    magnet: { max: 2.4, reach: 58, duration: 0.4, ease: "power3.out" },
  },

  /* --- navbar ----------------------------------------------------------- */

  navbar: {
    /**
     * Hinges on its top edge, so it drops in rather than just sliding down.
     * The page opens on it: it is the first thing that moves, and the hero's
     * copy waits on it (see hero.afterNav).
     */
    drop: { duration: 1.5, ease: "power1.out" },
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

  /** Copy everywhere: fades up from `enter.from` as it rises. */
  copy: { rise: 60, duration: 1.5, stagger: 0.1, ease: "power1.out" },

  /* --- how everything arrives ------------------------------------------- */

  /**
   * The one gesture every section arrives with, and the whole of it: a short
   * move and a fade. Nothing grows.
   *
   * Each section used to arrive its own way — panels flown in from off the
   * viewport edges, cards scaled up out of nothing with a hop, a ledger pushed
   * up from under the stage floor, chips popping on a `back` ease. Seven
   * different ideas about what "arriving" means, and the two loudest of them
   * (travelling in from off screen, and growing from zero) are also the two that
   * read worst: a card crossing half the window draws the eye to the journey
   * rather than the thing, and a card scaled from nothing is unreadable for most
   * of its own entrance and drags a re-raster of every glyph inside it along
   * behind. What is left is the smallest thing that still says "this arrived".
   *
   * `shift` is sideways, and only for pieces whose place in a diagram is
   * genuinely left or right — the request card and the vote list either side of
   * the Squad card. It is a nudge that resolves, not a journey: the piece is on
   * screen and legible for the whole of it.
   *
   * `lift` is upwards, for everything else, and matches the heading's own
   * `copy.rise` closely enough that a payload and the words above it read as one
   * block settling rather than two things moving at different speeds.
   *
   * `from` is not 0. A section that arrives out of nothing scrolls into view as
   * an empty screen and then fills it, which on a page of full-height sections
   * means every one of them is blank for the moment it appears. A fifth of the
   * way up, the whole composition is there to be read as it comes in and the
   * entrance is it coming into focus.
   */
  enter: { from: 0.2, shift: 80, lift: 56 },

  /**
   * A section's ambient glow: the soft bloom behind whatever that section is
   * about.
   *
   * Not new artwork. Four of the seven screens already carried one — the bloom
   * and band behind the hero's card fan, the halo behind the approve diagram's
   * Squad card, the aura behind the intelligence funnel, the pair behind the
   * Early Access card — and the other three now use the same asset (see
   * SectionBloom). What is new is that all of them move: they arrive from a
   * direction rather than fading up in place, and they never settle afterwards.
   *
   * `travel` is how far a glow comes in from, along its section's own direction
   * (data-glow-from in the markup). It is a good deal further than the `shift`
   * and `lift` a card or a panel arrives on, and can afford to be: a bloom has
   * no edge, no text and nothing to read, so a distance that would be a journey
   * on a card is barely a movement on this. What it buys is the only thing that
   * says which way the light came from.
   */
  glow: {
    travel: 140,

    /**
     * And then it never quite settles.
     *
     * These are the numbers the hero's bloom has always drifted on, now shared
     * by every section's. Slower than anything else on the page by a factor of
     * four, and deliberately: this is the largest thing on the screen, so the
     * speed at which it may move is set by what it costs to be noticed. At a
     * quarter of a minute a crossing it is barely a movement at all — the light
     * is simply never quite where it was, which is the difference between a lit
     * backdrop and a painted one. Anything appreciably quicker becomes a lava
     * lamp behind the copy.
     *
     * `stagger` offsets each layer's start so a pair never swells together, and
     * `step` gives each its own period on top of that — 14s, 17s, 20s — so
     * layers that begin out of phase never fall back into it however long the
     * page is left open. Layers also travel in opposite directions (see
     * glowDrift), which is what turns two overlapping ellipses into light that
     * shears slowly across itself instead of one plate sliding about.
     *
     * `shift` is in whatever space its glow lives in — stage units for the four
     * that belong to a diagram, section pixels for the three that do not — and
     * the stages sit near enough to 1:1 at desktop widths for one number to
     * serve both.
     *
     * Transform only: the arrival owns their opacity, and these elements have
     * nothing inside them to re-raster.
     */
    drift: {
      scale: 1.06,
      shift: 26,
      duration: 14,
      step: 3,
      stagger: 3.5,
      ease: "sine.inOut",
    },
  },

  /**
   * The Squad card's journey from the hero to the approve diagram.
   *
   * The one piece of motion on the page the reader performs rather than
   * watches: it has no duration, only a distance, and every frame of it is
   * theirs. That is the right choice for this and the wrong one for everything
   * else here — a card arriving or a wire drawing is an event, and an event
   * scrubbed backwards and forwards by a scrollbar stops being one. This is not
   * an event. It is an object with a position, and where it is ought to be a
   * function of where the reader is.
   *
   * `dim` is what it fades to for the middle of the trip. Not zero: a card that
   * disappears has not gone anywhere, and the whole point is that it is still
   * there, behind the sections, on its way. A tenth is enough to follow if you
   * look for it and not enough to compete with anything in front of it.
   *
   * `out` and `in` are the fractions of the journey spent dimming at the start
   * and coming back at the end, so most of it is spent at `dim` and the two
   * hand-overs are quick — the card is only ambiguous about which thing it is
   * for a moment at either end.
   *
   * `lag` is the scrub's catch-up, in seconds. A rigid scrub locks the card to
   * the scrollbar and it reads as a scrollbar, so it trails a fraction behind
   * the wheel: enough weight to look like an object being carried down the page
   * rather than a value being written to a style attribute.
   *
   * `sag` is how far the card falls below the straight line between the two
   * slots, at the middle of the trip, in px.
   *
   * Without it the path is a straight line, and a straight line here does not
   * look like travelling. The two slots are 1714px apart on a page that scrolls
   * 2100px between them, so a card moving evenly along that line drifts UP the
   * window the whole way — correct, and the opposite of what it should read as.
   * A sag bends the first half of the trip downwards past the scroll, so the
   * card visibly sinks away from the hero before it is drawn back up into the
   * approve diagram's slot. Measured, at 260: it falls ~90px through the window
   * over the first quarter and is lifted back over the last.
   *
   * `settle` is how long the journey's start point waits to be measured — long
   * enough for the hero's entrance to be over, because the card it sets off
   * from spends that entrance lying flat and turned on its side and its
   * bounding box mid-turn is not where it ends up. Comfortably past the hero's
   * own arrival at this pace; it costs nothing to be late, because until then
   * there is nothing to scroll past.
   */
  trail: { dim: 0.1, out: 0.12, in: 0.12, lag: 0.6, settle: 2.5, sag: 260 },

  /* --- hero ------------------------------------------------------------- */

  hero: {
    buttons: { duration: 1.5, stagger: 0, ease: "power1.out" },
    note: { duration: 1, ease: "power1.out" },
    glow: { duration: 1.5, ease: "power1.out" },

    /**
     * How long the hero's copy waits for the navbar. Both are on screen at load
     * so both would otherwise fire at once; this is what makes the page open in
     * the order it reads — the bar arrives, then the words under it. Shorter
     * than the drop itself on purpose: they overlap rather than queue.
     */
    afterNav: -1.5,

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
    afterCopy: -1.5,

    /** How far back the stack sits while flat, and the rise to upright. */
    depth: -180,
    lift: { duration: 2, ease: "power1.out" },

    /**
     * The Squad card starts lying flat AND on its side — landscape, the way a
     * card actually sits on a table, and the same horizontal pose the CTAs
     * above it start in. +90 here reads as a counter-clockwise quarter turn on
     * the way to 0, because CSS rotation is positive-clockwise.
     */
    turn: 90,

    /** The fan-out from behind the Squad card, once the stack is upright. */
    fan: { duration: 2, stagger: 0.2, ease: "power1.out" },

    /**
     * And the fan closing again on the way out, scrubbed by the scroll rather
     * than played — see heroFold.
     *
     * `out` is how much scrolling it takes, as a fraction of the window: the
     * four cards are folded away by the time the reader has moved this far, and
     * only then does the Squad card start down the page. Enough to be a
     * movement in its own right rather than a flicker as the hero leaves, and
     * short enough that it is over well before the hero itself is.
     *
     * `stagger` is a good deal tighter than the fan's own 0.2. Opening, the
     * four cards are the event and each one wants to be seen arriving; closing,
     * they are getting out of the way of the card that carries on, and a long
     * stagger there just holds the hero open.
     */
    fold: { out: 0.6, stagger: 0.12 },

    /**
     * The four passport cards, breathing, once the fan has finished opening.
     *
     * They are the subject of the section and they were dead the moment they
     * landed — a still photograph of four cards, held for as long as anyone
     * stayed on the page. This is what keeps them alive without asking anything
     * of the reader.
     *
     * Deliberately tiny, and deliberately NOT in step. `rise` is under half a
     * card's corner radius, which is not enough to read as any card doing
     * anything in particular — what it reads
     * as is a stack that is being held rather than printed. Four cards moving
     * the same distance at the same moment would be one slab; the spread on
     * `each` is what makes them four objects.
     *
     * `each` is not a divisor of `duration`, so the four never fall back into
     * phase with each other however long the page is left open.
     *
     * The Squad card in the middle is left out of it on purpose, and gets that
     * for free: it is [data-fan-anchor], not [data-reveal='card']. It is the
     * product, the other four are files about people, and holding it still is
     * what makes the four look like they are gathered around it.
     *
     * y only — the entrance owns opacity and x, so the two never write the same
     * property, and a translate is the one transform the compositor can apply
     * without redrawing anything inside the card. A tilt used to go with it and
     * had to come out: it flickered. See heroFloat.
     */
    float: {
      rise: 9,
      duration: 3.4,
      each: 0.55,
      ease: "sine.inOut",
    },
  },

  /* --- alone vs together ------------------------------------------------ */

  alone: {
    /**
     * How far below their place the two panels start — its own value rather
     * than `enter.lift`, because these are the two largest objects on the page
     * and a distance that reads as a nudge on a 230px card barely registers on
     * a 628px one.
     *
     * They used to come in from the left and right edges of the viewport, which
     * meant working out at runtime how far off-screen "off-screen" actually was
     * at the stage's current scale, and then flying two 600px cards most of the
     * way across the window on every arrival. A rise says the same thing —
     * these are arriving — with none of the travel, and reads as one pair
     * settling into place rather than two objects thrown in from opposite
     * sides.
     */
    lift: 100,
    cards: { duration: 1.5, stagger: 0.1, ease: "power1.out" },
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
      count: { duration: 2.6, ease: "power2.out" },
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
     * All four pieces of the diagram move together, on the heading's own clock —
     * see `inStep` in timelines.ts. That is the whole idea of the section, a
     * group acting as one, and it only reads if the diagram arrives as a single
     * object rather than as four elements taking turns.
     *
     * There is nothing left to configure here for the arrival itself. The
     * request card takes `enter.shift` to the left and the vote list the same to
     * the right, because left and right is what they are; the Squad card between
     * them and the ledger under them take `enter.lift`. Every one of them fades
     * from `enter.from`, and none of them scales.
     *
     * What that replaced: the two cards used to be flown in from past the
     * *viewport* edges, a distance that had to be re-derived at runtime from the
     * stage's current scale, and the Squad card scaled up from nothing with a
     * hop because it was the one piece with nowhere to travel from. The stage is
     * clipped on both axes precisely so those journeys could happen off screen.
     * None of it is needed for a nudge.
     */

    /** The ambient bloom behind the card, which has no edge and only fades. */
    glow: { duration: 1.1, ease: "power1.out" },

    /** The ledger counts itself in, one member at a time. */
    chips: { duration: 0.8, stagger: 0.3, ease: "power2.out" },
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
    lines: { duration: 1, ease: "none" },
    spark: { duration: 3, ease: "none" },
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
     * The three step cards lift and fade in, on the heading's clock, one after
     * the other.
     *
     * The stagger is the only thing this section keeps for itself, and it is
     * the point of it: these are three sequential steps, and landing them in
     * order is the one thing on the screen that says so. Everywhere else the
     * parts of a diagram arrive together.
     *
     * They used to scale up out of nothing with an 86px hop, which had a
     * geometry problem on top of the readability one: a card is exactly as tall
     * as the stage that holds it, so any ease overshooting past 1 sheared its
     * top and bottom off and, sideways, pushed past the stage's own width — at a
     * viewport near 1240 that raises a scrollbar inside .stage-viewport, which
     * resizes the container query the sizer derives its height from and moves
     * every section below it. A lift cannot do any of that.
     */
    stagger: 0.14,
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
    /*
     * Only the staggers are the funnel's own. Every row now moves on the
     * heading's duration and ease — see `inStep` in timelines.ts — so the four
     * rows are one thing being assembled at one rate rather than four with
     * their own ideas (1s for the members, 1.2 for the aura, 1s for the signal
     * container, 0.6 for the cards inside it, 1.5 for the hub and the verdict).
     *
     * What is still staggered, and why: the four member cards are four separate
     * readings, and the four category cards are four things filling one box.
     * The hub and the verdict are single objects and had a stagger that could
     * never apply to anything.
     */
    memberStagger: 0.1,

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
     * `stagger` deliberately repeats memberStagger rather than deriving from
     * it: matching it is what keeps each number counting inside the card that
     * is arriving, instead of a second wave crossing the row at its own speed.
     * They agree; they are not the same value.
     */
    figures: {
      count: { duration: 1.4, ease: "power1.out" },
      meter: { duration: 1.4, ease: "power1.out" },
      stagger: 0.1,
      /**
       * When the first card's readout starts, in seconds into the beat — held
       * just long enough that the card is legibly on its way in before the
       * number inside it starts moving.
       */
      after: 0.3,
    },

    /**
     * The four category cards, which fill the signal container rather than
     * arriving with it.
     *
     * The container is the one thing in the funnel that is a container — the
     * row above it is four separate cards and the hub below is one object — so
     * it is the one place the diagram can show something being assembled
     * instead of delivered. Riding in as a single slab spends that for nothing.
     *
     * A short rise and a fade, like everything else. They used to scale from
     * 0.94 on a `back` ease so they read as dropping into a slot; the overshoot
     * was safe here by a wide margin, but it was the last grow left in the
     * section and four cards popping under a heading that only rises is the
     * inconsistency you notice.
     *
     * Their own rise rather than `enter.lift`: these are 230px cards filling a
     * container that is itself arriving, so they travel a fraction of what the
     * container does.
     */
    cardRise: 16,
    cardStagger: 0.1,

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
  },

  /* --- squad invitation ------------------------------------------------- */

  invite: {
    /**
     * The card lifts and fades in, then fills: QR, invite link, copy, CTA.
     *
     * It used to rise 160px while growing from 0.88 on a `back` ease. The rise
     * is now `enter.lift` like everything else and the growth is gone — this is
     * the largest single card on the page, and scaling it was re-rastering a QR
     * code, four rows of type and a button on every frame of its own entrance.
     */
    itemRise: 22,
    /*
     * The only thing this section keeps for itself. The card's duration (1.2s)
     * and the items' own (0.55s) are gone: everything here now runs on the
     * heading's clock — see `inStep` in timelines.ts — so the words, the card
     * and the four things on the card are one movement.
     *
     * They had been three. The card ran 1.2s against the heading's 1.5s, and the
     * items were queued at "-=0.35" on a 0.55s tween of their own, so they set
     * off at 0.85 and were still arriving at 1.79 — the card landed, then its
     * contents caught up inside it.
     */
    itemStagger: 0.13,
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
    /*
     * The card lifts `enter.lift` like every other payload. It used to start
     * 440px down — a little over a third of a viewport, far enough to be off the
     * bottom edge when it set out — which is exactly the kind of journey the
     * shared gesture replaced.
     */
    card: { duration: 3, ease: "power3.out" },

    /**
     * How far below its place each part of the section starts.
     *
     * Four different distances on purpose: the card travels furthest because it
     * is the thing being watched, and everything else travels less the closer it
     * sits to where it ends up. They all take the SAME time to do it — see
     * `card` above, which every one of them now runs on — so the four move at
     * four different speeds and arrive on one frame, which is what makes them
     * read as one panel rising rather than four things racing.
     */
    cardRise: 300,
    copyRise: 200,
    fieldRise: 200,
    ctaRise: 100,

    /*
     * Only the staggers are the parts' own. The durations and eases that used to
     * live here (fields at 1s/power3.out, the CTA at 1.5s/back.out) are gone:
     * two of the three things rising beside the card finished before it did, and
     * a back ease on the CTA meant it overshot and settled while the card was
     * still travelling. Matching the card is the whole point.
     */
    copyStagger: 0.1,
    fieldStagger: 0.12,
  },
} as const;
