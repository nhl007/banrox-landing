"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION, ON_LOAD } from "./motion";
import { SECTIONS } from "./sections";
import { navbarDrop } from "./timelines";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/*
 * Scroll decides when a section plays, and nothing else.
 *
 * The page scrolls the way any page does — the wheel moves it, the scrollbar
 * means what it says, and nothing is ever pinned, held or scrolled for you.
 * What the sequence adds is timing: a section waits until it is in front of the
 * reader, then plays at its own speed, to the end, once.
 *
 * One trigger per section. That is only honest because a section is exactly one
 * screen tall (see .screen in globals.css) — the heading and the diagram under
 * it are on screen at the same moment, so one arrival can speak for both. Each
 * section used to carry a trigger per beat, and an anchor in the markup for
 * each of those, because a section could be twice the height of the window and
 * a single trigger would play its lower half below the fold.
 *
 * The beats inside a section still play in order. They queue behind each other
 * off the one trigger, which is what `free` below is for.
 *
 * The hero is the exception, because it is on screen before there is any
 * scrolling to respond to: it fires off the page load (start: ON_LOAD).
 *
 * Once is the whole contract. Nothing rewinds on the way back up: scrolling
 * away from something you have already watched arrive and watching it leave
 * again backwards is a second animation nobody asked for, and it makes the page
 * feel like it is resisting the scroll rather than responding to it.
 */

