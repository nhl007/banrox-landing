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

/* The rail: one dot per section, then the footer, down the right-hand edge. */
export default function DeckNav() {
  const { index, footer, active } = useSyncExternalStore(
    deckSubscribe,
    deckSnapshot,
    deckServerSnapshot,
  );

  /* Where the reader is when there is no deck to ask. */
  const [scrolled, setScrolled] = useState(0);
  const current = active ? (footer ? SECTIONS.length : index) : scrolled;

  const rail = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const dots = useRef<(HTMLButtonElement | null)[]>([]);

  /* The ring travelling, and the line filling in behind it. */
  useEffect(() => {
    const dot = dots.current[current];
    const first = dots.current[0];
    const last = dots.current[dots.current.length - 1];
    const ring = mark.current;
    const line = fill.current;
    if (!dot || !first || !last || !ring || !line) return;

    const centre = (el: HTMLElement) => el.offsetTop + el.offsetHeight / 2;
    const from = centre(first);
    const span = centre(last) - from;
    const y = centre(dot);
    /*
     * The line is laid out at full length once and scaled, which keeps it off
     * the layout path — a height tween on every step would be a reflow of the
     * rail eight times a visit.
     */
    const grown = span ? (y - from) / span : 0;

    gsap.set(line, { top: from, height: span });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(ring, { y });
      gsap.set(line, { scaleY: grown });
      return;
    }

    const tl = gsap
      .timeline()
      .to(ring, { y, ...MOTION.rail.travel }, 0)
      .to(ring, { ...MOTION.rail.squash }, 0)
      .to(
        ring,
        { scaleX: 1, scaleY: 1, ...MOTION.rail.settle },
        MOTION.rail.squash.duration,
      )
      .to(line, { scaleY: grown, ...MOTION.rail.fill }, 0);

    return () => {
      tl.kill();
    };
  }, [current]);

  /* The dots swelling towards the pointer — see MOTION.rail.magnet. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { max, reach } = MOTION.rail.magnet;

    /*
     * Measured when the pointer arrives rather than on every move: the rail
     * cannot change shape while it is being hovered.
     */
    let centres: number[] = [];
    const measure = () => {
      centres = dots.current.map((dot) => {
        const box = dot?.getBoundingClientRect();
        return box ? box.top + box.height / 2 : Number.NaN;
      });
    };

    const onMove = (e: PointerEvent) => {
      for (let i = 0; i < centres.length; i++) {
        const dot = dots.current[i];
        if (!dot || Number.isNaN(centres[i])) continue;
        const near = Math.max(0, 1 - Math.abs(e.clientY - centres[i]) / reach);
        /*
         * Squared, so the swell stays tight around the pointer instead of
         * lifting half the rail at once.
         */
        dot.style.setProperty("--mag", `${1 + near * near * (max - 1)}`);
      }
    };
    const onLeave = () => {
      for (const dot of dots.current) dot?.style.removeProperty("--mag");
    };

    el.addEventListener("pointerenter", measure);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", measure);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

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
    /*
     * The controller does the scrolling itself when there is a deck — it has
     * to, because getting to the footer means letting go of the top of the
     * page first, and coming back means taking hold of it again.
     */
    if (deckGoTo(i)) return;
    const target =
      i < SECTIONS.length
        ? document.querySelector(`[data-sequence-section='${SECTIONS[i].id}']`)
        : document.querySelector("footer");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* The sections, and then the footer. */
  const stops = [...SECTIONS.map((s) => s.label), "Contacts"];

  return (
    <nav className="deck-nav" aria-label="Sections">
      <div className="deck-rail" ref={rail}>
        <span className="deck-fill" ref={fill} aria-hidden="true" />
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
            data-passed={i < current ? "" : undefined}
            onClick={() => goTo(i)}
          >
            <span className="deck-bead" aria-hidden="true" />
            {/*
             * The preview. aria-hidden because the button already carries the same words
             * as its label — read out, this would say each section's name twice and its
             * number to nobody's benefit.
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
