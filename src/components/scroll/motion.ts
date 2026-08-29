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
   * The wide tier: one section, one window, one trigger.
   *
   * It MUST stay in step with the @media guard on [data-reveal] in globals.css
   * — that rule holds the pre-hydration state, so any disagreement either
   * flashes the finished page or strands it blank — and with the queries that
   * make a section one screen, since a section that is not a screen cannot
   * honestly be animated on one trigger.
   *
   * 641px is the top of the phone range. Above it a tablet gets the same page,
   * scaled; below it the page is rebuilt as a column that was designed for a
   * phone rather than a desktop folded into one, and it gets `phone` instead.
   *
   * The height half is what a phone held sideways fails: 932x430 passes the
   * width test, and at that height the heading is most of the window, so the
   * card fan fitted into what was left came out at 0.076 scale. Measured. See
   * the note above .screen in globals.css.
   */
  enabled:
    "(min-width: 641px) and (min-height: 480px) and (prefers-reduced-motion: no-preference)",

  /*
   * The phone tier: the same beats, one trigger each.
   *
   * Everything the sequence does still happens down here — the cards still
   * arrive, the figures still count, the wires still draw, the light still
   * drifts — but WHEN it happens is decided a beat at a time rather than a
   * section at a time, because on a phone a section is not a screen.
   *
   * That is the whole difference, and it is forced. A wide section is exactly
   * one window tall, so one trigger on its top edge is a moment that covers all
   * of it; the same section on a phone is a column of its own height — 1271px
   * of Life Inside Squad in an 844px window — and a single trigger at its top
   * edge would spend the whole of it while two thirds was still below the fold.
   * The page already had the answer for the parts of a WIDE section that fall
   * past the fold (see Beat.own), and on a phone every beat is in that
   * position, so every beat gets what `own` gives: a trigger of its own, on the
   * first thing it moves, at `own.line`.
   *
   * Complementary to `enabled` on the width and identical on everything else,
   * so between them the two tiers cover every window that animates exactly
   * once — which is what lets the stylesheet's guard be their union. Below 480
   * tall is not either of them: see the note there.
   */
  phone:
    "(max-width: 640px) and (min-height: 480px) and (prefers-reduced-motion: no-preference)",

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
   * Where a beat that carries its own trigger fires — see Beat.own in
   * sections.ts.
   *
   * A section's trigger is about the SECTION: it fires when the top edge is a
   * quarter of the way up the window, which is the right moment for a heading
   * and the wrong one for anything at the foot of a full-height screen. The
   * strength rails at the bottom of the comparison panels were 591px below the
   * fold when their section fired, and the approve ledger 471px; both had run
   * to completion before the reader had scrolled far enough to see either.
   * Measured at 1440x900.
   *
   * This is about the ELEMENT instead: where down the window its top edge has
   * to reach, as a fraction of the window's height. Deliberately late — a
   * sixth of the way up from the bottom, so the thing is just clearing the fold
   * as it starts. Earlier and it is back to animating below the fold; later and
   * the reader has been looking at it, settled, for a moment before it moves.
   *
   * A fraction rather than one of ScrollTrigger's "top 85%" strings, because
   * those are resolved against wherever the element IS at refresh, and at
   * refresh every one of these is parked at its arrival's start state — 100px
   * low on the comparison panels, 56 on the ledger. Measured: the rails' own
   * trigger came out 118px late and fired with the rail already two thirds of
   * the way up the window. The controller resolves this against where the
   * element rests instead. See authoredTop.
   *
   * The phone tier fires EVERY beat this way, on the same line — see
   * MOTION.phone. Deliberately the same number rather than one of its own: a
   * beat wants to start as its subject clears the fold, and that is a fact
   * about the beat and the reader rather than about how wide the window is.
   */
  own: { line: 0.85 },

  /**
   * A section's ambient glow: the soft bloom behind whatever that section is
   * about.
   *
   * Not new artwork. Five of the eight screens already carried one — the bloom
   * and band behind the hero's card fan, the halo behind the approve diagram's
   * Squad card, the aura behind the intelligence funnel, the one over the three
   * cards of Life Inside Squad, the pair behind the Early Access card — and the
   * other three now use the same asset (see SectionBloom). What is new is that all of them move: they arrive from a
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

  /* --- the travelling Squad card ----------------------------------------- */

  /*
   * One card, three docks, four thousand pixels of page.
   *
   * The Squad card is drawn three times — the front of the hero's fan, the
   * middle of the approve diagram, flat over the Early Access form — and it is
   * the same object every time. This is what carries it between them, scrubbed
   * by the reader rather than played at them, because where an object IS ought
   * to be a function of where the reader is. See squadTravel in timelines.ts
   * for the path and .squad-trail in globals.css for where it paints.
   *
   * ---------------------------------------------------------------------------
   * THE ARITHMETIC THAT DECIDES THE WHOLE SHAPE
   *
   * Between two docks the card must advance exactly as much PAGE as the reader
   * scrolls: 4988px of page over 4358px of scroll on the long leg at 1440x900,
   * a ratio of 1.14. An average rate of about one is a card glued to the
   * WINDOW — and no easing between two endpoints escapes it, because easing
   * only redistributes the same net rate. Interpolated straight, the card sits
   * within 150px of one viewport position for five and a half screens, parked
   * over four sections it has nothing to do with. That is the failure, it is
   * the DEFAULT, and pushing the card further away makes it worse rather than
   * better: in this page's own vocabulary a far layer is one that moves LESS
   * than the page, which is to say one that hangs in the window.
   *
   * All the freedom is in how the rate is DISTRIBUTED. So:
   *
   *   the card holds its place on the page while a section is being read,
   *   and falls a whole section's worth in the seam between two.
   *
   * It is the page's own rhythm rather than one imposed on it — the seams are
   * measured, not assumed, which is what lets the same rule serve a phone where
   * a section is two or three windows tall and the seam is 96px of padding
   * rather than 144px of margin. And it produces both halves of every hand-off
   * from one sentence: a release is the section leaving while the card stays, a
   * catch is the section arriving while the card stays. Which is heroFold's
   * closing argument — the four passports fold in and leave the product alone
   * on the screen — said again at every anchor.
   */
  travel: {
    /**
     * How far ABOVE the top of the window the card retreats to between two
     * seams, as a fraction of the window.
     *
     * Above the top, not near it, and that is the whole of what keeps this off
     * the reader's screen while they are reading. Measured with the card
     * resting a sixteenth of a window DOWN instead: at 1440x900 it sat across
     * the Intelligence Layer's badge and the first line of its heading for the
     * length of that section — a grey rectangle over the two things the section
     * opens with, which is precisely the failure this whole shape exists to
     * avoid.
     *
     * A wish rather than an instruction. The path is clamped so the card can
     * never move UP the page, and that caps how far it may climb back in the
     * scroll one hold has. Above the gate the pitch is 1044 against a 900px
     * window and the clamp binds: the card comes to rest exactly where the seam
     * before it left it, which is a twelfth of a window above the top edge —
     * and since what is placed is its centre, and in transit it is barely a
     * hundred pixels tall, that is the whole card clear of the window. On a
     * phone, where a section can be three windows, there is scroll to spare and
     * the wish is granted outright. Both are the same rule taking what the
     * layout will give it — the bargain `room` already strikes sideways and
     * `--stage-scale` strikes with the diagrams themselves.
     *
     * Where the clamp binds, the card is exactly stationary on the page for the
     * length of that hold. Worth avoiding if anyone could see it; nobody can,
     * because the clamp binding is the same fact as the card being off the top
     * of the window.
     */
    lift: 0.1,

    /**
     * How long the hero holds the card after it has been let go, as a fraction
     * of the window — the hand-over, and the reason there is one.
     *
     * The hero is the one dock where the page's own card starts visible and has
     * to be taken from it, and the two cannot simply cross-fade: they are the
     * same card, so the moment the traveller starts falling they are in two
     * different places, and a cross-fade between two positions is two cards.
     * Screenshotted at 1440x900 with the fade run against the fall — the hero's
     * card half gone at the top of the window and the traveller two thirds of
     * the way down it, both translucent, unmistakably a pair.
     *
     * So the fall waits. For this much scroll after the release the traveller
     * is pinned to the hero's slot, and the whole exchange happens there: the
     * traveller comes up first, under a card at full strength in exactly the
     * same pose, and only then does the hero let go. Nothing is in two places
     * at once because nothing has moved yet.
     */
    handover: 0.08,

    /**
     * The fastest the card may fall, as a multiple of the reader's scroll.
     *
     * Not a speed limit on the path — it is the test an appointment has to pass
     * to be kept. A seam the card cannot both reach and leave at this rate is
     * one the layout has put too close to a dock, and the dock is the half that
     * has to be exact; so that seam is dropped and the card simply falls
     * through it on its way somewhere else.
     *
     * At two and a half the card descends the window at one and a half times
     * the speed the page rises through it, which is the fastest anything on
     * this page moves and about as fast as a fall can be and still be watched.
     */
    dash: 2.5,

    /**
     * How the falls change character down a leg: the first hangs a moment
     * before it commits, the last lets go early and glides in.
     *
     * A power applied to each fall's own progress before it is eased. Above
     * one the card leaves the top of the window late and arrives quickly;
     * below one it leaves promptly and spends the whole descent settling onto
     * the seam. Ramped from `1 + cadence` at the head of a leg to `1 - cadence`
     * at its foot, so no two crossings have the same shape and the journey
     * calms as it goes down the page — the argument `taper` makes about
     * brightness, made about time.
     *
     * It cannot move a knot and cannot break the path's monotonicity: a power
     * of a number between zero and one is a number between zero and one, and
     * it is zero at zero and one at one. Every dock stays exact.
     *
     * Deliberately small. The falls are already the loudest thing the card
     * does; this is the difference between four of them and four DIFFERENT
     * ones, not between one gesture and another.
     */
    cadence: 0.15,

    /**
     * The hand-over at a dock, as a fraction of the window — how long the
     * section's own card takes to come up over the traveller, and to go back
     * down before it leaves.
     *
     * It is spent INSIDE the dock, which is the whole of what makes the
     * exchange invisible. A dock is a stretch of scroll over which the card
     * sits exactly on the slot and does not move; both cards are opaque; so a
     * ramp of the top one over a bottom one held at full strength composites
     * to `a * top + (1 - a) * bottom` at every point, which is two appearances
     * of one object dissolving into each other in place. It is the same
     * ordering `handover` states at the hero, said at the other two docks.
     *
     * Ramping them together across the dock line instead — which is what this
     * did before, over a fifth of a window either side of it — is two cards.
     * Measured at 1440x900: the approve slot at 0.36 while the traveller was
     * at 0.47 and 233 PIXELS short of it, and Early Access's at 0.47 with the
     * card still 105px out. Both ends of both docks, and both were visible.
     *
     * A dock runs from `own.line` to its complement, so it is 0.7 of a window
     * long and two of these have to fit inside it with room to spare.
     */
    grip: 0.18,

    /**
     * How far away the card is between docks, as a fraction of its authored
     * face — against 0.73, 0.84 and 1.0 at the three docks.
     *
     * A third of the way, which at 1440x900 is a 143x89 card. It is the only
     * number here that is a look rather than a consequence, and it is set by
     * what the gap between the two comparison panels will take: 112 stage units
     * at Alone Vs Together's own scale is a 92px corridor down the middle of
     * that section, and the card falls down it.
     */
    far: 0.34,

    /**
     * Opacity in the seam between two sections, and over a section's payload.
     *
     * The page cannot occlude — every .screen is transparent to the page's own
     * ground — so what is behind the card has to be authored. What makes it
     * occlusion rather than a fade is that the schedule comes from the layout
     * and not from the animation's progress: the card is at `gap` when its
     * centre is inside a seam and `over` when it is over a section, `sine.inOut`
     * between, and every term is a function of scroll position rather than of
     * time. Scroll up and it runs exactly backwards; stop and it stops; reload
     * half way down the page and it is where it should be.
     *
     * `lead` is the first leg's and `long` the second's, and the first is
     * brighter on purpose. If the reader does not connect the card that leaves
     * the hero with the card in the approve diagram then nothing that happens
     * on the long leg means anything — so leg one spends its budget on being
     * seen, over one section, and leg two spends its on being absent, over
     * four.
     */
    lit: {
      lead: { seam: 0.34, over: 0.16 },
      long: { seam: 0.2, over: 0.05 },
    },

    /**
     * What the phone gets instead — the same bargain DepthLayer.phone already
     * strikes, and struck for the same reason.
     *
     * Everything down there is full-width. At 1440 the card in transit is 143px
     * of a 1440px window and the sections are a 1240px column with light on
     * either side of them; at 390 it is 109px of a 390px window and the column
     * IS the window, so the card is never anywhere but directly behind
     * something. Measured at the seam above Squad Approves: the wide tier's
     * numbers put a card across the section's badge and the first line of its
     * heading at nearly a third opacity, over half the width of the screen.
     *
     * So: further away, dimmer at every point, and no sideways excursion at
     * all — the reason for the sway up there is that the funnel has a spine on
     * the centre line and a dim vertical shape on it reads as one of its own
     * connectors, and in a column there is nowhere to go to avoid that anyway.
     */
    phone: {
      far: 0.28,
      sway: 0,
      lit: {
        lead: { seam: 0.24, over: 0.09 },
        long: { seam: 0.15, over: 0.04 },
      },
    },

    /**
     * And the same taper the depth system runs, for the same reason: motion
     * that is exhilarating at the top of a page is exhausting at the bottom.
     * The transit's brightness is multiplied by a fall from 1 to this across
     * the page — read off SectionDepth.gain's own endpoints (1.0 at the hero,
     * 0.55 at Early Access) rather than invented, so the card quietens on the
     * same curve everything else does.
     */
    taper: 0.55,

    /**
     * One `sine.inOut` excursion sideways and back on the long leg, as a
     * fraction of the window's WIDTH, peaking over the Intelligence Layer.
     *
     * The funnel's spine is the one place on the page where a dim vertical
     * shape on the exact centre line would be read as one of its own
     * connectors. Small enough that it cannot reach the edge of the window at
     * any width — 72px at 1440, against a card 143 wide on a centre line 720
     * from either edge — so it can never become the scrollable overflow that
     * .screen's own comment warns about. Zero on a phone, where the column IS
     * the window and there is nowhere to go: see travel.phone. And leg one has
     * none either, because there the centre line is a corridor deliberately
     * left empty between two panels, and falling down it is the best thing the
     * card could be doing on that screen.
     *
     * One excursion across the leg, but spent entirely in the falls — it runs
     * on the card's travelled page rather than on the reader's scroll, so the
     * card slides sideways only while it is also coming down. That is what
     * makes each crossing an arc instead of a vertical line with a fixed
     * offset on it, and it is where the whole of the effect went before: half
     * of the excursion used to be spent above the top of the window, where
     * there is nobody to see it.
     */
    sway: 0.05,

    /**
     * The last of a leg — measured in the card's own travelled page — over
     * which its excursions are folded away.
     *
     * `sway` and `bank` both resolve to nothing at a dock anyway, but only
     * exactly AT it, and a card still correcting its lean in the last few
     * pixels reads as being placed rather than as settling. Folded away over a
     * sixth of the leg, the destination has hold of the card before it gets
     * there: it comes down the last stretch plumb and on the slot's own centre
     * line, and the only thing still happening at the moment it lands is the
     * quarter turn finishing.
     */
    approach: 0.16,

    /**
     * A few degrees off plumb while it falls, resolving to nothing at each
     * dock.
     *
     * The cheapest thing on the list and the one that turns a translate into a
     * fall: it is the same property the quarter turn already uses, so it costs
     * one number of arithmetic and no extra channel. Deliberately small — a
     * card that tumbles is a card nobody can read, and this one is legible at
     * both ends of every leg.
     */
    bank: 5,

    /**
     * Where in the leg's travelled page the quarter turn starts.
     *
     * Held back to the final approach on purpose: the turn is the page's
     * closing gesture and the mirror of the hero's opening one, so it wants to
     * be the last thing the card does rather than something it has been doing
     * all the way down.
     *
     * In travelled page rather than in scroll, and that is what makes it
     * visible. On the scroll clock a third of the rotation was spent while the
     * card was parked above the top of the window between two seams, and the
     * card reappeared at the next crossing already turned — a quarter turn
     * nobody watched, delivered in instalments behind the sections.
     */
    turn: 0.62,

    /**
     * The scrub's catch-up, in seconds — MOTION.hero.fold.lag's own number, and
     * the same argument: a rigid scrub ties the card to the scrollbar and reads
     * as a scrollbar, and a fraction of a second behind reads as an object with
     * weight being carried down a page. It is also what rounds the corners
     * where the path changes rate, since a sudden change in target velocity is
     * smoothed over the lag.
     */
    lag: 0.6,
  },

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
     * The same movement on a phone, where it is not the same movement.
     *
     * The one number in the hero that could not be shared between the tiers,
     * and the reason is arithmetic rather than taste. Up here the four cards
     * travel 250 and 501px out from the Squad card's centre; the phone's deck
     * sits them 56 and 126 behind it (see HeroFanPhone), which is a quarter of
     * the distance. Played at the wide fan's duration that is a quarter of the
     * speed — four cards easing apart so slowly that the deck reads as settling
     * rather than opening, and the last of them still arriving long after the
     * copy above it has finished.
     *
     * A distance is not a duration, and the fix is to say the second one too.
     * Roughly the wide fan's pace over the deck's own distance, which is what
     * makes the two tiers look like the same gesture rather than the same
     * timeline.
     *
     * The stagger comes down with it and for the same reason: 0.2 between four
     * cards that each take 1.2 is most of the movement spent waiting. Tight
     * enough that the deck opens as one hand and loose enough that it is four
     * cards — they go out back rank first, alternating sides, which is the
     * order HERO_DECK_PHONE is written in.
     */
    fanPhone: { duration: 1.2, stagger: 0.14, ease: "power1.out" },

    /**
     * And the fan closing again on the way out, scrubbed by the scroll rather
     * than played — see heroFold.
     *
     * The one thing on the page the reader performs rather than watches: it has
     * no duration, only a distance, and every frame of it is theirs. That is
     * the right choice for this and the wrong one for everything else here — a
     * card arriving or a wire drawing is an event, and an event scrubbed
     * backwards and forwards by a scrollbar stops being one. This is not an
     * event. It is four cards with a position, and where they are ought to be a
     * function of where the reader is.
     *
     * `out` is how much scrolling it takes, as a fraction of the window: the
     * four cards are folded away by the time the reader has moved this far.
     * Enough to be a movement in its own right rather than a flicker as the
     * hero leaves, and short enough that it is over well before the hero
     * itself is.
     *
     * `stagger` is a good deal tighter than the fan's own 0.2. Opening, the
     * four cards are the event and each one wants to be seen arriving; closing,
     * they are getting out of the way of the one they came from, and a long
     * stagger there just holds the hero open.
     *
     * `lag` is the scrub's catch-up, in seconds. A rigid scrub locks the cards
     * to the scrollbar and they read as a scrollbar, so they trail a fraction
     * behind the wheel: enough weight to look like objects being folded away
     * rather than values being written to a style attribute. The same number,
     * within a rounding, that the deepest layers of PARALLAX.lag settle on.
     *
     * `settle` is how long the fold's trigger waits before it is created at
     * all, in seconds, and it is not a nicety.
     *
     * A scrubbed timeline renders as soon as its ScrollTrigger exists, and at
     * the top of the page it renders at progress 0 — which for this timeline is
     * the four cards at x: 0, opacity: 1, their RESTING state. That is exactly
     * where heroCards is still travelling to, so a fold built any earlier would
     * write the end of the hero's entrance over the top of it on every frame:
     * the fan would not open, it would simply be there. (The related bug of one
     * card being caught mid-fan and pinned folded is fixed separately, and
     * differently — see the note on fromTo in heroFold.)
     *
     * Comfortably past the hero's own arrival at this pace; it costs nothing to
     * be late, because until then there is nothing to scroll past.
     */
    fold: { out: 0.6, stagger: 0.12, lag: 0.6, settle: 2.5 },

    /**
     * The same fold on a phone, which starts later and finishes sooner — and
     * has to, because the thing it is folding is a third of the size.
     *
     * Both tiers hang the fold on the fan being done with: up here that is the
     * hero's top edge reaching the top of the window, down there the fan's own
     * bottom edge clearing the bottom of it. That second rule was written for a
     * 539px fan and reads completely differently against a 278px deck, because
     * a shorter thing clears the fold sooner. Measured at rest: the deck's foot
     * sits 30px under the fold on a 430x932 phone, so the reader nudged the page
     * a thumb's width to see the whole of it and the fan took that as their cue
     * to start closing it. The one moment the section is FOR, spent in a
     * scroll gesture.
     *
     * `lead` is what buys that moment back, as a fraction of the window: the
     * fold waits until the deck's foot has come up 30% of the window past the
     * fold, which is the point at which it is not merely on the screen but
     * being looked at. A fraction rather than a distance, and for the same
     * reason MOTION.own.line is one — it is a position in the reader's view,
     * and every phone has a different number of pixels for it. Worth checking:
     * it holds the fold off for 230-280px at every phone size, against 30 at
     * the worst of them, and it stays positive on a window tall enough to show
     * the whole hero at once.
     *
     * `out` is then shorter than the wide tier's 0.6, and that is forced by the
     * first half. The fold has to be over while the deck is still on the screen
     * — it is four cards folding into a fifth, and the fifth being the only one
     * left is the picture it exists to make. Starting a fifth of a window later
     * and running the wide tier's distance would finish it with the deck a
     * third of the way off the top. 0.35 lands it with the deck at the top of
     * the window and whole, at every size measured.
     */
    foldPhone: { lead: 0.3, out: 0.35 },

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
    /**
     * Step 1's four members, going round the hub they are joined to.
     *
     * `turn` is seconds for one full revolution, and it is the only number the
     * orbit has — everything else about it is geometry already in the markup
     * (see worksOrbit). Linear, because a circle has no start and no end and an
     * ease would invent one: any ease that is not "none" makes the ring speed
     * up and slow down once per lap, which reads as a stutter rather than as
     * an orbit.
     *
     * 30 seconds is 20px a second at the 96px radius they sit on: an avatar
     * clears its own width in two, which is enough to be moving when you look
     * at it and not enough to pull your eye off the copy beside it. The step is
     * "form your squad" and this is the only thing on the card that says the
     * squad is a live arrangement rather than a diagram of one.
     */
    orbit: { turn: 30 },
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
      count: { duration: 1, ease: "power1.out" },
      meter: { duration: 1, ease: "power1.out" },
      stagger: 0.1,
      /**
       * When the first card's readout starts, in seconds into the beat — held
       * just long enough that the card is legibly on its way in before the
       * number inside it starts moving.
       */
      after: 0.8,
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

  /* --- life inside squad ------------------------------------------------ */

  /*
   * Three cards that are three moments of one week: a lane being spent down, a
   * member covering another member, and the squad's own health. So the section
   * arrives as three statements rather than as one diagram — the two on the top
   * row together, the ledger under them when the reader reaches it.
   */
  life: {
    /**
     * The gap between the lane card and the one beside it.
     *
     * Small, and the smallest stagger on the page. These two are read as a pair
     * — a lane, and someone covering it — so they arrive as a pair with just
     * enough offset to say which one is the subject. Anything longer and the
     * second card reads as a consequence of the first rather than as the other
     * half of the same sentence.
     */
    cardStagger: 0.09,
    /**
     * How far below its place each thing INSIDE a card starts.
     *
     * The same 22 the invite card's contents use, and for the same reason: the
     * item's travel is the card's plus its own, so a short one keeps that sum
     * proportional instead of the card landing and its contents then sliding
     * the last stretch into a box that has already stopped.
     */
    itemRise: 22,
    itemStagger: 0.08,
    /**
     * The lane's figures, and the bar under them.
     *
     * One duration for both because they are one fact stated twice — $3,860
     * available IS the 71.7% of the bar that is not filled — and a meter that
     * arrives full under a number still climbing reads as two unrelated
     * readouts sharing a card. Same argument as the funnel's score cards; the
     * numbers differ because there are four figures here against that row's
     * four, spread across two cards rather than one row.
     *
     * Decelerating, so the last few hundred tick over slowly enough to be read
     * as they settle rather than being cut off at full speed.
     */
    figures: {
      count: { duration: 1.8, ease: "power2.out" },
      meter: { duration: 1.8, ease: "power2.out" },
      stagger: 0.1,
      /** Held just long enough that the card is legibly on its way in before
          the number inside it starts moving. */
      after: 0.25,
    },
    /**
     * The health card, which arrives on its own trigger at the foot of the
     * section — see Beat.own.
     *
     * Its four score cells are the only staggered thing on it: the three stats
     * above them are one reading of one squad and land together, where the
     * scores are four people and are worth counting off. `scoreRise` is short
     * for the same reason `itemRise` is.
     */
    scoreRise: 18,
    scoreStagger: 0.09,
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
    /*
     * The section's clock, which is still the card's even though the card is no
     * longer this beat's to move.
     *
     * The page opened on this card standing upright out of landscape and it
     * closes on the same card lying flat again — and now it IS the same card,
     * carried down the page by the reader rather than played at them (see
     * squadTravel). So the turn and the 300px rise this used to state are gone
     * with it: the arrival covers no distance at all, because the thing has
     * been visibly on its way for four thousand pixels.
     *
     * What is left here is the duration everything BESIDE the card runs on, and
     * the length of the beat that WITH_CARD queues the form behind. Both still
     * mean exactly what they did.
     */
    card: { duration: 3, ease: "power3.out" },

    /**
     * How far below its place each part of the section starts.
     *
     * Three different distances on purpose: everything travels less the closer
     * it sits to where it ends up. They all take the SAME time to do it — see
     * `card` above, which every one of them runs on — so they move at three
     * different speeds and arrive on one frame, which is what makes them read
     * as one panel rising rather than three things racing.
     */
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