export default function ScrollSequence({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      /*
       * Below the breakpoint, and for anyone who asked for reduced motion, the
       * page is ordinary: no triggers, no timelines, nothing hidden. The CSS
       * start state is behind the same query, so the server-rendered markup is
       * already correct and there is nothing to undo. It is also the breakpoint
       * the one-screen layout starts at, which is not a coincidence — a section
       * that is allowed to be taller than the window is a section whose lower
       * half would animate out of sight.
       */
      mm.add(`not all and ${MOTION.enabled}`, () => {});

      mm.add(MOTION.enabled, () => {
        const find = (id: string) =>
          document.querySelector<HTMLElement>(`[data-sequence-section='${id}']`);

        /* --- navbar ----------------------------------------------------- */

        const navEl = find("navbar");
        const navDone = navEl
          ? (navbarDrop(navEl).timeScale(MOTION.pace).play().duration() /
              MOTION.pace) *
            1000
          : 0;

        /* --- sections --------------------------------------------------- */

        for (const spec of SECTIONS) {
          const el = find(spec.id);
          if (!el) {
            console.warn(`[ScrollSequence] no element for section "${spec.id}"`);
            continue;
          }

          /*
           * When the section's last beat will have finished, as a timestamp.
           *
           * Every beat in a section now goes off on the same frame, so this is
           * the only thing putting them in order: each one asks how long is
           * left of the queue, adds its own delay to that, and books the slot
           * after itself. A negative delay eats into the beat above it, which
           * is how two beats overlap without either naming the other.
           *
           * The hero's opening navbar is in front of all of it, which is why
           * the clock starts there rather than at now.
           */
          let free = performance.now() + navDone;

          /* Kept so the ambient below can wait for the section to finish
             arriving before it starts. */
          const played: gsap.core.Timeline[] = [];

          const queue = spec.beats.map((b) => {
            const tl = b.play(el).timeScale(MOTION.pace);
            played.push(tl);

            return () => {
              const now = performance.now();
              const wait = Math.max(0, (free - now) / 1000) + (b.delay ?? 0);
              free = now + (wait + tl.duration() / MOTION.pace) * 1000;
              /*
               * delayedCall rather than tl.delay(). A timeline's own delay is
               * spent as its parent plays it in; calling play() on a paused
               * root timeline starts it from the playhead and the delay is
               * simply never applied — the beats all fired at once.
               *
               * `> 0` rather than truthy: a beat with a negative delay at the
               * head of an empty queue works out to a negative wait, which is
               * not something to hand to a timer.
               */
              if (wait > 0) gsap.delayedCall(wait, () => tl.play());
              else tl.play();
            };
          });

          const arrive = () => queue.forEach((fire) => fire());

          /* The section already on screen has no arrival to wait for — the
             reader is looking at it — so it goes off with the page instead. */
          if (spec.start === ON_LOAD) arrive();
          else
            ScrollTrigger.create({
              trigger: el,
              start: spec.start,
              /*
               * `once` rather than a toggle: the trigger kills itself after
               * firing, so there is nothing left to run backwards, and nothing
               * left measuring on every scroll for the rest of the page's life.
               */
              once: true,
              onEnter: arrive,
            });

          /*
           * Motion that runs on its own clock, held back by two conditions.
           *
           * On screen, because a loop nobody is looking at is a ticker callback
           * burning frames for the life of the page. And arrived — the section's
           * last beat has played out — because ambient motion is what a thing
           * does once it is there. The connector lights are the case that makes
           * this necessary rather than tidy: the visibility trigger fires as the
           * section's top crosses the bottom of the window, seconds before the
           * diagram animates, and a light started then would be running down a
           * line that has not been drawn yet, with the wipe uncovering it
           * already halfway along.
           */
          const loops = [spec.ambient ?? []].flat().map((make) => make(el));
          if (loops.length) {
            let onScreen = false;
            let arrived = false;
            const sync = () =>
              loops.forEach((loop) => (onScreen && arrived ? loop.play() : loop.pause()));

            ScrollTrigger.create({
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              onToggle: (self) => {
                onScreen = self.isActive;
                sync();
              },
            });

            /* Beats are declared in the order they play, so the last one
               finishing is the section finishing. A section with an ambient and
               no beats has nothing to wait for. */
            const last = played[played.length - 1];
            if (last)
              last.eventCallback("onComplete", () => {
                arrived = true;
                sync();
              });
            else {
              arrived = true;
              sync();
            }
          }
        }

        /* --- settling --------------------------------------------------- */

        /*
         * The page coming to rest on a section rather than between two.
         *
         * Every section is exactly one screen, so there is a right answer for
         * where a scroll should stop — and without this it mostly stops
         * somewhere else. Measured at 1440x900: an ordinary flick came to rest
         * up to 360px off a section boundary, which is 40% of the window given
         * over to the section you were leaving.
         *
         * This is a settle, not a hijack. It never moves the page while the
         * reader is scrolling, only once they have stopped; it never carries
         * them past what they asked for, only the rest of the way to the
         * nearest section; and a new scroll interrupts it. Everything below the
         * last section is left alone entirely — see snapTo.
         */
        const stops = () => {
          const found: number[] = [];
          for (const spec of SECTIONS) {
            const el = find(spec.id);
            if (!el) continue;
            found.push(Math.round(el.getBoundingClientRect().top + window.scrollY));
          }
          if (!found.length) return found;

          /* The hero's rest position is the top of the page, not the top of the
             hero: the navbar sits above it and is part of it, and the two
             together are one screen. */
          if (navEl) found[0] = Math.max(0, found[0] - navEl.offsetHeight);

          /* The end of the last section, which is where the footer starts. It
             is a rest position like any other; past it, nothing is. */
          const last = find(SECTIONS[SECTIONS.length - 1].id);
          if (last)
            found.push(Math.round(last.getBoundingClientRect().bottom + window.scrollY));

          /*
           * Held to somewhere the page can actually go. On a window taller than
           * the footer the footer's top is past the end of the document, so it
           * is a rest position nobody can reach — and an unreachable last stop
           * takes the "past the end, nothing pulls" rule with it, leaving the
           * whole footer being dragged back to the section above it. Clamped,
           * the last stop becomes the bottom of the page, which on a window
           * that tall shows the footer whole anyway.
           */
          const max = ScrollTrigger.maxScroll(window);
          return found.map((stop) => Math.min(stop, max));
        };

        /* Where the page last came to rest. "The next section" is measured from
           here rather than from wherever the gesture happened to end, which is
           what makes a short scroll and a long one both go forwards. */
        let settled: number | null = null;

        const nearest = (rest: number[], y: number) =>
          rest.reduce((best, stop) =>
            Math.abs(stop - y) < Math.abs(best - y) ? stop : best,
          );

        ScrollTrigger.create({
          start: 0,
          end: () => ScrollTrigger.maxScroll(window),
          snap: {
            snapTo: (progress) => {
              const max = ScrollTrigger.maxScroll(window);
              if (!max) return progress;

              const y = progress * max;
              const rest = stops();
              if (!rest.length) return progress;

              /*
               * Nothing pulls once the last section is behind you. The footer
               * is 1878px of links and legal text — it is not a screen, it is a
               * footer, and it has to scroll like one.
               *
               * This is the whole reason the rule is "past the end" rather than
               * "further than half a screen from any section": with a distance
               * cut-off the footer's own top stays in range for 495px, so every
               * wheel gesture inside it was dragged straight back to the top of
               * it and the footer could not be read at all.
               */
              if (y >= rest[rest.length - 1]) {
                settled = null;
                return progress;
              }

              /* Nothing to measure a direction from: the first settle of the
                 page, a reload part way down, a followed anchor. */
              if (settled === null || !rest.includes(settled)) {
                settled = nearest(rest, y);
                return settled / max;
              }

              /* Too small to be a request. Without this a trackpad under a
                 resting hand is a section. */
              const moved = y - settled;
              if (Math.abs(moved) < window.innerHeight * MOTION.settle.deadzone)
                return settled / max;

              /*
               * Everything ahead of where they were, in the direction they went
               * — and of that, as far as they actually got, but never less than
               * one section. So a wheel notch is one section, a hard throw is
               * however many it carried, and neither is ever answered by going
               * back to where it started.
               */
              const from = settled;
              const ahead =
                moved > 0
                  ? rest.filter((stop) => stop > from)
                  : rest.filter((stop) => stop < from).reverse();
              if (!ahead.length) return settled / max;

              const passed = ahead.filter((stop) =>
                moved > 0 ? stop <= y : stop >= y,
              );
              settled = passed.length ? passed[passed.length - 1] : ahead[0];
              return settled / max;
            },
            duration: MOTION.settle.duration,
            delay: MOTION.settle.delay,
            ease: MOTION.settle.ease,
          },
        });

        /*
         * Images settle after first paint and change every section's height, so
         * the trigger points measured at mount are wrong until they land.
         */
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="contents">
      {children}
      <noscript>
        {/* Without JS nothing ever plays, so undo the CSS start state. */}
        <style dangerouslySetInnerHTML={{ __html: "[data-reveal]{opacity:1}" }} />
      </noscript>
    </div>
  );
}
