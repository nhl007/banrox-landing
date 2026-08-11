"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION } from "./motion";
import { SECTIONS, defaults, type Shape } from "./sections";
import { navbarIntro } from "./timelines";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/*
 * Scroll position drives everything.
 *
 * No scroll event is ever refused — the wheel always works and the scrollbar
 * always means what it says. What an animated section does is *hold its
 * position* while its timeline is scrubbed by the wheel: the user keeps
 * scrolling, the animation keeps advancing, and the page does not move on.
 * Past the hold the same timeline runs backwards, and only when that outro has
 * finished does the pin release and the next section arrive.
 *
 * Scrolling back up retraces all of it exactly, because it is one timeline
 * instance having its playhead dragged rather than a forward animation being
 * re-triggered.
 */

/**
 * Maps progress through the pin to timeline progress: forward from wherever the
 * pre-roll left off, hold, then backward to zero.
 */
function shapeProgress(p: number, s: Shape, lead: number) {
  const [i0, i1] = s.in;
  const [o0, o1] = s.out;
  if (p <= i0) return lead;
  if (p < i1) return lead + (1 - lead) * ((p - i0) / (i1 - i0));
  if (p <= o0) return 1;
  if (p < o1) return 1 - (p - o0) / (o1 - o0);
  return 0;
}

/**
 * Re-runs a scroll-driven tween at its trigger's current position.
 *
 * Via zero rather than straight to the value, because setting a progress a
 * tween already holds renders nothing — and after a refresh that is exactly the
 * case: ScrollTrigger restores the driver's progress but not the write its
 * onUpdate performed. The trip through zero is suppressed so only the second
 * call reports, and it is synchronous, so nothing paints in between.
 */
