"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION } from "./motion";
import { SECTIONS } from "./sections";
import { navbarDrop } from "./timelines";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/*
 * Scroll decides when things play, and nothing else.
 *
 * The page scrolls the way any page does — the wheel moves it, the scrollbar
 * means what it says, and nothing is ever pinned or held. What the sequence
 * adds is timing: a beat waits until the thing it animates is in front of the
 * reader, then plays at its own speed, to the end, once.
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
       * already correct and there is nothing to undo.
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
           * A section's beats queue behind each other rather than overlapping,
           * and this is what makes that possible without any of them naming the
           * others. On a tall window a section's heading and its payload are
           * both on screen at load — the hero's copy and its card scene are the
           * standing example — so both triggers fire on the same frame, and
           * without this the page would open with everything moving at once
           * instead of in the order it reads.
           *
           * The wait is only ever the difference: a beat whose subject arrives
           * long after the one above it has already finished starts the instant
           * it is reached, which is every beat further down the page.
           */
          let free = performance.now() + navDone;

          /* Kept so the ambient below can wait for the section to finish
             arriving before it starts. */
          const played: gsap.core.Timeline[] = [];

          for (const b of spec.beats) {
            /*
             * A beat names the element whose arrival fires it. Falling back to
             * the section rather than skipping the beat: a missing anchor is a
             * markup typo, and a section that animates slightly early is a much
             * smaller failure than one that never animates at all.
             */
            const anchor = b.on ? el.querySelector(`[data-beat='${b.on}']`) : el;
            if (b.on && !anchor)
              console.warn(`[ScrollSequence] "${spec.id}" has no [data-beat='${b.on}']`);

            const tl = b.play(el).timeScale(MOTION.pace);
            played.push(tl);
            ScrollTrigger.create({
              trigger: anchor ?? el,
              start: b.start,
              /*
               * `once` rather than a toggle: the trigger kills itself after
               * firing, so there is nothing left to run backwards, and nothing
               * left measuring on every scroll for the rest of the page's life.
               */
              once: true,
              onEnter: () => {
                const now = performance.now();
                const wait = Math.max(0, (free - now) / 1000) + (b.delay ?? 0);
                free = now + (wait + tl.duration() / MOTION.pace) * 1000;
                /*
                 * delayedCall rather than tl.delay(). A timeline's own delay is
                 * spent as its parent plays it in; calling play() on a paused
                 * root timeline starts it from the playhead and the delay is
                 * simply never applied — the beats all fired at once.
                 */
                if (wait) gsap.delayedCall(wait, () => tl.play());
                else tl.play();
              },
            });
          }

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
