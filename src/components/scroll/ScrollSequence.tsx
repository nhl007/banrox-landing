"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setDeckAt, setDeckNavigator } from "./deck";
import { MOTION } from "./motion";
import { SECTIONS } from "./sections";
import { navbarDrop } from "./timelines";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/*
 * The page as a deck.
 *
 * The sections are stacked in one windowful — see .scene in globals.css — and
 * only one of them is showing. A scroll gesture does not move the page: it
 * hands the window to the next section, which fades in over the last and plays
 * its own entrance at its own speed. One gesture, one section, forwards or
 * back.
 *
 * So there is nothing to scroll through and nothing to land halfway into. The
 * distance between two sections is a crossfade rather than a gap, which is what
 * makes the page read as one thing changing rather than seven going past.
 *
 * The deck holds a gesture only while it has somewhere to go. Past the last
 * section a wheel event is left completely alone and the page scrolls into the
 * footer the way any page would; coming back up, the deck takes over again the
 * moment the document is back at the top. That handover is the whole of the
 * page's relationship with real scrolling.
 */

/** Keys that mean "next" and "previous" to a page. */
const FORWARD = ["ArrowDown", "PageDown", " ", "Spacebar"];
const BACK = ["ArrowUp", "PageUp"];

/** Somewhere a key press means something else — the Early Access form. */
const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName));

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
   * controller has touched them: every [data-reveal] at opacity 0 and six of
   * the seven cards at visibility hidden. Which is to say the page comes back
   * empty, with only the footer — because the footer is the one thing on it
   * that was never waiting to be revealed.
   *
   * Re-running on the path is the fix, and revertOnUpdate is half of it: the
   * old context has to be torn down before the new one measures anything.
   */
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      /*
       * Below the gate, and for anyone who asked for reduced motion, there is no
       * deck: no stacking, no crossfades, no gestures taken. The sections are an
       * ordinary column and the CSS start state is behind the same query, so the
       * server-rendered markup is already correct and there is nothing to undo.
       */
      mm.add(`not all and ${MOTION.enabled}`, () => {});

      mm.add(MOTION.enabled, () => {
        const find = (id: string) =>
          document.querySelector<HTMLElement>(`[data-sequence-section='${id}']`);

        /* The navbar is not in the deck. It sits above it and stays there, which
           is why the deck is a window less its height. */
        const navEl = find("navbar");
        if (navEl) navbarDrop(navEl).timeScale(MOTION.pace).play();

        /* --- the cards -------------------------------------------------- */

        const cards = SECTIONS.map((spec) => {
          const el = find(spec.id);
          if (!el) {
            console.warn(`[ScrollSequence] no element for section "${spec.id}"`);
            return null;
          }

          /*
           * The section's beats, in order, in one paused timeline — the same
           * factories and the same delays as ever, a negative one still
           * overlapping the beat above it. It is restarted every time the
           * section is handed the window, so arriving looks the same on the way
           * back up as it did the first time.
           */
          const beats = gsap.timeline({ paused: true });
          let cursor = 0;
          for (const b of spec.beats) {
            const child = b.play(el);
            /* A child has to be running for its parent to render it; these come
               back paused because they used to be played one at a time. */
            child.paused(false);
            const at = Math.max(0, cursor + (b.delay ?? 0));
            beats.add(child, at);
            cursor = at + child.duration();
          }
          beats.timeScale(MOTION.pace);

          /* Motion that never finishes — the connector lights, the engine's
             bloom. It waits for the section to finish arriving, and the deck
             drops it the moment the section is handed on. */
          const loops = [spec.ambient ?? []].flat().map((make) => make(el));
          if (loops.length)
            beats.eventCallback("onComplete", () =>
              loops.forEach((loop) => loop.play()),
            );

          return { el, beats, loops };
        }).filter((c): c is NonNullable<typeof c> => !!c);

        if (!cards.length) return;

        /* --- state ------------------------------------------------------ */

        let index = 0;
        /** A crossfade is running, so the deck is not listening. */
        let busy = false;
        /**
         * Who this gesture belongs to, decided on its first event and held for
         * the rest of it.
         *
         * A gesture is dozens of events and the answer can change underneath it
         * — the deck runs out of cards halfway through a flick, or the page
         * reaches the top of the document halfway through one. Deciding per
         * event meant a single flick stepping onto the last card and then
         * scrolling on into the footer with the same push, and a single flick
         * back up scrolling to the top and then stepping back a card. One
         * gesture now does one of the two things.
         */
        let owner: "deck" | "page" | null = null;
        /** The one step this gesture is allowed. */
        let stepped = false;
        let quiet = 0;
        /**
         * Whether the reader has been let out of the deck, downwards.
         *
         * The document is taller than the deck — the footer is under it — so it
         * CAN be scrolled at any time, and a handful of things scroll it that
         * this file never hears about: a wheel event that arrives in the moment
         * between the page painting and this controller being hydrated, a
         * browser restoring the scroll position of a reload, a scrollbar
         * dragged, an element being focused into view. Every one of them lands
         * the reader in the footer from the hero with the deck untouched behind
         * it, which is exactly the "scroll down from the hero and get the
         * footer" this is here to stop.
         *
         * So the deck holds the document at the top until it has actually been
         * scrolled through, or until the rail is asked for the footer directly.
         */
        let released = false;

        /** The gesture is over once the events stop coming. */
        const endGesture = () => {
          window.clearTimeout(quiet);
          quiet = window.setTimeout(() => {
            owner = null;
            stepped = false;
          }, MOTION.deck.idle * 1000);
        };

        /* The page opens on the first card, already showing, playing. */
        cards.forEach((card, i) => {
          if (i) gsap.set(card.el, { autoAlpha: 0 });
        });
        cards[0].beats.restart();

        /**
         * Hand the window to a particular card.
         *
         * The two halves are one movement: the card arriving fades up over the
         * card leaving rather than after it, so there is never a frame with
         * nothing on screen — and its entrance starts underneath the crossfade,
         * so by the time it is fully there it is already assembling itself.
         *
         * Every other card is faded out, not just the one that was showing.
         * A gesture only ever moves by one, but the navigation rail can jump
         * across the deck, and it can be clicked again while a crossfade from
         * the last click is still running — so at that moment there are two
         * cards on their way out and only naming one of them leaves the other
         * stranded at full opacity on top of everything.
         */
        const footerEl = document.querySelector("footer");

        const show = (next: number) => {
          /* Past the last card is the footer, which is not a card — it is the
             page underneath the deck. Let go of the top and take them down. */
          if (next >= cards.length) {
            released = true;
            setDeckAt(index, true);
            footerEl?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }

          if (next === index || next < 0) {
            /* Asked for the card already showing, from down in the footer:
               nothing to crossfade, but they still want to be back at it. */
            if (next === index && window.scrollY > 0) {
              released = false;
              window.scrollTo({ top: 0, behavior: "smooth" });
              setDeckAt(index, false);
            }
            return;
          }

          released = false;
          const to = cards[next];
          index = next;
          busy = true;

          cards.forEach((card, i) => {
            if (i === next) return;
            card.loops.forEach((loop) => loop.pause());
            gsap.to(card.el, {
              autoAlpha: 0,
              duration: MOTION.deck.fade,
              ease: MOTION.deck.ease,
            });
          });

          gsap.fromTo(
            to.el,
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              duration: MOTION.deck.fade,
              ease: MOTION.deck.ease,
              onComplete: () => {
                busy = false;
              },
            },
          );
          to.beats.restart();
          setDeckAt(next, false);
          if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
        };

        const go = (dir: 1 | -1) => show(index + dir);

        /* The rail can now ask for a card by name. Withdrawn on teardown, which
           is what puts it back to plain scrolling below the gate. */
        setDeckNavigator(show);

        /**
         * Whether the deck wants this gesture, or the page should have it.
         *
         * Only ever at the very top of the document: below that the reader is in
         * the footer and the page is an ordinary page. Forward past the last
         * card is the handover — the event is left alone and the document
         * scrolls, which is how the footer is reached at all.
         */
        const wanted = (dir: 1 | -1) =>
          window.scrollY <= 0 &&
          (dir > 0 ? index < cards.length - 1 : index > 0);

        /*
         * The document held at the top for as long as the deck has not been
         * scrolled through.
         *
         * This is the backstop for everything that moves the page without going
         * through the handlers below — see `released`. It runs once at setup
         * too, which is what catches the two cases nothing else can: a wheel
         * event during hydration, and a browser restoring the scroll position
         * of a reload.
         */
        const onScroll = () => {
          if (!released) {
            if (window.scrollY > 0) window.scrollTo(0, 0);
            return;
          }
          setDeckAt(index, window.scrollY > 0);
        };

        /* --- gestures --------------------------------------------------- */

        const onWheel = (e: WheelEvent) => {
          const dir = e.deltaY > 0 ? 1 : -1;
          if (owner === null) {
            owner = wanted(dir) ? "deck" : "page";
            /* Declining a forward gesture at the last card IS the handover:
               this is the reader asking to leave, and the only thing that opens
               the document up. */
            if (owner === "page" && dir > 0 && window.scrollY <= 0)
              released = index >= cards.length - 1;
          }
          /*
           * Every event pushes the end of the gesture back, so it is only over
           * once the wheel has actually stopped. This is the whole of "one
           * gesture, one section": a trackpad flick is dozens of events and its
           * momentum keeps sending them long after the fingers have lifted, and
           * without this the deck would run end to end on a single push.
           */
          endGesture();
          if (owner === "page") return;

          e.preventDefault();
          if (stepped || busy) return;
          if (Math.abs(e.deltaY) < MOTION.deck.threshold) return;
          stepped = true;
          go(dir);
        };

        let touch = 0;
        const onTouchStart = (e: TouchEvent) => {
          touch = e.touches[0]?.clientY ?? 0;
          owner = null;
          stepped = false;
        };
        const onTouchMove = (e: TouchEvent) => {
          const travel = touch - (e.touches[0]?.clientY ?? touch);
          const dir = travel > 0 ? 1 : -1;
          if (owner === null) {
            owner = wanted(dir) ? "deck" : "page";
            if (owner === "page" && dir > 0 && window.scrollY <= 0)
              released = index >= cards.length - 1;
          }
          endGesture();
          if (owner === "page") return;

          e.preventDefault();
          if (stepped || busy) return;
          if (Math.abs(travel) < MOTION.deck.swipe) return;
          stepped = true;
          go(dir);
        };

        const onKey = (e: KeyboardEvent) => {
          if (typing(e.target)) return;
          const forward = FORWARD.includes(e.key);
          if (!forward && !BACK.includes(e.key)) return;
          const dir = forward ? 1 : -1;
          if (!wanted(dir)) {
            if (dir > 0 && window.scrollY <= 0 && index >= cards.length - 1)
              released = true;
            return;
          }
          e.preventDefault();
          if (busy) return;
          go(dir);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("keydown", onKey);

        return () => {
          setDeckNavigator(null);
          window.clearTimeout(quiet);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("wheel", onWheel);
          window.removeEventListener("touchstart", onTouchStart);
          window.removeEventListener("touchmove", onTouchMove);
          window.removeEventListener("keydown", onKey);
        };
      });
    },
    { scope: root, dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="contents">
      {children}
      <noscript>
        {/* Without JS nothing ever plays and no gesture is ever taken, so undo
            the CSS start state — the elements inside a section, and the six
            sections stacked behind the first. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              "[data-reveal]{opacity:1}.scene>.screen{opacity:1;visibility:visible;position:static}.scene{height:auto}.scene-track{height:auto}",
          }}
        />
      </noscript>
    </div>
  );
}
