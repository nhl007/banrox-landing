import gsap from "gsap";
import { MOTION } from "./motion";

/*
 * One factory per animated section. Each returns a single PAUSED timeline.
 *
 * There is deliberately no "outro" factory anywhere: the controller plays these
 * forward for an intro and calls .reverse() on the very same instance for an
 * outro, which is what makes the reversal exact rather than a hand-written
 * forward copy that happens to look similar.
 *
 * Consequence to keep in mind when editing: anything a timeline does must be
 * something it can undo by running backwards. That is why the hero scrolls the
 * window from inside its timeline (see heroIntro) instead of the controller
 * doing it — a scroll the timeline owns is a scroll the timeline can rewind.
 */

const q = (root: HTMLElement, role: string) =>
  gsap.utils.toArray<HTMLElement>(root.querySelectorAll(`[data-reveal='${role}']`));

/**
 * How far a pinned section's content has to slide up for its lower half to be
 * on screen. Zero when the whole thing already fits.
 *
 * Measured off the [data-shift] wrapper rather than the section, so the
 * section's bottom padding is not counted as content that needs revealing —
 * otherwise every section would over-travel by its own padding.
 */
/**
 * How much of the section's content ends up below the fold once it is pinned.
 *
 * offsetTop matters as much as the height: the wrapper starts at the section's
 * own padding-top, so measuring the height alone reports a section as fitting
 * when the padding has already pushed its last hundred pixels off screen. That
 * is what was clipping the strength rails off the comparison panels.
 *
 * Layout values on purpose — the wrapper is carrying a transform for most of
 * the sequence, so anything rect-based would measure the animation instead of
 * the geometry.
 */
const cutOff = (shift: HTMLElement) =>
  shift.offsetTop +
  shift.offsetHeight -
  /*
   * Minus its own bottom padding, which is space rather than content and so is
   * nothing to travel for. Every section but Early Access keeps its padding on
   * the <section>, where offsetHeight never saw it; that one had to move it onto
   * the wrapper to stop the absolute glows shifting once GSAP writes a transform
   * here, and 120px of empty padding then read as 120px of content still to
   * reveal — enough to push the card it leads with off the top of the screen.
   */
  parseFloat(getComputedStyle(shift).paddingBottom || "0") -
  window.innerHeight;

/** How far a pinned section has to slide up to bring all of itself on screen. */
const revealBy = (shift: HTMLElement) =>
  overhangs(shift) ? -(cutOff(shift) + MOTION.section.tail) : 0;

/**
 * The same distance as a percentage of the wrapper's own height.
 *
 * Expressed that way on purpose. The wrapper's plain `y` belongs to the
 * controller, which counter-translates the section against the page's scroll so
 * it arrives in place instead of riding up from the fold (see MOTION.arrival).
 * GSAP keeps y and yPercent as separate entries in one transform cache, so the
 * two compose instead of overwriting each other — one owner per component.
 */
const revealPercent = (shift: HTMLElement) =>
  shift.offsetHeight ? (revealBy(shift) / shift.offsetHeight) * 100 : 0;

/** Whether there is enough below the fold for the reveal to be worth a beat. */
const overhangs = (shift: HTMLElement | null): shift is HTMLElement =>
  !!shift && cutOff(shift) > MOTION.section.revealMin;

/** Where the copy beat ends — the moment the section should have arrived. */
const copyBeat = (copy: HTMLElement[]) =>
  MOTION.copy.duration + MOTION.copy.stagger * Math.max(0, copy.length - 1);

/**
 * The section-wide dissolve, plus the mark the controller reads to decide how
 * much of the timeline belongs to the arrival.
 *
 * Everything the section owns fades as one, which is what makes a handover read
 * as one section arriving behind another rather than a set of elements each
 * doing its own thing. It also means a section is *completely* gone at progress
 * 0 — anything not carrying its own [data-reveal] tag included — so the outro
 * leaves nothing hanging on screen while the pin releases.
 */
const dissolve = (tl: gsap.core.Timeline, shift: HTMLElement | null) => {
  if (!shift) return;
  gsap.set(shift, { autoAlpha: 0 });
  tl.to(shift, { autoAlpha: 1, ...MOTION.arrival.dissolve }, 0);
};

