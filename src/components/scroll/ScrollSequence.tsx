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

/* The page as a page. */

/** Everything the sequence writes an inline style to, as one selector. */
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
  /*
   * The travelling Squad card, which is written to on every frame of the
   * journey and must be put back to the stylesheet's nothing when the window
   * leaves the gate — see squadTravel and .squad-trail.
   */
  ".squad-trail-frame",
  "[data-card-turn]",
].join(",");

/** Put the page back the way the server rendered it. */
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
   */
  for (const cell of document.querySelectorAll<HTMLElement>("[data-count]"))
    if (cell.dataset.count) cell.textContent = cell.dataset.count;

  for (const bar of document.querySelectorAll<HTMLElement>("[data-meter]"))
    if (bar.dataset.meter) bar.style.width = `${bar.dataset.meter}%`;
};

export default function ScrollSequence({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  /*
   * This component lives in the root layout, and a layout does NOT unmount
   * when the route changes — only <main> does.
   */
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      const section = (id: string) =>
        document.querySelector<HTMLElement>(`[data-sequence-section='${id}']`);

      /*
       * --- the hero's fan closing ------------------------------------------
       * The one beat on the page the reader performs rather than watches.
       */
      /*
       * --- the Squad card's journey --------------------------------------
       * The one piece of motion on this page that spans more than a section,
       * and the second the reader performs rather than watches: the card
       * leaves the hero's fan once the fan has folded into it,.
       */
      const flyCard = (tier: "full" | "phone") => {
        const scene = document.querySelector<HTMLElement>(".scene-track");
        const travel = scene && squadTravel(document.documentElement, tier);
        if (!travel) {
          /*
           * Nothing to fly the card with, so give the two slots back to their
           * own sections.
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
         * has to be written rather than left to the stylesheet.
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
           */
          onRefreshInit: () => travel.measure(),
          /*
           * And re-placed after them: a resize moves all three slots and every
           * seam between them, and the card has to be put back on the line
           * between where they are now rather than left on the one between
           * where they were.
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
        /** How much scrolling it takes, as a fraction of the window. */
        out?: number;
      }) => {
        const heroEl = section("hero");
        const fold = heroEl && heroFold(heroEl);
        if (!heroEl || !fold || !trigger) return;

        const { lag, settle } = MOTION.hero.fold;

        /* Built late, and it has to be. */
        gsap.delayedCall(settle, () => {
          ScrollTrigger.create({
            trigger,
            start,
            /* A fraction of the WINDOW rather than of the hero. */
            end: `+=${out * 100}%`,
            scrub: lag,
            animation: fold,
          });
          ScrollTrigger.refresh();
        });
      };

      /*
       * Below every gate — a window with no height to animate in, or a reader
       * who asked for less motion — no SEQUENCE plays at all.
       */
      mm.add(
        "not all and (min-height: 480px) and (prefers-reduced-motion: no-preference)",
        unwind,
      );

      /*
       * A window too short to lay the wide page out in gets depth, and only
       * depth.
       */
      mm.add(PARALLAX.calm, () => parallaxScene({ tier: "calm" }));

      /*
       * ---------------------------------------------------------------------
       * THE PHONE The same beats, the same ambients and the same depth system,
       * cut a different way: every beat carries its own trigger rather than
       * queueing behind the one above it off the section's.
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
           * The loops start with the section's FIRST beat rather than its
           * last, which is the one thing about them the column changes.
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
           * and the reader is already looking at it.
           */
          const queued =
            spec.plays === "load" ? gsap.timeline({ paused: true }) : null;
          let cursor = 0;

          for (const b of beats) {
            const child = b.play(el);

            if (queued) {
              /*
               * A child has to be running for its parent to render it; these
               * come back paused because a factory has no idea when it will be
               * used.
               */
              child.paused(false);
              const at = Math.max(0, cursor + (b.delay ?? 0));
              queued.add(child, at);
              cursor = at + child.duration();
              continue;
            }

            /*
             * Left paused, unlike the queued ones: this is a timeline of its
             * own and nothing but its own trigger may start it.
             */
            child.timeScale(MOTION.pace);
            child.eventCallback("onComplete", landed);

            /*
             * What this beat is about: whatever it names, or else the first
             * thing it moves.
             */
            const subject = (b.own && one(el, b.own)) || leadOf(child);
            if (!subject) {
              /*
               * Nothing this tier renders — the hero's other fan, a diagram's
               * other wiring.
               */
              child.progress(1);
              continue;
            }

            const line = () =>
              authoredTop(subject) - window.innerHeight * MOTION.own.line;

            let ran = false;
            const run = () => {
              if (ran) return;
              /*
               * Past the line, and still somewhere a reader could be looking —
               * the same two conditions the wide tier's own beats carry, and
               * for the same reasons.
               */
              if (window.scrollY < line()) return;
              /* Where the subject RESTS, not where this beat is holding it. */
              const r = authoredRect(subject);
              if (r.bottom <= 0 || r.top >= window.innerHeight) return;

              ran = true;
              child.restart();
            };

            /*
             * Both directions: down the page in the ordinary way, or back UP
             * to it from below after a jump carried the reader past.
             */
            ScrollTrigger.create({
              trigger: subject,
              start: line,
              end: () => line() + 1,
              onEnter: run,
              onEnterBack: run,
            });
            /*
             * And already past it on arrival, which crossing nothing would
             * never catch.
             */
            run();
          }

          if (queued) {
            /*
             * The hero is one run again down here, so its loops keep the wide
             * tier's bargain: the cards start breathing when the fan has
             * finished opening, not while it is still opening.
             */
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
        /*
         * Not "bottom bottom" — the deck clears the fold too early for that to
         * mean "done with it" any more.
         */
        foldHero({
          trigger: one(section("hero") ?? document.body, "[data-reveal='fan']"),
          start: `bottom bottom-=${MOTION.hero.foldPhone.lead * 100}%`,
          out: MOTION.hero.foldPhone.out,
        });

        /* And the belt to the braces. */
        for (const node of document.querySelectorAll<HTMLElement>(
          "[data-reveal]",
        ))
          if (!node.style.opacity) node.style.opacity = "1";
      });

      mm.add(MOTION.enabled, () => {
        const find = section;

        /* The navbar is not one of the sections. */
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
             * A beat about something this section's own moment cannot see —
             * the strength rails at the foot of the comparison panels, the
             * ledger under the approve diagram.
             */
            const subject = b.own ? el.querySelector<HTMLElement>(b.own) : null;
            if (b.own && !subject)
              console.warn(
                `[ScrollSequence] ${spec.id}: nothing matches own "${b.own}"`,
              );

            if (subject) {
              /*
               * Armed below, once the section's own flags exist — it has to
               * know whether the section has arrived before it may run.
               */
              child.timeScale(MOTION.pace);
              owned.push({ child, subject });
              continue;
            }

            /*
             * A child has to be running for its parent to render it; these
             * come back paused because a factory has no idea when it will be
             * used.
             */
            child.paused(false);
            const at = Math.max(0, cursor + (b.delay ?? 0));
            beats.add(child, at);
            cursor = at + child.duration();
          }
          beats.timeScale(MOTION.pace);

          /*
           * Motion that never finishes — the connector lights, the glows
           * drifting, the passport cards breathing.
           */
          const loops = [spec.ambient ?? []].flat().map((make) => make(el));

          /*
           * Whether the section is in front of the reader right now, kept by
           * the trigger below and read in two places that both need it.
           */
          let onScreen = false;
          const runLoops = () => onScreen && loops.forEach((l) => l.play());
          if (loops.length) beats.eventCallback("onComplete", runLoops);

          /* Once, not every time. */
          let played = false;
          /*
           * Beats with a trigger of their own that were told to run before
           * this section had arrived, and are waiting for it — see below.
           */
          const waiting: (() => void)[] = [];
          const start = () => {
            if (played) return;
            played = true;
            beats.restart();
            for (const retry of waiting.splice(0)) retry();
          };

          /*
           * The one section that does not wait to be scrolled to: it is the
           * page opening, and it is already in front of the reader.
           */
          if (spec.plays === "load") start();

          const trigger = ScrollTrigger.create({
            trigger: el,
            /*
             * A quarter of the way up the window, and out again a quarter of
             * the way down.
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
              /*
               * Already arrived, on a second pass: the entrance's onComplete
               * fired long ago, so the loops have to be picked up here.
               */
              if (beats.progress() === 1) runLoops();
            },
          });

          /*
           * onToggle only fires on a CHANGE, and a section that is already on
           * screen when the trigger is created never changes into it.
           */
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
             * MOTION.own and authoredTop.
             */
            const line = () =>
              authoredTop(subject) - window.innerHeight * MOTION.own.line;

            let ran = false;
            const run = () => {
              if (ran) return;

              /*
               * Three things have to be true, and each of them was a bug that
               * this beat shipped without.
               */
              if (!played) {
                if (!waiting.includes(run)) waiting.push(run);
                return;
              }
              if (window.scrollY < line()) return;
              /*
               * As it rests, not as this beat is holding it — see the note on
               * the same check in the phone branch.
               */
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
            /*
             * And already past it on arrival, which crossing nothing would
             * never catch — a reload part way down the page.
             */
            run();
          }
        }

        /*
         * --- depth --------------------------------------------------------
         * Everything above decides WHEN a section animates; this decides how
         * far away each part of it is while the reader scrolls past.
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
