"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PARALLAX } from "./depth";
import { MOTION } from "./motion";
import { authoredRect, authoredTop, leadOf } from "./measure";
import { parallaxScene } from "./parallax";
import { SECTIONS } from "./sections";
import { heroFold, navbarDrop, one, squadTravel } from "./timelines";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/*
 * The page as a page.
 *
 * The sections are a column and the reader scrolls it. Nothing here takes a
 * wheel event, a swipe or a key press: scrolling moves the document by exactly
 * as much as the reader asked for, and stops wherever they stop. Each section
 * is still one windowful tall — that is the layout the design is drawn for, and
 * it survives having a scrollbar — but it is a windowful you scroll through
 * rather than a slide you are handed.
 *
 * What this file still does is decide WHEN a section animates. A section that
 * played on load would be over before the reader reached it, and one that
 * played on every pass would replay itself all the way back up the page. So
 * each one has a ScrollTrigger that fires its entrance the first time it comes
 * into view, and thereafter only starts and stops the motion that never
 * finishes — the connector lights, the drifting glows, the cards breathing —
 * so nothing is animating in a part of the page nobody is looking at.
 *
 * ---------------------------------------------------------------------------
 * WHAT USED TO BE HERE
 *
 * A deck: the seven sections stacked in one windowful, only one showing, and
 * every wheel/touch/key event intercepted so that one gesture handed the window
 * to the next section instead of moving the page. It brought with it a gesture
 * owner, a swipe threshold, an idle window to make one trackpad flick mean one
 * section, a release flag to let the reader out into the footer, and a scroll
 * listener that pinned the document to the top until they were let out.
 *
 * All of it is gone, and the page has no opinion about scrolling any more.
 */

/**
 * Everything the sequence writes an inline style to, as one selector.
 *
 * The arrivals reach [data-reveal] and the wiring inside it ([data-spark] for a
 * connector's light, [data-glow] for the rings and hub layers that breathe,
 * [data-meter] for the score bars, [data-fan-anchor] for the hero's Squad
 * card, [data-orbit] and its riders for step 1's members going round the hub);
 * depth reaches the same [data-reveal] elements and the four wrapper layers.
 * Nothing else on the page is touched by either.
 *
 * Deliberately none of these carries a transform in the markup — the three that
 * do (.stage's perspective, SquadCard's mirrored face, ConnectorTrace's mirror)
 * are outside this set, which is what makes it safe to strip the property
 * outright rather than try to restore it.
 */
const WRITTEN = [
  "[data-reveal]",
  "[data-spark]",
  "[data-glow]",
  "[data-meter]",
  "[data-fan-anchor]",
  "[data-orbit]",
  "[data-orbit-rider]",
  ".screen-copy",
  ".screen-payload",
  ".screen-glow",
  ".stage-backdrop",
  /* The travelling Squad card, which is written to on every frame of the
     journey and must be put back to the stylesheet's nothing when the window
     leaves the gate — see squadTravel and .squad-trail. */
  ".squad-trail-frame",
  "[data-card-turn]",
].join(",");

/**
 * Put the page back the way the server rendered it.
 *
 * Run when the window crosses OUT of the motion gate — narrowed under 641px,
 * shortened under 480px, or reduced motion switched on mid-session. Below the
 * gate the markup is already the finished page and every inline style the
 * sequence left behind is wrong, so the fix is to have none.
 *
 * GSAP's own revert is not enough here, and measurably so. Loaded at 1440x900,
 * scrolled to 700 and then resized to 390x844, what survived the matchMedia
 * revert was every un-arrived section sitting at its arrival's START state:
 * "opacity: 0.2; transform: translate(0px, 60px)" on the copy blocks — which
 * printed a 20% sub-paragraph straight through the CTA under it — and the
 * approve diagram left 80px and 56px out of alignment. Those are MOTION.enter's
 * own numbers. Reproduced identically for 1440x430 and for reduced motion
 * switched on with no resize at all.
 *
 * No attempt is made here to work out which of the two systems failed to let
 * go, because it does not matter what the answer is: below the gate the correct
 * inline style for every one of these elements is none, whatever put one there.
 * Stripping them is both the fix and the invariant.
 *
 * Plain DOM writes rather than gsap.set(clearProps), so that this is not itself
 * recorded and re-applied on the way back up through the gate.
 */