const replay = (tween: gsap.core.Tween, trigger: ScrollTrigger) => () => {
  tween.progress(0, true);
  tween.progress(trigger.progress);
};

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
        if (navEl) {
          const tl = navbarIntro(navEl);

          /*
           * The one thing not driven by scroll: the navbar drops in once on
           * load, so the page opens on the navbar alone. From then on scroll
           * owns it — progress 1 is dropped in, 0 is folded away above the top
           * edge.
           *
           * The drop-in drives tl.progress from a proxy rather than calling
           * tl.play(). play() leaves the timeline *running*, and a running
           * timeline overrides every scrub update on the very next frame — the
           * navbar would simply refuse to fold. Scrubbing only ever sets
           * progress on a paused timeline.
           */
          const load = { v: 0 };
          const dropIn = gsap.to(load, {
            v: 1,
            ...MOTION.navbar.drop,
            onUpdate: () => tl.progress(load.v),
          });

          const p = { v: 0 };
          ScrollTrigger.create({
            /*
             * No trigger element on purpose: with one, bare numbers are read
             * relative to that element, and the navbar's range is simply the
             * first stretch of the document's own scroll.
             */
            start: 0,
            end: () => navEl.offsetHeight,
            scrub: MOTION.scrub,
            animation: gsap.fromTo(
              p,
              { v: 0 },
              {
                v: 1,
                ease: "none",
                onUpdate: () => {
                  /* Scrolling during the drop-in hands control straight over. */
                  if (p.v > 0) dropIn.kill();
                  tl.progress(1 - p.v);
                },
              },
            ),
          });
        }

        /* --- sections --------------------------------------------------- */

        /* One per section; see onRefresh at the bottom for what they are for. */
        const resync: (() => void)[] = [];

        for (const spec of SECTIONS) {
          if (!spec.intro) continue;
          const el = find(spec.id);
          if (!el) {
            console.warn(`[ScrollSequence] no element for section "${spec.id}"`);
            continue;
          }

          const tl = spec.intro(el);
          const shift = el.querySelector<HTMLElement>("[data-shift]");

          /* Every scroll-driven tween of this section, in scroll order. */
          const driven: (() => void)[] = [];
          const shape = spec.shape ?? defaults.shape;
          const length = spec.pinLength ?? MOTION.pinLength;
          /*
           * The timeline says where its own arrival ends, rather than the
           * controller guessing: a factory marks the beat that should be over
           * by the time the section stops moving, and the fraction falls out of
           * that. Retiming a section's copy keeps the two in step for free.
           */
          const lead =
            spec.lead ??
            (tl.labels.arrived != null
              ? tl.labels.arrived / tl.duration()
              : defaults.lead);

          /*
           * Declared ahead of everything that reads it: the tweens below are
           * built as arguments to create(), and render once while doing so, so
           * their onUpdate runs before create() has returned. A const here would
           * be in the temporal dead zone at that moment and throw.
           */
          let pin: ScrollTrigger | null = null;

          /*
           * Pre-roll: the first slice of the timeline plays while the section
           * climbs from the fold to the top of the viewport, so the handover
           * from the section above is continuous rather than a long empty
           * scroll. Disjoint from the pin's range, so the two never fight over
           * the playhead.
           */
          if (lead > 0) {
            /*
             * ...and the section does not actually climb, because this cancels
             * it. Over exactly this range the section's top travels the height
             * of the viewport, so translating the content the other way by the
             * same amount holds it still at the position it will occupy once
             * pinned: it dissolves in already in place, behind the section on
             * its way out, instead of riding up from the bottom edge. What is
             * left uncancelled is MOTION.arrival.settle, so it still drifts the
             * last few dozen pixels into place.
             *
             * scrub true, not MOTION.scrub. Smoothing here would let the
             * counter-translate lag the scroll it is cancelling, and the whole
             * point is that the two agree exactly.
             *
             * It writes `y`; the timeline's reveal beat writes `yPercent` on
             * the same wrapper. GSAP stores those as separate components of one
             * transform, so they compose — but it does mean each has exactly
             * one owner, and swapping either back to the other collides.
             */
            if (shift) {
              const arrival = gsap.fromTo(
                shift,
                { y: () => MOTION.arrival.settle - window.innerHeight },
                {
                  y: 0,
                  /*
                   * Load-bearing. With an ease the counter-translate stops
                   * matching the scroll it cancels: at power2.out the content
                   * would travel a couple of hundred pixels *downward* through
                   * the middle of the handover before coming back. The only
                   * free parameter is how much of the travel is left in.
                   */
                  ease: "none",
                  /*
                   * Translate only, and always in 3D.
                   *
                   * This wrapper holds every glyph in the section, so what it
                   * does to itself it does to all of them. A translate moves an
                   * already-rasterized layer; anything that changes the shape of
                   * that layer — a scale, or dropping from 3D back to 2D when
                   * the tween ends — makes the browser re-render the text, and
                   * doing that on every scroll event is what made the headings
                   * shimmer while the hero, which has no arrival, stayed clean.
                   */
                  force3D: true,
                },
              );
              const trigger = ScrollTrigger.create({
                trigger: el,
                start: "top bottom",
                end: "top top",
                scrub: true,
                invalidateOnRefresh: true,
                animation: arrival,
              });
              driven.push(replay(arrival, trigger));
            }

            const pre = { v: 0 };
            const preTween = gsap.fromTo(
              pre,
              { v: 0 },
              {
                v: 1,
                ease: "none",
                onUpdate: () => {
                    /*
                     * Hand the playhead over the moment the pin has any claim
                     * on it. Both are smoothed, so a jump that clears this
                     * range in one go leaves the two catching up together and
                     * whichever settles on the later frame wins — which showed
                     * up as a finished section still on screen after the
                     * scrollbar was dragged past it. The pin's own onUpdate
                     * defers the other way, so exactly one of them writes.
                     */
                  if (pin && (pin.isActive || pin.progress > 0)) return;
                  tl.progress(pre.v * lead);
                },
              },
            );
            const preTrigger = ScrollTrigger.create({
              trigger: el,
              start: "top bottom",
              end: "top top",
              scrub: MOTION.scrub,
              animation: preTween,
            });
            driven.push(replay(preTween, preTrigger));
          }

          const p = { v: 0 };
          const driver = gsap.fromTo(
            p,
            { v: 0 },
            {
              v: 1,
              ease: "none",
              onUpdate: () => {
                /*
                 * At the pin's start the playhead belongs at `lead`, handed
                 * over by the pre-roll. But ScrollTrigger also clamps this
                 * tween to 0 while the page is anywhere *above* the section,
                 * and writing `lead` then would light the section up from page
                 * load. Both look identical from p.v alone, so the trigger's
                 * own state is what tells them apart.
                 *
                 * Only worth doing when a pre-roll exists to own that range.
                 * Without one — the hero — `lead` is 0, so the write is the
                 * reset, and skipping it would strand the section fully played
                 * when the user jumps back above it.
                 */
                if (lead > 0 && pin && !pin.isActive && pin.progress <= 0) return;
                tl.progress(shapeProgress(p.v, shape, lead));
              },
            },
          );

          pin = ScrollTrigger.create({
            trigger: el,
            /* Pins the moment the section reaches the top of the viewport. */
            start: "top top",
            end: () => `+=${window.innerHeight * length}`,
            pin: true,
            /*
             * No anticipatePin. It exists to hide the frame where a pin engages
             * during a fast flick by engaging slightly early — but the section's
             * content is already parked at its pinned position by then, so
             * switching the section to fixed ahead of the counter-translate that
             * put it there is what would cause the jump, not what prevents it.
             */
            scrub: MOTION.scrub,
            invalidateOnRefresh: true,
            animation: driver,
          });
          driven.push(replay(driver, pin));

          /*
           * The one thing on the page that runs on its own clock. Gated on the
           * section being somewhere a viewer could see it, because a loop nobody
           * is looking at is a ticker callback burning frames for the life of
           * the page — and outside its own range a section is
           * `visibility: hidden` anyway.
           *
           * Created after the pin and ending where the pin does, both on
           * purpose. A `bottom top` end would be measured off the section's own
           * height, which is one viewport — so it would expire partway through a
           * pin that holds the section still for two more, stopping the pulse
           * with the section filling the screen.
           */
          if (spec.ambient) {
            const loop = spec.ambient(el);
            const held = pin;
            ScrollTrigger.create({
              trigger: el,
              start: "top bottom",
              end: () => held.end,
              onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
            });
          }

          resync.push(() => {
            tl.progress(0).invalidate();
            for (const reapply of driven) reapply();
          });
        }

        /*
         * Put the sequence back together after a refresh.
         *
         * Refreshing reverts every trigger to measure it, which renders each
         * driver at progress 0 — and a driver's real output is a side effect
         * (it writes tl.progress from onUpdate), not its own target. When
         * ScrollTrigger restores the trigger afterwards it skips the update if
         * the trigger's progress has not changed, which after a plain
         * re-measure it has not. The drivers are left at 0, so every section is
         * left at the start of its timeline: measurably, reload or resize while
         * a section is pinned and it drops back to its entrance pose and stays
         * there until the wheel moves far enough to matter.
         *
         * Re-rendering each driven tween at its own trigger's progress puts all
         * of them back, and because both playhead writers keep their ownership
         * guards, replaying them in scroll order lands on the same value the
         * live path would.
         *
         * The invalidate on the way through is the other half: the timelines
         * are nobody's `animation`, so nothing re-evaluates the distances they
         * measure off the DOM. Rewinding first is what makes that safe — `to`
         * tweens record their start values from the DOM, so they have to be
         * looking at the start state when they re-record it.
         */
        const onRefresh = () => resync.forEach((sync) => sync());
        ScrollTrigger.addEventListener("refresh", onRefresh);

        /*
         * Images settle after first paint and change every section's height, so
         * the ranges measured at mount are wrong until they land.
         */
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);
        return () => {
          window.removeEventListener("load", onLoad);
          ScrollTrigger.removeEventListener("refresh", onRefresh);
        };
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="contents">
      {children}
      <noscript>
        {/* Without JS nothing ever plays, so undo the CSS start state. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              "[data-reveal]{opacity:1}[data-shift]{opacity:1;visibility:visible}",
          }}
        />
      </noscript>
    </div>
  );
}
