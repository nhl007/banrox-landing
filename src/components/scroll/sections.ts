import type gsap from "gsap";
import {
  alonePanels,
  approveDiagram,
  copyIn,
  earlyCard,
  earlyForm,
  heroCards,
  heroCopy,
  intelAmbient,
  intelHub,
  intelMembers,
  intelSignals,
  intelVerdict,
  inviteCard,
  traceLoop,
  worksAmbient,
  worksCards,
} from "./timelines";
import { MOTION } from "./motion";

/*
 * The one place a section is registered.
 *
 * Adding a section to the sequence is a single entry here — the controller
 * needs no edit. A section with no beats simply is not animated; it scrolls
 * like any other part of the page.
 */

/**
 * One thing that plays, as part of a section arriving.
 *
 * A section is still a list of these rather than a single timeline, but not for
 * the reason it used to be. It is no longer that a section is taller than the
 * window and its parts have to be waited for separately — a section is exactly
 * one screen now, so the whole of it arrives at once. It is that a section
 * arrives in an *order*: the heading, then the diagram, then what the diagram
 * hands down. Beats are that order written out, and they queue behind each
 * other off the section's one trigger.
 */
export type Beat = {
  /** Builds the paused timeline. */
  play: (el: HTMLElement) => gsap.core.Timeline;
  /**
   * Seconds held after the beat above it finishes. Negative overlaps the two,
   * which is usually what a section wants — a diagram that starts assembling
   * while the last word of the heading is still settling reads as one arrival
   * rather than as two animations taking turns.
   */
  delay?: number;
};

/**
 * Motion that runs on its own clock rather than on arrival, for the things that
 * should never look settled. Returns a PAUSED, looping timeline; the controller
 * plays it only once the section has finished arriving, and only while it is on
 * screen.
 */
export type Ambient = (el: HTMLElement) => gsap.core.Timeline;

export type SectionSpec = {
  /** Matches data-sequence-section in the markup. */
  id: string;
  /**
   * Where the whole section fires, as a ScrollTrigger start position — or
   * ON_LOAD for the section already on screen when the page opens. Always read
   * from MOTION.trigger rather than written here: that keeps every trigger
   * point on the page in one ordered list, and makes it impossible to add a
   * section without deciding where it goes off.
   */
  start: string;
  beats: Beat[];
  /** One, or several — they are independent and need not share a clock. */
  ambient?: Ambient | Ambient[];
};

const T = MOTION.trigger;

export const SECTIONS: SectionSpec[] = [
  {
    /*
     * The one section that does not wait to be scrolled to: it is the page
     * opening. The navbar drops in, the copy is held back behind it (see
     * MOTION.hero.afterNav), and the card scene follows the copy — three things
     * on one clock, in the order the page reads.
     *
     * The navbar is part of this section's screen rather than a strip above it,
     * which is what makes the card fan fit under the copy with no assist. It
     * used to sit the better part of a screen below the headline and had to be
     * scrolled to.
     */
    id: "hero",
    start: T.hero,
    beats: [
      { play: heroCopy, delay: MOTION.hero.afterNav },
      { play: heroCards, delay: MOTION.hero.afterCopy },
    ],
  },
  {
    id: "alone",
    start: T.alone,
    beats: [{ play: copyIn }, { play: alonePanels, delay: -0.35 }],
  },
  {
    id: "approve",
    start: T.approve,
    beats: [{ play: copyIn }, { play: approveDiagram, delay: -0.35 }],
    ambient: traceLoop,
  },
  {
    id: "works",
    start: T.works,
    beats: [{ play: copyIn }, { play: worksCards, delay: -0.35 }],
    ambient: [worksAmbient, traceLoop],
  },
  {
    /*
     * Five beats rather than two, and the only section that needs that many:
     * the funnel is a chain of four rows, each drawing itself into the one
     * below, so it has an order of its own beyond "heading, then diagram".
     *
     * They overlap harder than the two-beat sections do, and measurably so:
     * end to end the funnel took 5.9 seconds to fill, which is a long time to
     * hold someone on one screen when the screen is all there is. Run into each
     * other they read as one thing being assembled — which is what a funnel is
     * — and it lands in about four.
     */
    id: "intelligence",
    start: T.intelligence,
    beats: [
      { play: copyIn },
      { play: intelMembers, delay: -0.6 },
      { play: intelSignals, delay: -0.8 },
      { play: intelHub, delay: -0.8 },
      { play: intelVerdict, delay: -0.8 },
    ],
    /* The engine's bloom, which is the one thing in the funnel still working
       once everything above it has arrived and settled. */
    ambient: [intelAmbient, traceLoop],
  },
  {
    id: "invitation",
    start: T.invitation,
    beats: [{ play: copyIn }, { play: inviteCard, delay: -0.35 }],
  },
  {
    /*
     * The only section that leads with artwork instead of a heading, so its
     * beats run the other way round — card first, words second.
     */
    id: "early",
    start: T.early,
    beats: [{ play: earlyCard }, { play: earlyForm, delay: -1.2 }],
  },
];