/**
 * Draws every connector run inside `root`, in document order.
 *
 * Each run wipes on from one end while the light inside it (see ConnectorTrace)
 * rides the drawing edge — both linear, both from the same instant, so the
 * bright head sits exactly where the line is being made. The sweep is the
 * longer of the two only so it can carry on and leave once the drawing is done.
 *
 * The wipe is what puts the head on the edge: it clips the sweep's leading half
 * away, and what is left reads as a head with a tail. That is also why a run
 * never simply fades in — a line that draws itself is the thing being
 * described, a line that fades up is just a line.
 */
const trace = (
  tl: gsap.core.Timeline,
  root: HTMLElement,
  at: number | string,
  stagger = MOTION.trace.stagger,
) => {
  q(root, "lines").forEach((run, i) => {
    const down = run.dataset.traceAxis === "y";
    /* Mirrored artwork mirrors this element's own axes along with it, so the
       run has to be drawn backwards in its own coordinates to come out
       forwards on screen. */
    const flip = "traceFlip" in run.dataset;
    const shut = down
      ? flip
        ? "inset(100% 0% 0% 0%)"
        : "inset(0% 0% 100% 0%)"
      : flip
        ? "inset(0% 0% 0% 100%)"
        : "inset(0% 100% 0% 0%)";

    gsap.set(run, { opacity: 1, clipPath: shut });
    tl.to(run, { clipPath: "inset(0% 0% 0% 0%)", ...MOTION.trace.lines }, i ? `<+=${stagger}` : at);

    const spark = run.querySelector<HTMLElement>("[data-spark]");
    if (!spark) return;
    const along = down ? "y" : "x";
    const span = () => (down ? run.offsetHeight : run.offsetWidth);
    /* Half the light's own length, which is what carries its tail off the end
       rather than leaving it parked there. */
    const tail = () => (down ? spark.offsetHeight : spark.offsetWidth) / 2;

    /* Started at the far end when mirrored — which is the near end on screen,
       and so still where the wipe above starts opening from. */
    gsap.set(spark, { opacity: 1, x: 0, y: 0, [along]: flip ? span : 0 });
    tl.to(
      spark,
      {
        [along]: flip ? () => -tail() : () => span() + tail(),
        ...MOTION.trace.spark,
      },
      "<",
    );
  });
};

/* -------------------------------------------------------------------------- */

/**
 * Navbar: drops in from above the top edge; reversed, it folds up and retracts.
 *
 * The header keeps its 72px slot in flow the whole time — this is a transform,
 * so nothing below it moves and the document height never changes.
 */