const unwind = () => {
  for (const el of document.querySelectorAll<HTMLElement>(WRITTEN))
    for (const prop of [
      "transform",
      "transform-origin",
      "opacity",
      "clip-path",
      "will-change",
    ])
      el.style.removeProperty(prop);

  /*
   * And the two things the sequence overwrites that are not styles at all, and
   * so cannot be put back by removing one.
   *
   * A figure counts by having its text replaced, and a score meter fills by
   * having the width the server rendered replaced. Cross the gate while either
   * is running and GSAP's revert winds the tween back to its start and writes
   * THAT — measured: crossing out mid-count left all six strength figures
   * reading "0 | 0% | $0.0k", permanently, on the tier whose whole premise is
   * that the markup is already the finished page.
   *
   * Both are restored from the attribute rather than remembered here, because
   * both already carry their own printed value for exactly this reason — see
   * the notes on data-count in StrengthBar and data-meter in MemberScoreCard.
   * A figure that has never counted has nothing in the attribute yet and is
   * left alone; its text is still the one the server wrote.
   */
  for (const cell of document.querySelectorAll<HTMLElement>("[data-count]"))
    if (cell.dataset.count) cell.textContent = cell.dataset.count;

  for (const bar of document.querySelectorAll<HTMLElement>("[data-meter]"))
    if (bar.dataset.meter) bar.style.width = `${bar.dataset.meter}%`;
};

