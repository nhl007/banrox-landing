"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import {
  deckGoTo,
  deckServerSnapshot,
  deckSnapshot,
  deckSubscribe,
} from "./deck";
import { MOTION } from "./motion";
import { SECTIONS } from "./sections";

/*
 * The rail: one dot per section, down the right-hand edge.
 *
 * The deck has no scrollbar — the page does not move while you are in it — so
 * there is nothing to tell you how many sections there are, which one you are
 * on, or how far in you have got. This is that. It is also the only way to get
 * across the deck in one move rather than seven.
 *
 * It works whether or not there is a deck. Above the gate it asks the
 * controller for a section; below it, and under reduced motion, the page is an
 * ordinary column and it scrolls to one instead — and watches the column to
 * keep itself in step, since nothing is publishing an index in that mode.
 */
export default function DeckNav() {
  const { index, footer, active } = useSyncExternalStore(
    deckSubscribe,
    deckSnapshot,
    deckServerSnapshot,
  );

  /* Where the reader is when there is no deck to ask. */
  const [scrolled, setScrolled] = useState(0);
  const current = active ? (footer ? SECTIONS.length : index) : scrolled;

  const mark = useRef<HTMLSpanElement>(null);
  const dots = useRef<(HTMLButtonElement | null)[]>([]);

  /*
   * The marker, travelling.
   *
   * Measured off the dot rather than computed from the index, so the spacing
   * lives in the stylesheet where it belongs and nothing here has to be kept in
   * step with it.
   */
  useEffect(() => {
    const dot = dots.current[current];
    const light = mark.current;
    if (!dot || !light) return;

    const y = dot.offsetTop + dot.offsetHeight / 2;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(light, { y });
      return;
    }

    const tl = gsap
      .timeline()
      .to(light, { y, ...MOTION.rail.travel }, 0)
      .to(light, { ...MOTION.rail.squash }, 0)
      .to(
        light,
        { scaleX: 1, scaleY: 1, ...MOTION.rail.settle },
        MOTION.rail.squash.duration,
      );
    return () => {
      tl.kill();
    };
  }, [current]);

  /*
   * Following the column, for the modes with no deck. rootMargin collapses the
   * viewport to a line across its middle, so the section that "intersects" is
   * whichever one the reader is actually looking at.
   */
  useEffect(() => {
    if (active) return;
    const els = [
      ...SECTIONS.map((s) =>
        document.querySelector(`[data-sequence-section='${s.id}']`),
      ),
      document.querySelector("footer"),
    ];
    const seen = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = els.indexOf(entry.target);
          if (i >= 0) setScrolled(i);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const el of els) if (el) seen.observe(el);
    return () => seen.disconnect();
  }, [active]);

  const goTo = (i: number) => {
    /* The controller does the scrolling itself when there is a deck — it has to,
       because getting to the footer means letting go of the top of the page
       first, and coming back means taking hold of it again. */
    if (deckGoTo(i)) return;
    const target =
      i < SECTIONS.length
        ? document.querySelector(`[data-sequence-section='${SECTIONS[i].id}']`)
        : document.querySelector("footer");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /*
   * The sections, and then the footer.
   *
   * The footer is on the rail but is not a section: it is the page underneath
   * the deck, it scrolls freely, and it has no entrance of its own. It earns a
   * dot anyway — it is where the contact details are, and without one the only
   * way to reach it is to go through all seven cards first.
   */
  const stops = [
    ...SECTIONS.map((s) => s.label),
    "Contacts",
  ];

  return (
    <nav className="deck-nav" aria-label="Sections">
      <div className="deck-rail">
        <span className="deck-mark" ref={mark} aria-hidden="true" />

        {stops.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              dots.current[i] = el;
            }}
            type="button"
            className="deck-dot"
            aria-label={label}
            aria-current={i === current ? "true" : undefined}
            onClick={() => goTo(i)}
          >
            <span className="deck-bead" aria-hidden="true" />
            {/*
              The preview. aria-hidden because the button already carries the
              same words as its label — read out, this would say each section's
              name twice and its number to nobody's benefit.
            */}
            <span className="deck-peek" aria-hidden="true">
              <span className="deck-peek-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="deck-peek-name">{label}</span>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