export function navbarIntro(el: HTMLElement) {
  const pill = el.querySelector("[data-reveal='nav-pill']") as HTMLElement;
  const tl = gsap.timeline({ paused: true });

  gsap.set(el, { opacity: 1 });
  /*
   * -el.offsetHeight, not yPercent: -100. The pill is 56px tall but sits 16px
   * down inside the 72px header, so its own height leaves a strip of it still
   * on screen; the header's height is the distance that actually clears the
   * top edge.
   */
  gsap.set(pill, {
    y: -el.offsetHeight,
    rotationX: MOTION.navbar.fold,
    transformOrigin: "50% 0%",
    transformPerspective: 800,
    opacity: 0,
  });

  tl.to(pill, {
    y: 0,
    rotationX: 0,
    opacity: 1,
    ...MOTION.navbar.drop,
  });

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Hero, in two movements.
 *
 * 1. Copy rises and scales up out of nothing, then the CTAs — lying flat on the
 *    screen plane — hinge upright off their bottom edge.
 * 2. The whole deck is lying flat on the display, stacked exactly behind the
 *    Squad card, which is on its side in the same horizontal pose as the CTAs.
 *    It lifts off the plane and turns counter-clockwise into position as one
 *    unit, and only once upright do the passport cards come out from behind it.
 *
 * The two movements are laid out along the timeline so that scroll brings each
 * one's subject into view as its beat comes up: the copy plays while the top of
 * the section is on screen, and the cards — which sit 477px further down — get
 * the middle of the section's range, by which point they are centred.
 */
export function heroIntro(el: HTMLElement) {
  const copy = q(el, "copy");
  const buttons = q(el, "button");
  const note = q(el, "note");
  const glow = q(el, "glow");
  const fan = q(el, "fan");
  const cards = q(el, "card");
  const anchor = el.querySelector("[data-fan-anchor]") as HTMLElement;
  const shift = el.querySelector("[data-shift]") as HTMLElement;

  /*
   * Every passport card is pulled onto the Squad card's exact centre, so the
   * deck is a single stack with nothing peeking out — they only exist once
   * they come out from behind it. Measured off the DOM in unscaled stage
   * units, which is the space GSAP's x lives in.
   */
  const stacked = (card: HTMLElement) =>
    anchor.offsetLeft +
    anchor.offsetWidth / 2 -
    (card.offsetLeft + card.offsetWidth / 2);

  /*
   * The hero is the one section with nothing in front of it to arrive behind,
   * so it is on screen from the start and its own tagged elements do all the
   * revealing. It still has to opt out of the shared hidden start state.
   */
  gsap.set(shift, { autoAlpha: 1 });
  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(note, { opacity: 0, y: 12 });
  gsap.set(buttons, {
    opacity: 0,
    rotationX: MOTION.flat.angle,
    transformOrigin: "50% 100%",
    transformPerspective: 600,
  });
  gsap.set(glow, { opacity: 0 });
  gsap.set(fan, {
    opacity: 0,
    rotationX: MOTION.flat.angle,
    z: MOTION.hero.depth,
    transformOrigin: "50% 100%",
  });
  /*
   * Hidden as well as stacked. They are directly behind a card that is turned
   * on its side, so parts of them would otherwise poke past its edges — and
   * the point is that nothing exists until it comes out from behind the Squad
   * card.
   */
  gsap.set(cards, { opacity: 0, x: (_i, card: HTMLElement) => stacked(card) });
  /*
   * The Squad card starts on its side. The component already turns its face
   * -90deg to stand upright, so +90 here cancels that back to landscape; the
   * tween to 0 is the counter-clockwise quarter turn into its real position.
   */
  gsap.set(anchor, { rotationZ: MOTION.hero.turn });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

  tl.to(copy, { opacity: 1, scale: 1, y: 0, duration: MOTION.copy.duration, ease: MOTION.copy.ease, stagger: MOTION.copy.stagger })
    .to(buttons, { opacity: 1, rotationX: 0, ...MOTION.hero.buttons }, "-=0.35")
    .to(note, { opacity: 1, y: 0, ...MOTION.hero.note }, "-=0.4")

    /* Movement 2 — bring the card scene up into the held viewport, then play it. */
    .to(shift, { yPercent: () => revealPercent(shift), ...MOTION.hero.reveal }, "+=0.1")
    .to(glow, { opacity: 1, ...MOTION.hero.glow }, "<")
    .to(fan, { opacity: 1, duration: 0.3, ease: "none" }, "<+=0.2")
    /* Lifts off the display plane and turns upright in one movement. */
    .to(fan, { rotationX: 0, z: 0, ...MOTION.hero.lift }, "<")
    .to(anchor, { rotationZ: 0, ...MOTION.hero.lift }, "<")
    /* Only now does anything come out from behind the Squad card. */
    .to(cards, { opacity: 1, x: 0, ...MOTION.hero.fan });

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * The shared entrance for every section that has no bespoke choreography.
 *
 * The section dissolves in and its copy scales up out of nothing while it is
 * still arriving; once it locks, the pin slides its lower half into the held
 * viewport and the payload rises in behind it. Deliberately one shape for all
 * of them: the authored sections below are the moments that should stand out, and
 * seven different ideas would flatten that.
 *
 * The "arrived" label is the seam. Everything before it plays during the
 * handover, so the heading is fully up by the time the section stops moving —
 * see the controller, which reads the label rather than being told a number.
 */
export function sectionIntro(el: HTMLElement) {
  const copy = q(el, "copy");
  const body = q(el, "body");
  const shift = el.querySelector("[data-shift]") as HTMLElement | null;

  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(body, { opacity: 0, y: MOTION.section.bodyRise });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  dissolve(tl, shift);

  tl.to(
    copy,
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: MOTION.copy.duration,
      ease: MOTION.copy.ease,
      stagger: MOTION.copy.stagger,
    },
    0,
  );
  /*
   * Placed rather than appended. addLabel() with no position lands at the
   * timeline's current *duration*, which is the longer of the copy beat and the
   * dissolve running beside it — so lengthening the dissolve would quietly
   * start moving the seam the controller reads.
   */
  tl.addLabel("arrived", copyBeat(copy));

  if (overhangs(shift))
    tl.to(shift, { yPercent: () => revealPercent(shift), ...MOTION.section.reveal }, "+=0.1");
  tl.to(body, { opacity: 1, y: 0, ...MOTION.section.body }, overhangs(shift) ? "<+=0.2" : "+=0.1");

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Alone vs Together: copy rises and scales in, then the two panels slide in
 * from the left and right viewport edges and the VS mark fades up between them.
 *
 * Travel is measured rather than hard-coded. The panels are flush with their
 * 1240px stage's edges, so how far off-screen they must start depends on how
 * much wider the viewport is than the (scaled) stage.
 */
export function aloneIntro(el: HTMLElement) {
  const copy = q(el, "copy");
  const left = q(el, "card-left");
  const right = q(el, "card-right");
  const vs = q(el, "vs");
  const bars = q(el, "bar");
  const stage = el.querySelector(".stage") as HTMLElement;
  const viewport = el.querySelector(".stage-viewport") as HTMLElement;
  const shift = el.querySelector("[data-shift]") as HTMLElement;

  /*
   * GSAP's x is applied inside .stage, before its scale, so the travel has to
   * be expressed in unscaled stage units too — hence dividing the viewport
   * width by the stage's current scale. The +8 clears the 2px outward ring and
   * its shadow so nothing peeks at the edge.
   */
  const travel = () => {
    const scale = stage.getBoundingClientRect().width / stage.offsetWidth || 1;
    const overhang = Math.max(0, (viewport.clientWidth / scale - stage.offsetWidth) / 2);
    return stage.offsetWidth / 2 + overhang + 8;
  };

  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(vs, { opacity: 0, scale: 0.6 });
  gsap.set(left, { opacity: 1, x: () => -travel() });
  gsap.set(right, { opacity: 1, x: () => travel() });
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
  const grown = (panel: HTMLElement) => fullHeight.get(panel) ?? panel.offsetHeight;
  const shortHeight = (panel: HTMLElement) =>
    panel.querySelector<HTMLElement>("[data-reveal='bar']")?.offsetTop ??
    grown(panel);

  gsap.set(bars, { opacity: 1 });
  gsap.set(panels, { height: (_i, panel: HTMLElement) => shortHeight(panel) });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  dissolve(tl, shift);

  tl.to(copy, { opacity: 1, scale: 1, y: 0, duration: MOTION.copy.duration, ease: MOTION.copy.ease, stagger: MOTION.copy.stagger }, 0);
  tl.addLabel("arrived", copyBeat(copy));

  if (overhangs(shift))
    tl.to(shift, { yPercent: () => revealPercent(shift), ...MOTION.alone.reveal }, "+=0.1");
  tl.to(panels, { x: 0, ...MOTION.alone.cards }, overhangs(shift) ? "<+=0.3" : "+=0.1")
    .to(vs, { opacity: 0.7, scale: 1, ...MOTION.alone.vs }, "-=0.5")
    /* Last, and only once both panels have landed. */
    .to(
      panels,
      { height: (_i, panel: HTMLElement) => grown(panel), ...MOTION.alone.bar },
      "-=0.15",
    );

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Squad Approves: the diagram assembles from its own edges, and only then do
 * the connectors between the pieces light up.
 *
 * The four pieces — the request card in from the left, the vote list in from
 * the right, the ledger bar up from under the stage floor, and the Squad card
 * popping open in the middle with nowhere to come from — share one duration and
 * land on the same frame. Nothing takes a turn: the section is about a group
 * acting as one, so the diagram has to arrive as one object.
 *
 * Once it has, a light runs left to right along the connectors, drawing them as
 * it goes — out from the request, through the card, back along all three
 * branches to the votes. The ledger's member chips then count in one at a time,
 * carrying that same left-to-right motion down into the total.
 */
export function approveIntro(el: HTMLElement) {
  const copy = q(el, "copy");
  const request = q(el, "request");
  const votes = q(el, "votes");
  const squad = q(el, "squad");
  const halo = q(el, "squad-glow");
  const ledger = q(el, "ledger");
  const chips = q(el, "chip");
  const stage = el.querySelector(".stage") as HTMLElement;
  const viewport = el.querySelector(".stage-viewport") as HTMLElement;
  const shift = el.querySelector("[data-shift]") as HTMLElement;

  /*
   * Same unit problem as the comparison panels: GSAP's x lands inside .stage,
   * underneath the scale CSS puts on it, so every distance here has to be
   * expressed in unscaled stage units — hence dividing the measured viewport by
   * the stage's current scale.
   *
   * A piece leaves past the *viewport* edge rather than the stage's. The stage
   * is narrower than the window on a desktop, so stopping at its edge would
   * have both cards appear out of thin air a couple of hundred pixels in.
   */
  const overhang = () => {
    const scale = stage.getBoundingClientRect().width / stage.offsetWidth || 1;
    return Math.max(0, (viewport.clientWidth / scale - stage.offsetWidth) / 2);
  };
  const offLeft = (node: HTMLElement) =>
    -(overhang() + node.offsetLeft + node.offsetWidth);
  const offRight = (node: HTMLElement) =>
    overhang() + stage.offsetWidth - node.offsetLeft;
  /*
   * Far enough down that the bar clears the stage floor, which .stage-viewport
   * clips — plus its own height again, because it carries an ambient glow well
   * above its top edge and a glow hanging in the middle of an empty stage is
   * the one part of it you would notice waiting.
   */
  const below = (node: HTMLElement) =>
    stage.offsetHeight - node.offsetTop + node.offsetHeight;

  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(request, { opacity: 1, x: (_i, node: HTMLElement) => offLeft(node) });
  gsap.set(votes, { opacity: 1, x: (_i, node: HTMLElement) => offRight(node) });
  gsap.set(ledger, { opacity: 1, y: (_i, node: HTMLElement) => below(node) });
  gsap.set(squad, { opacity: 1, scale: 0, y: MOTION.approve.pop.hop });
  gsap.set(halo, { opacity: 0 });
  gsap.set(chips, { opacity: 0, scale: 0.7, y: 14, transformOrigin: "50% 100%" });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  dissolve(tl, shift);

  tl.to(copy, { opacity: 1, scale: 1, y: 0, duration: MOTION.copy.duration, ease: MOTION.copy.ease, stagger: MOTION.copy.stagger }, 0);
  tl.addLabel("arrived", copyBeat(copy));

  if (overhangs(shift))
    tl.to(shift, { yPercent: () => revealPercent(shift), ...MOTION.approve.reveal }, "+=0.1");

  const land = { duration: MOTION.approve.land, ease: MOTION.approve.slide };
  tl.to(request, { x: 0, ...land }, overhangs(shift) ? "<+=0.3" : "+=0.1")
    .to(votes, { x: 0, ...land }, "<")
    .to(ledger, { y: 0, ...land }, "<")
    .to(squad, { scale: 1, y: 0, duration: MOTION.approve.land, ease: MOTION.approve.pop.ease }, "<")
    .to(halo, { opacity: 1, ...MOTION.approve.glow }, "<");

  trace(tl, el, "-=0.25");

  /* Picked up as the light reaches the far end, so the two read as one move. */
  tl.to(chips, { opacity: 1, scale: 1, y: 0, ...MOTION.approve.chips }, "<+=0.8");

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * How Squad Works: three step cards grow up out of nothing, then the wiring
 * inside the last two draws itself.
 *
 * Staggered rather than simultaneous, unlike the approve diagram — these are
 * three sequential steps, and having them land one after the other is the only
 * thing in the section that says so.
 *
 * The rings in steps 1 and 2 are handled separately and never stop; see
 * worksAmbient.
 */
export function worksIntro(el: HTMLElement) {
  const copy = q(el, "copy");
  const steps = q(el, "step");
  const shift = el.querySelector("[data-shift]") as HTMLElement;

  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(steps, { opacity: 1, scale: 0, y: MOTION.works.hop });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  dissolve(tl, shift);

  tl.to(copy, { opacity: 1, scale: 1, y: 0, duration: MOTION.copy.duration, ease: MOTION.copy.ease, stagger: MOTION.copy.stagger }, 0);
  tl.addLabel("arrived", copyBeat(copy));

  if (overhangs(shift))
    tl.to(shift, { yPercent: () => revealPercent(shift), ...MOTION.works.reveal }, "+=0.1");

  tl.to(steps, { scale: 1, y: 0, ...MOTION.works.cards }, overhangs(shift) ? "<+=0.3" : "+=0.1");

  /* Then the wiring inside the last two, as the cards settle. */
  trace(tl, el, "-=0.2");

  return tl;
}

/**
 * The rings in steps 1 and 2, breathing.
 *
 * Not part of the intro, and not scrubbed: those two steps are about a group
 * being continuously assessed, and a diagram that settles into a still image
 * says the opposite. This is the only motion on the page that runs on its own
 * clock rather than on the scrollbar.
 *
 * Returned paused. The controller plays it only while the section is on screen
 * — a loop nobody can see is just a ticker callback burning frames.
 */
export function worksAmbient(el: HTMLElement) {
  const rings = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-glow]"));
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

/**
 * Intelligence Layer: a funnel, built top down — four member cards, then the
 * signal row they feed, then the engine they converge on, then the wiring.
 *
 * The one section far taller than the viewport: the diagram alone is 948px, so
 * the pin has to travel down it. That makes the reveal a camera move rather
 * than a preamble, and the beats are laid *across* it — each part of the funnel
 * plays while it is the part on screen. Run them before the reveal instead and
 * the hub would animate a full viewport below the fold; run them after and the
 * member cards would already have scrolled off the top.
 */
export function intelIntro(el: HTMLElement) {
  const copy = q(el, "copy");
  const members = q(el, "member");
  const signals = q(el, "signals");
  const hub = q(el, "hub");
  const aura = q(el, "aura");
  const nodes = q(el, "node");
  const shift = el.querySelector("[data-shift]") as HTMLElement;

  const rise = MOTION.intel.rise;
  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set([...members, ...signals, ...hub], { opacity: 0, y: rise });
  gsap.set([...aura, ...nodes], { opacity: 0 });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  dissolve(tl, shift);

  tl.to(copy, { opacity: 1, scale: 1, y: 0, duration: MOTION.copy.duration, ease: MOTION.copy.ease, stagger: MOTION.copy.stagger }, 0);
  tl.addLabel("arrived", copyBeat(copy));

  /* The top of the funnel, while the top of the funnel is what you are looking at. */
  tl.to(members, { opacity: 1, y: 0, ...MOTION.intel.members }, "+=0.1")
    .to(aura, { opacity: 1, duration: 1.2, ease: "power1.out" }, "<");

  /*
   * The camera starts down as the cards land, and the rest of the funnel is
   * placed along it. Without the overhang there is nothing to travel, so the
   * beats just queue up normally.
   */
  const pan = overhangs(shift);
  if (pan)
    tl.to(shift, { yPercent: () => revealPercent(shift), ...MOTION.intel.reveal }, "<+=0.45");

  tl.to(signals, { opacity: 1, y: 0, ...MOTION.intel.signals }, pan ? "<+=0.45" : "+=0.1")
    .to(hub, { opacity: 1, y: 0, ...MOTION.intel.hub }, pan ? "<+=0.5" : "-=0.4")
    .to(nodes, { opacity: 1, ...MOTION.trace.node }, "-=0.2");

  /* Last, and downwards — the direction the whole diagram flows. */
  trace(tl, el, "<+=0.1");

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Squad Invitation: the copy as everywhere else, then the invite card rises and
 * grows into place and fills itself in.
 *
 * Rise and grow together rather than one then the other — a card that slides up
 * at full size reads as a panel being pushed on screen, and the growth is what
 * makes it read as arriving. Its contents wait until it has landed, so nothing
 * is animating inside a box that is itself still moving.
 */
export function inviteIntro(el: HTMLElement) {
  const copy = q(el, "copy");
  const card = q(el, "card");
  const items = q(el, "item");
  const shift = el.querySelector("[data-shift]") as HTMLElement;

  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(card, { opacity: 0, ...MOTION.invite.cardFrom });
  gsap.set(items, { opacity: 0, ...MOTION.invite.itemFrom });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  dissolve(tl, shift);

  tl.to(copy, { opacity: 1, scale: 1, y: 0, duration: MOTION.copy.duration, ease: MOTION.copy.ease, stagger: MOTION.copy.stagger }, 0);
  tl.addLabel("arrived", copyBeat(copy));

  if (overhangs(shift))
    tl.to(shift, { yPercent: () => revealPercent(shift), ...MOTION.invite.reveal }, "+=0.1");

  tl.to(
    card,
    { opacity: 1, y: 0, scale: 1, ...MOTION.invite.card },
    overhangs(shift) ? "<+=0.3" : "+=0.1",
  ).to(items, { opacity: 1, y: 0, scale: 1, ...MOTION.invite.items }, "-=0.35");

  return tl;
}

/* -------------------------------------------------------------------------- */

/**
 * Early Access: the card first, then the copy, then the form.
 *
 * The only section that leads with its artwork rather than its heading, because
 * that is the order it is laid out in — so the card is what plays during the
 * handover, and the copy scales up under it once the section has locked.
 *
 * It closes the loop the hero opened. The page began with this same card lying
 * flat and on its side, turning counter-clockwise as it stood up; here it comes
 * back up from below the fold with the same quarter turn, and the CTA hinges
 * upright off its bottom edge exactly as the hero's buttons did.
 */
export function earlyIntro(el: HTMLElement) {
  const copy = q(el, "copy");
  const card = q(el, "card");
  const fields = q(el, "field");
  const cta = q(el, "cta");
  const stage = el.querySelector(".stage") as HTMLElement;
  const shift = el.querySelector("[data-shift]") as HTMLElement;

  /*
   * Far enough down to start below the fold. The section is pinned with its top
   * at the viewport top, so the distance from there to the card is what it has
   * to clear — measured in unscaled stage units, since GSAP's y lands inside
   * .stage underneath the scale CSS puts on it.
   */
  const fromBelow = () => {
    const scale = stage.getBoundingClientRect().width / stage.offsetWidth || 1;
    const top = stage.getBoundingClientRect().top - el.getBoundingClientRect().top;
    return (window.innerHeight - top) / scale;
  };

  gsap.set(copy, { opacity: 0, scale: 0, y: MOTION.copy.rise, transformOrigin: "50% 100%" });
  gsap.set(card, { opacity: 1, y: fromBelow, rotationZ: MOTION.early.turn });
  gsap.set(fields, { opacity: 0, y: MOTION.early.fieldRise });
  gsap.set(cta, {
    opacity: 0,
    rotationX: MOTION.flat.angle,
    transformOrigin: "50% 100%",
    transformPerspective: 600,
  });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  dissolve(tl, shift);

  tl.to(card, { y: 0, rotationZ: 0, ...MOTION.early.card }, 0);
  /*
   * The card is this section's arrival, so the seam sits at the end of its turn
   * rather than at the end of a copy beat there is nothing above it to play.
   */
  tl.addLabel("arrived", MOTION.early.card.duration);

  if (overhangs(shift))
    tl.to(shift, { yPercent: () => revealPercent(shift), ...MOTION.early.reveal }, "+=0.1");

  tl.to(
    copy,
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: MOTION.copy.duration,
      ease: MOTION.copy.ease,
      stagger: MOTION.copy.stagger,
    },
    overhangs(shift) ? "<+=0.25" : "+=0.1",
  )
    .to(fields, { opacity: 1, y: 0, ...MOTION.early.fields }, "-=0.3")
    .to(cta, { opacity: 1, rotationX: 0, ...MOTION.early.cta }, "-=0.35");

  return tl;
}
