"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION } from "./motion";
import { SECTIONS } from "./sections";
import { heroFold, navbarDrop, squadTrail } from "./timelines";

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
       * Below the gate, and for anyone who asked for reduced motion, nothing
       * plays at all. The CSS start state is behind the same query, so the
       * server-rendered markup is already the finished page and there is
       * nothing to undo.
       */
      mm.add(`not all and ${MOTION.enabled}`, () => {});

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

        /* --- the Squad card's journey ------------------------------------ */

        /*
         * The one piece of motion here that spans two sections, and the one the
         * reader performs rather than watches: the Squad card leaves the hero's
         * fan, dims, travels down the page behind everything, and arrives in the
         * approve diagram's slot. See squadTrail for the geometry.
         *
         * A proxy object rather than the card itself, so that `scrub` has
         * something to lag and one function still owns every property the card
         * has. Scrubbed with a lag rather than locked to the scrollbar: rigid,
         * it reads as a scrollbar; a fraction of a second behind, it reads as an
         * object with weight being carried down the page.
         */
        const heroEl = find("hero");
        const approveEl = find("approve");

        /*
         * The fan closing, first — see heroFold. The four passport cards fold
         * back in behind the Squad card as the reader scrolls off the hero, and
         * only once they are gone does the Squad card set off down the page.
         *
         * Expressed as a fraction of the window rather than of the hero: it is
         * an amount of scrolling, and what makes it feel right is how far the
         * reader has had to move, not how tall the section they moved out of
         * happened to be.
         */
        const foldOut = `${MOTION.hero.fold.out * 100}%`;
        const fold = heroEl && heroFold(heroEl);

        const trail = squadTrail(document);
        if (trail) {
          const at = { p: 0 };
          const run = gsap.to(at, {
            p: 1,
            ease: "none",
            paused: true,
            onUpdate: () => trail.apply(at.p),
          });

          if (heroEl && approveEl)
            ScrollTrigger.create({
              trigger: heroEl,
              /* Where the fold leaves off. The card does not start down the
                 page until the fan around it has closed. */
              start: `top top-=${foldOut}`,
              /*
               * Ending on the approve section's centre rather than its top: the
               * card has to be in its slot by the time the diagram is being
               * read, not by the time the heading appears above it.
               */
              endTrigger: approveEl,
              end: "center center",
              scrub: MOTION.trail.lag,
              animation: run,
              /* Re-measure and re-place: a resize moves both slots, and the
                 card has to be put back on the line between where they are now
                 rather than left on the one between where they were. This is
                 also what places it for the first time, at progress 0. */
              onRefresh: () => {
                trail.measure();
                trail.apply(at.p);
              },
            });

          /*
           * Measured again once the hero has settled.
           *
           * The first refresh happens on load, while the hero's card is still
           * lying flat and turned on its side — its bounding box at that moment
           * is a card mid-quarter-turn, and the journey would set off from the
           * wrong place. This is the one thing on the page that has to wait for
           * an animation to finish before it can be measured.
           */
          /*
           * Both of these wait for the hero to finish arriving, and for the
           * same reason: they are about the four cards and the one card the
           * hero's entrance is still moving.
           *
           * The fold cannot be created any earlier — a scrubbed timeline
           * renders as soon as its trigger exists, and rendering this one at
           * progress 0 puts the cards in their resting state, which is the
           * entrance skipping to its own end.
           *
           * And the traveller has nothing to measure until then: the Squad card
           * spends the entrance mid-quarter-turn, and placing it against that
           * rect is what used to put a second Squad card on the hero for the
           * first two and a half seconds.
           */
          gsap.delayedCall(MOTION.trail.settle, () => {
            if (heroEl && fold)
              ScrollTrigger.create({
                trigger: heroEl,
                start: "top top",
                end: `+=${foldOut}`,
                scrub: MOTION.trail.lag,
                animation: fold,
              });
            trail.arm();
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
