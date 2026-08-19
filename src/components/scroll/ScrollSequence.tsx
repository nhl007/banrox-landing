"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PARALLAX } from "./depth";
import { MOTION } from "./motion";
import { parallaxScene } from "./parallax";
import { SECTIONS } from "./sections";
import { heroFold, navbarDrop } from "./timelines";

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
 * card); depth reaches the same [data-reveal] elements and the four wrapper
 * layers. Nothing else on the page is touched by either.
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
  ".screen-copy",
  ".screen-payload",
  ".screen-glow",
  ".stage-backdrop",
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

      /*
       * Below the gate, and for anyone who asked for reduced motion, no
       * SEQUENCE plays at all. The CSS start state is behind the same query, so
       * the server-rendered markup is already the finished page and there is
       * nothing to play.
       *
       * There is something to undo, though, if the reader ARRIVED here rather
       * than started here — see unwind. This handler is the right place for it
       * because gsap.matchMedia reverts the contexts that stopped matching
       * before it runs the ones that started, so by the time this is called the
       * sequence has already let go of the page.
       */
      mm.add(`not all and ${MOTION.enabled}`, unwind);

      /*
       * What a phone does get is depth, and only depth.
       *
       * Nothing is hidden here and nothing waits to arrive — the page is
       * delivered finished — so this adds no start state to undo and cannot
       * strand anything blank if it fails to run. It is the ambient light
       * moving at its own speed behind text that moves at the page's, which is
       * the one part of the whole system that still means something when a
       * section is a column of its own height rather than a screen. Reduced
       * motion is excluded by the query itself. See PARALLAX.calm.
       */
      mm.add(PARALLAX.calm, () => parallaxScene({ calm: true }));

      mm.add(MOTION.enabled, () => {
        const find = (id: string) =>
          document.querySelector<HTMLElement>(`[data-sequence-section='${id}']`);

        /* The navbar is not one of the sections. It is above them and it drops
           in on load, which is what the page opens on. */
        const navEl = find("navbar");
        if (navEl) navbarDrop(navEl).timeScale(MOTION.pace).play();

        for (const spec of SECTIONS) {
          const el = find(spec.id);
          if (!el) {
            console.warn(`[ScrollSequence] no element for section "${spec.id}"`);
            continue;
          }

          /*
           * The section's beats, in order, in one paused timeline — the same
           * factories and the same delays as ever, a negative one still
           * overlapping the beat above it.
           */
          const beats = gsap.timeline({ paused: true });
          let cursor = 0;
          for (const b of spec.beats) {
            const child = b.play(el);
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
          const start = () => {
            if (played) return;
            played = true;
            beats.restart();
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
        parallaxScene({ calm: false });

        /* --- the hero's fan closing --------------------------------------
         *
         * The one beat on the page the reader performs rather than watches. As
         * they scroll off the hero the four passport cards fold back in behind
         * the Squad card and are gone, leaving the product alone on the screen
         * — see heroFold for the geometry, MOTION.hero.fold for the numbers.
         *
         * The only ARRIVAL on the page driven this way. Everything the loop
         * above sets up is an event with a duration that plays once when its
         * section comes into view; this has no duration at all, only a
         * distance, and every frame of it belongs to the reader. (Depth is
         * scrubbed too, but depth is not an arrival — it is where a layer sits
         * while the reader goes past it.)
         */
        const heroEl = find("hero");
        const fold = heroEl && heroFold(heroEl);

        if (heroEl && fold) {
          const { out, lag, settle } = MOTION.hero.fold;

          /*
           * Built late, and it has to be.
           *
           * A scrubbed timeline renders as soon as its ScrollTrigger exists,
           * and at the top of the page it renders at progress 0 — which here is
           * the four cards at x: 0, opacity: 1, their resting state. That is
           * precisely where heroCards is still carrying them, so a fold created
           * any earlier writes the end of the hero's entrance over the top of
           * it every frame and the fan never visibly opens. See
           * MOTION.hero.fold.settle.
           *
           * The refresh afterwards is because every other trigger on the page
           * was positioned before this one existed.
           */
          gsap.delayedCall(settle, () => {
            ScrollTrigger.create({
              trigger: heroEl,
              /*
               * A fraction of the WINDOW rather than of the hero. It is an
               * amount of scrolling, and what makes it feel right is how far
               * the reader has had to move — not how tall the section they
               * moved out of happened to be.
               */
              start: "top top",
              end: `+=${out * 100}%`,
              scrub: lag,
              animation: fold,
            });
            ScrollTrigger.refresh();
          });
        }
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