export default function ScrollSequence({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  /*
   * This component lives in the root layout, and a layout does NOT unmount when
   * the route changes — only <main> does. So navigating to another page and
   * back replaces every section element while this effect, and every element
   * reference it closed over, carries happily on pointing at DOM that is no
   * longer in the document.
   *
   * The new sections then keep the state the stylesheet gives them before the
   * controller has touched them: every [data-reveal] at opacity 0. Which is to
   * say the page comes back blank, with only the footer — because the footer is
   * the one thing on it that was never waiting to be revealed.
   *
   * Re-running on the path is the fix, and revertOnUpdate is half of it: the
   * old context has to be torn down before the new one measures anything.
   */
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      const section = (id: string) =>
        document.querySelector<HTMLElement>(`[data-sequence-section='${id}']`);

      /* --- the hero's fan closing ------------------------------------------
       *
       * The one beat on the page the reader performs rather than watches. As
       * they scroll off the hero the four passport cards fold back in behind
       * the Squad card and are gone, leaving the product alone on the screen —
       * see heroFold for the geometry, MOTION.hero.fold for the numbers.
       *
       * The only ARRIVAL on the page driven this way. Everything the two
       * branches below set up is an event with a duration that plays once when
       * its section comes into view; this has no duration at all, only a
       * distance, and every frame of it belongs to the reader. (Depth is
       * scrubbed too, but depth is not an arrival — it is where a layer sits
       * while the reader goes past it.)
       *
       * Both tiers get it. The phone's fan is a different arrangement of the
       * same five cards carrying the same roles, so the geometry is measured
       * off whichever of the two is rendered and the four still fold into the
       * Squad card they came out of.
       *
       * What each tier does NOT share is where the fold starts, and it cannot.
       * Above the gate the hero is exactly one window with the fan in it, so
       * the hero's top edge reaching the top of the window IS the reader
       * starting to leave the fan. On a phone the hero is 1204px tall and the
       * fan is the bottom 539 of it — the same trigger there had the four cards
       * folded away by scroll 562, which is the moment the fan first arrives in
       * the middle of the window. The section deleted its own subject just as
       * the reader got to it. Measured, and unmistakable in a screenshot.
       *
       * So down there it hangs on the FAN, and on the edge that means the same
       * thing: its bottom leaving the bottom of the window, which is the point
       * at which the whole of it has been seen and the reader is going past.
       * The fold then runs from there to the fan's own exit — every frame of it
       * on screen, which is what it is for.
       */
      /* --- the Squad card's journey --------------------------------------
       *
       * The one piece of motion on this page that spans more than a section,
       * and the second the reader performs rather than watches: the card leaves
       * the hero's fan once the fan has folded into it, falls down the page
       * behind everything, is set down in the approve diagram's slot, falls
       * again through four sections, and lies down flat in Early Access. See
       * squadTravel for the path and MOTION.travel for the arithmetic.
       *
       * A proxy rather than the card itself, so that `scrub` has something to
       * lag and one function still owns every property the card has. Scrubbed
       * with a lag rather than locked to the scrollbar: rigid, it reads as a
       * scrollbar; a fraction of a second behind, it reads as an object with
       * weight being carried down a page. It is also what rounds the corners
       * where the path changes rate.
       *
       * Built inside both tier handlers, so the whole thing is torn down by the
       * same matchMedia revert that tears the sequence down — and never built
       * below the gate, where the trail element is display:none and the page's
       * own three cards are the finished page.
       */
      const flyCard = (tier: "full" | "phone") => {
        const scene = document.querySelector<HTMLElement>(".scene-track");
        const travel = scene && squadTravel(document.documentElement, tier);
        if (!travel) {
          /*
           * Nothing to fly the card with, so give the two slots back to their
           * own sections. Neither reveals its Squad card any more — that is the
           * traveller's job (see approveDiagram and earlyCard) — and above the
           * gate the stylesheet holds every [data-reveal] at nothing, so
           * without this a flight that failed to build for any reason would
           * leave the approve diagram and Early Access with a hole where their
           * subject goes. Cheap insurance against the one failure this change
           * could cause that the reader would actually notice.
           */
          for (const sel of [
            "[data-sequence-section='approve'] [data-reveal='squad']",
            "[data-sequence-section='early'] [data-reveal='card']",
          ])
            for (const el of document.querySelectorAll<HTMLElement>(sel))
              gsap.set(el, { opacity: 1 });
          return;
        }

        /*
         * The two slots the traveller stands in for, held at nothing, and this
         * has to be written rather than left to the stylesheet. Above the gate
         * `[data-reveal] { opacity: 0 }` would hide them for free — but the
         * phone branch ends by sweeping every untouched [data-reveal] back to
         * full, precisely so that a hook nobody wired cannot leave a hole in
         * the page. Writing the zero here is what tells that sweep these two
         * are spoken for.
         */
        travel.park();

        const at = { p: 0 };
        const run = gsap.to(at, {
          p: 1,
          ease: "none",
          paused: true,
          onUpdate: () => {
            const { from, to } = travel.span();
            travel.apply(from + at.p * (to - from));
          },
        });

        ScrollTrigger.create({
          trigger: scene,
          start: () => travel.span().from,
          end: () => travel.span().to,
          scrub: MOTION.travel.lag,
          animation: run,
          /*
           * Re-measured on refreshINIT rather than on refresh, and the
           * difference is the whole of whether this survives a resize.
           *
           * A refresh computes a trigger's start and end and THEN calls
           * onRefresh, so a path measured in onRefresh is a path the bounds
           * were derived from one refresh ago. On load that means bounds of
           * zero length; across a resize it means the card's progress is
           * resolved against the window it just left. Measured: crossing from
           * 1440x900 to 390x844 left the card parked in the approve slot at
           * full strength with the reader back at the top of the page, and the
           * only reason the wide tier looked right was that heroFold's own
           * delayed refresh happened to run a second one.
           */
          onRefreshInit: () => travel.measure(),
          /*
           * And re-placed after them: a resize moves all three slots and every
           * seam between them, and the card has to be put back on the line
           * between where they are now rather than left on the one between
           * where they were. This is also what places it for the first time.
           */
          onRefresh: () => {
            const { from, to } = travel.span();
            travel.apply(from + at.p * (to - from));
          },
        });
      };

      const foldHero = ({
        trigger,
        start,
        out = MOTION.hero.fold.out,
      }: {
        trigger: HTMLElement | null;
        start: string;
        /** How much scrolling it takes, as a fraction of the window. The phone
            folds a smaller fan over a shorter run — see MOTION.hero.foldPhone. */
        out?: number;
      }) => {
        const heroEl = section("hero");
        const fold = heroEl && heroFold(heroEl);
        if (!heroEl || !fold || !trigger) return;

        const { lag, settle } = MOTION.hero.fold;

        /*
         * Built late, and it has to be.
         *
         * A scrubbed timeline renders as soon as its ScrollTrigger exists, and
         * at the top of the page it renders at progress 0 — which here is the
         * four cards at x: 0, opacity: 1, their resting state. That is
         * precisely where heroCards is still carrying them, so a fold created
         * any earlier writes the end of the hero's entrance over the top of it
         * every frame and the fan never visibly opens. See
         * MOTION.hero.fold.settle.
         *
         * The refresh afterwards is because every other trigger on the page was
         * positioned before this one existed.
         */
        gsap.delayedCall(settle, () => {
          ScrollTrigger.create({
            trigger,
            start,
            /*
             * A fraction of the WINDOW rather than of the hero. It is an amount
             * of scrolling, and what makes it feel right is how far the reader
             * has had to move — not how tall the section they moved out of
             * happened to be.
             */
            end: `+=${out * 100}%`,
            scrub: lag,
            animation: fold,
          });
          ScrollTrigger.refresh();
        });
      };

      /*
       * Below every gate — a window with no height to animate in, or a reader
       * who asked for less motion — no SEQUENCE plays at all. The CSS start
       * state is behind the same condition, so the server-rendered markup is
       * already the finished page and there is nothing to play.
       *
       * The query is the complement of the stylesheet's guard rather than of
       * either tier on its own, so that crossing between the two tiers that DO
       * animate is not mistaken for leaving them.
       *
       * There is something to undo, though, if the reader ARRIVED here rather
       * than started here — see unwind. This handler is the right place for it
       * because gsap.matchMedia reverts the contexts that stopped matching
       * before it runs the ones that started, so by the time this is called the
       * sequence has already let go of the page.
       */
      mm.add(
        "not all and (min-height: 480px) and (prefers-reduced-motion: no-preference)",
        unwind,
      );

      /*
       * A window too short to lay the wide page out in gets depth, and only
       * depth.
       *
       * Nothing is hidden here and nothing waits to arrive — the page is
       * delivered finished — so this adds no start state to undo and cannot
       * strand anything blank if it fails to run. It is the ambient light
       * moving at its own speed behind text that moves at the page's, which is
       * the one part of the whole system that still means something when a
       * section is a strip of heading. Reduced motion is excluded by the query
       * itself. See PARALLAX.calm.
       */
      mm.add(PARALLAX.calm, () => parallaxScene({ tier: "calm" }));

      /*
       * ---------------------------------------------------------------------
       * THE PHONE
       *
       * The same beats, the same ambients and the same depth system, cut a
       * different way: every beat carries its own trigger rather than queueing
       * behind the one above it off the section's.
       *
       * That is forced by what a section IS down here. Above the gate it is
       * exactly one window, so one trigger on its top edge is a moment that
       * covers all of it; on a phone it is a column of its own height — 2110px
       * of Squad Approves in an 844px window — and a single trigger would spend
       * the whole section while three quarters of it was still below the fold.
       * The page already had the answer for the parts of a WIDE section that
       * fall past the fold (Beat.own), and here every beat is in that position.
       *
       * So each one waits for the first thing it moves to clear the fold (see
       * leadOf and MOTION.own.line), and a beat whose parts are spread further
       * than a window can hold is cut into narrower ones — see SectionSpec.
       * column, which is the only thing in the whole tier that is authored
       * twice.
       */
      mm.add(MOTION.phone, () => {
        const navEl = section("navbar");
        if (navEl) navbarDrop(navEl).timeScale(MOTION.pace).play();

        for (const spec of SECTIONS) {
          const el = section(spec.id);
          if (!el) {
            console.warn(
              `[ScrollSequence] no element for section "${spec.id}"`,
            );
            continue;
          }

          const beats = spec.column ?? spec.beats;
          const loops = [spec.ambient ?? []].flat().map((make) => make(el));

          /*
           * The loops start with the section's FIRST beat rather than its last,
           * which is the one thing about them the column changes.
           *
           * Above the gate a section arrives as one run off one trigger, so
           * "the entrance has finished" is a moment that exists and the loops
           * wait for it — a light running down a wire that has not been drawn
           * yet would reveal itself already half way along. Down here the beats
           * are spread over the whole scroll of the section, and waiting for
           * the last of them means How Squad Works does not begin breathing
           * until step 3 lands, by which time step 1 — the card the orbit and
           * the rings belong to — is a thousand pixels above the window.
           *
           * Safe because of how the wiring is held: every run is clipped shut
           * at build (see traceRuns) and stays clipped until its own beat wipes
           * it open, and a light travelling inside a closed clip is a light
           * nobody can see. So the loop may run from the first beat and the
           * thing it was guarding against still cannot happen.
           *
           * Held whenever the section is off screen, exactly as before, so
           * nothing animates in a part of the page nobody is looking at.
           */
          let onScreen = false;
          let arrived = false;
          const runLoops = () => {
            if (onScreen && arrived) loops.forEach((l) => l.play());
          };
          const landed = () => {
            arrived = true;
            runLoops();
          };

          /*
           * The hero does not wait to be scrolled to — it is the page opening,
           * and the reader is already looking at it. So it keeps the queued
           * model: the navbar drops, the copy follows it, the fan follows the
           * copy, on one clock, in the order the page reads.
           */
          const queued =
            spec.plays === "load" ? gsap.timeline({ paused: true }) : null;
          let cursor = 0;

          for (const b of beats) {
            const child = b.play(el);

            if (queued) {
              /* A child has to be running for its parent to render it; these
                 come back paused because a factory has no idea when it will be
                 used. */
              child.paused(false);
              const at = Math.max(0, cursor + (b.delay ?? 0));
              queued.add(child, at);
              cursor = at + child.duration();
              continue;
            }

            /* Left paused, unlike the queued ones: this is a timeline of its
               own and nothing but its own trigger may start it. `restart` is
               what unpauses it, below. */
            child.timeScale(MOTION.pace);
            child.eventCallback("onComplete", landed);

            /*
             * What this beat is about: whatever it names, or else the first
             * thing it moves. `own` is preferred where a beat has one because
             * it is more precise than the derivation can be — the strength
             * rails are brought out by growing the PANEL, so the first thing
             * that beat moves is a card 379px above the rail it is for.
             */
            const subject = (b.own && one(el, b.own)) || leadOf(child);
            if (!subject) {
              /* Nothing this tier renders — the hero's other fan, a diagram's
                 other wiring. Let it settle whatever it holds and move on. */
              child.progress(1);
              continue;
            }

            const line = () =>
              authoredTop(subject) - window.innerHeight * MOTION.own.line;

            let ran = false;
            const run = () => {
              if (ran) return;
              /* Past the line, and still somewhere a reader could be looking —
                 the same two conditions the wide tier's own beats carry, and
                 for the same reasons. A reload part way down the page puts the
                 scroll far beyond the line for everything above it. */
              if (window.scrollY < line()) return;
              /*
               * Where the subject RESTS, not where this beat is holding it.
               * Early Access parks its card 300px down and its copy 200, which
               * on a phone is enough to put both past the bottom edge at the
               * moment their own line is crossed — so measured as-is the check
               * refused the beat it exists to protect, and the section arrived
               * at nothing for the whole page. Same reason the line above is
               * derived from authoredTop.
               */
              const r = authoredRect(subject);
              if (r.bottom <= 0 || r.top >= window.innerHeight) return;

              ran = true;
              child.restart();
            };

            /* Both directions: down the page in the ordinary way, or back UP
               to it from below after a jump carried the reader past. */
            ScrollTrigger.create({
              trigger: subject,
              start: line,
              end: () => line() + 1,
              onEnter: run,
              onEnterBack: run,
            });
            /* And already past it on arrival, which crossing nothing would
               never catch. */
            run();
          }

          if (queued) {
            /* The hero is one run again down here, so its loops keep the
               wide tier's bargain: the cards start breathing when the fan has
               finished opening, not while it is still opening. */
            queued.timeScale(MOTION.pace);
            queued.eventCallback("onComplete", landed);
            queued.play();
          }

          ScrollTrigger.create({
            trigger: el,
            start: "top 75%",
            end: "bottom 25%",
            onToggle: (self) => {
              onScreen = self.isActive;
              if (self.isActive) runLoops();
              else loops.forEach((l) => l.pause());
            },
          });
        }

        parallaxScene({ tier: "phone" });
        flyCard("phone");
        /* Not "bottom bottom" — the deck clears the fold too early for that to
           mean "done with it" any more. It waits `lead` of a window longer, and
           then folds over a shorter run so that it is finished while the deck is
           still whole on the screen. See MOTION.hero.foldPhone. */
        foldHero({
          trigger: one(section("hero") ?? document.body, "[data-reveal='fan']"),
          start: `bottom bottom-=${MOTION.hero.foldPhone.lead * 100}%`,
          out: MOTION.hero.foldPhone.out,
        });

        /*
         * And the belt to the braces.
         *
         * The stylesheet hides every [data-reveal] on this tier now, which
         * makes an element no beat reaches a permanently invisible one — a
         * failure the wide tier cannot have, because it has been walked
         * end to end at every size for months. Anything the loop above touched
         * carries an inline opacity, whether it has arrived yet or not; a hook
         * added to the markup and never wired to a beat carries none, and this
         * is what stops that being a hole in the page instead of a missing
         * animation.
         */
        for (const node of document.querySelectorAll<HTMLElement>(
          "[data-reveal]",
        ))
          if (!node.style.opacity) node.style.opacity = "1";
      });

      mm.add(MOTION.enabled, () => {
        const find = section;

        /* The navbar is not one of the sections. It is above them and it drops
           in on load, which is what the page opens on. */
        const navEl = find("navbar");
        if (navEl) navbarDrop(navEl).timeScale(MOTION.pace).play();

        for (const spec of SECTIONS) {
          const el = find(spec.id);
          if (!el) {
            console.warn(
              `[ScrollSequence] no element for section "${spec.id}"`,
            );
            continue;
          }

          /*
           * The section's beats, in order, in one paused timeline — the same
           * factories and the same delays as ever, a negative one still
           * overlapping the beat above it.
           */
          const beats = gsap.timeline({ paused: true });
          const owned: { child: gsap.core.Timeline; subject: HTMLElement }[] =
            [];
          let cursor = 0;
          for (const b of spec.beats) {
            const child = b.play(el);

            /*
             * A beat about something this section's own moment cannot see — the
             * strength rails at the foot of the comparison panels, the ledger
             * under the approve diagram. It is not queued behind anything; it
             * waits for its own subject to reach the fold. See Beat.own.
             */
            const subject = b.own ? el.querySelector<HTMLElement>(b.own) : null;
            if (b.own && !subject)
              console.warn(
                `[ScrollSequence] ${spec.id}: nothing matches own "${b.own}"`,
              );

            if (subject) {
              /* Armed below, once the section's own flags exist — it has to
                 know whether the section has arrived before it may run. */
              child.timeScale(MOTION.pace);
              owned.push({ child, subject });
              continue;
            }

            /* A child has to be running for its parent to render it; these come
               back paused because a factory has no idea when it will be used. */
            child.paused(false);
            const at = Math.max(0, cursor + (b.delay ?? 0));
            beats.add(child, at);
            cursor = at + child.duration();
          }
          beats.timeScale(MOTION.pace);

          /* Motion that never finishes — the connector lights, the glows
             drifting, the passport cards breathing. */
          const loops = [spec.ambient ?? []].flat().map((make) => make(el));

          /*
           * Whether the section is in front of the reader right now, kept by the
           * trigger below and read in two places that both need it.
           *
           * The loops are started by the entrance finishing rather than by the
           * trigger, because they are the continuation of it — a light running
           * down a wire that has not been drawn yet reveals itself already half
           * way along. But an entrance can finish long after the reader has
           * scrolled past it, so this is the guard that stops a section coming
           * to life in a part of the page nobody is looking at.
           */
          let onScreen = false;
          const runLoops = () => onScreen && loops.forEach((l) => l.play());
          if (loops.length) beats.eventCallback("onComplete", runLoops);

          /*
           * Once, not every time.
           *
           * An entrance says "this arrived", and it is only true the first time:
           * replaying it on the way back up the page would mean a reader who
           * scrolls up to re-read something watches it be delivered to them
           * again. The deck replayed on every arrival because on a deck there
           * was no "back up the page" — a section you returned to had been off
           * screen entirely.
           */
          let played = false;
          /* Beats with a trigger of their own that were told to run before this
             section had arrived, and are waiting for it — see below. */
          const waiting: (() => void)[] = [];
          const start = () => {
            if (played) return;
            played = true;
            beats.restart();
            for (const retry of waiting.splice(0)) retry();
          };

          /* The one section that does not wait to be scrolled to: it is the
             page opening, and it is already in front of the reader. */
          if (spec.plays === "load") start();

          const trigger = ScrollTrigger.create({
            trigger: el,
            /*
             * A quarter of the way up the window, and out again a quarter of
             * the way down. The entrance wants the section far enough in to be
             * worth watching and still with room to play; the loops want to be
             * running for as long as any part of it is worth looking at, which
             * is most of the time a full-height section is on screen.
             */
            start: "top 75%",
            end: "bottom 25%",
            onToggle: (self) => {
              onScreen = self.isActive;
              if (!self.isActive) {
                loops.forEach((l) => l.pause());
                return;
              }
              start();
              /* Already arrived, on a second pass: the entrance's onComplete
                 fired long ago, so the loops have to be picked up here. */
              if (beats.progress() === 1) runLoops();
            },
          });

          /* onToggle only fires on a CHANGE, and a section that is already on
             screen when the trigger is created never changes into it. */
          if (trigger.isActive) {
            onScreen = true;
            start();
          }

          /* --- beats with a trigger of their own ------------------------- */

          for (const { child, subject } of owned) {
            /*
             * The scroll position at which the subject's top edge reaches
             * MOTION.own.line down the window, worked out from where it RESTS
             * rather than from where it is being held — see the note on
             * MOTION.own and authoredTop. Re-derived every time, because both
             * terms are functions of the window.
             */
            const line = () =>
              authoredTop(subject) - window.innerHeight * MOTION.own.line;

            let ran = false;
            const run = () => {
              if (ran) return;

              /*
               * Three things have to be true, and each of them was a bug that
               * this beat shipped without.
               *
               * The SECTION has to have arrived first. ScrollTrigger fires
               * onEnter even when a single frame carries the scroll clean past
               * a whole range, but it does not fire onToggle — which is what
               * the section's entrance hangs on — so one flick of a trackpad
               * past this section ran the rails while the panels they belong to
               * were still at opacity 0.2, permanently. Reproduced with a
               * 1800px wheel jump. Anything refused for this reason is not
               * dropped: it waits, and `start` retries it.
               *
               * The reader has to actually be PAST the line. The check below is
               * also what arms a subject that is already in view on a reload,
               * and without it that path fired at whatever scroll the page was
               * restored to.
               *
               * And the subject has to still be on screen. Reloading part way
               * down the page put the scroll far beyond the line with the rail
               * 1529px and the ledger 508px ABOVE the window, and played both
               * of them there — which is the exact thing this whole mechanism
               * exists to prevent, and it spent them, so scrolling back up
               * showed a rail that never opened. Reproduced against a
               * pre-change baseline, which did none of it.
               */
              if (!played) {
                if (!waiting.includes(run)) waiting.push(run);
                return;
              }
              if (window.scrollY < line()) return;
              /* As it rests, not as this beat is holding it — see the note on
                 the same check in the phone branch. */
              const r = authoredRect(subject);
              if (r.bottom <= 0 || r.top >= window.innerHeight) return;

              ran = true;
              child.restart();
            };

            /*
             * Both directions, because either can be the first time the reader
             * meets it: down the page in the ordinary way, or back UP to it
             * from below after a jump carried them past.
             */
            ScrollTrigger.create({
              trigger: subject,
              start: line,
              end: () => line() + 1,
              onEnter: run,
              onEnterBack: run,
            });
            /* And already past it on arrival, which crossing nothing would
               never catch — a reload part way down the page. */
            run();
          }
        }

        /* --- depth --------------------------------------------------------
         *
         * Everything above decides WHEN a section animates; this decides how
         * far away each part of it is while the reader scrolls past. The two
         * never touch the same property — arrivals own x/y and opacity on
         * [data-reveal], depth owns xPercent/yPercent and the wrappers — so
         * they run over the top of each other with no arbitration. See
         * depth.ts, which is the whole of what it does and why.
         */
        parallaxScene({ tier: "full" });

        flyCard("full");
        foldHero({ trigger: section("hero"), start: "top top" });
      });
    },
    { scope: root, dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="contents">
      {children}
      <noscript>
        {/* Without JS nothing ever plays, so undo the CSS start state. */}
        <style
          dangerouslySetInnerHTML={{ __html: "[data-reveal]{opacity:1}" }}
        />
      </noscript>
    </div>
  );
}
