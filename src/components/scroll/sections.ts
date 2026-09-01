import type gsap from "gsap";
import {
  aloneRails,
  alonePanels,
  approveDiagram,
  approveLedger,
  copyIn,
  earlyCard,
  earlyForm,
  glowDrift,
  heroCards,
  heroCopy,
  heroFloat,
  intelAmbient,
  intelHub,
  intelMembers,
  intelSignals,
  intelVerdict,
  inviteCard,
  lifeHealth,
  lifeLanes,
  traceLoop,
  worksAmbient,
  worksCards,
  worksOrbit,
} from "./timelines";
import { MOTION } from "./motion";

/* The one place a section is registered. */

/** One thing that plays, as part of a section arriving. */
export type Beat = {
  /** Builds the paused timeline. */
  play: (el: HTMLElement) => gsap.core.Timeline;
  /** Seconds held after the beat above it finishes. */
  delay?: number;
  /**
   * A selector for the thing this beat is ABOUT, when that thing is not where
   * the section's own trigger fires.
   */
  own?: string;
};

/**
 * Motion that runs on its own clock rather than on arrival, for the things
 * that should never look settled.
 */
export type Ambient = (el: HTMLElement) => gsap.core.Timeline;

export type SectionSpec = {
  /** Matches data-sequence-section in the markup. */
  id: string;
  /**
   * What the section is called in the navigation rail, which is the only place
   * a reader ever sees it.
   */
  label: string;
  /** What sets this section's beats going. */
  plays?: "scroll" | "load";
  beats: Beat[];
  /**
   * The same section, re-cut for the column — and the only thing about the
   * phone tier that is authored twice.
   */
  column?: Beat[];
  /** One, or several — they are independent and need not share a clock. */
  ambient?: Ambient | Ambient[];
};

/** The delay that puts a section's payload on the same clock as its heading. */
const WITH_HEADING = -MOTION.copy.duration;

/**
 * The same idea for Early Access, where the reference is the card rather than
 * a heading: this section leads with its artwork, so the copy, the form fields
 * and the button are the things that have to keep up.
 */
const WITH_CARD = -MOTION.early.card.duration;

/** How far each row of the Intelligence funnel overlaps the one above it. */
const AFTER_ROW = -MOTION.copy.duration;

export const SECTIONS: SectionSpec[] = [
  {
    /*
     * The one section that does not wait to be scrolled to: it is the page
     * opening.
     */
    id: "hero",
    label: "Squad Card",
    plays: "load",
    beats: [
      { play: heroCopy, delay: MOTION.hero.afterNav },
      { play: heroCards, delay: MOTION.hero.afterCopy },
    ],
    /*
     * The four passport cards breathing, and the bloom and band behind them
     * drifting.
     */
    ambient: [heroFloat, glowDrift],
  },
  {
    id: "alone",
    label: "Alone Vs Together",
    beats: [
      { play: copyIn },
      { play: alonePanels, delay: WITH_HEADING },
      /*
       * The rails at the bottom of the panels, which the section's own moment
       * is nowhere near — see Beat.own and aloneRails.
       */
      { play: aloneRails, own: "[data-reveal='bar']" },
    ],
    /*
     * Alone above, Together below, each with its own rail — four beats where
     * the wide layout has three, and the argument still lands in the same
     * order.
     */
    column: [
      { play: copyIn },
      { play: (el) => alonePanels(el, 0), delay: WITH_HEADING },
      {
        play: (el) => aloneRails(el, 0),
        own: "[data-reveal='card-left'] [data-reveal='bar']",
      },
      { play: (el) => alonePanels(el, 1) },
      {
        play: (el) => aloneRails(el, 1),
        own: "[data-reveal='card-right'] [data-reveal='bar']",
      },
    ],
    ambient: glowDrift,
  },
  {
    id: "approve",
    label: "Squad Approves",
    beats: [
      { play: copyIn },
      { play: approveDiagram, delay: WITH_HEADING },
      /*
       * The ledger the diagram produces, at the foot of the section — see
       * Beat.own and approveLedger.
       */
      { play: approveLedger, own: "[data-reveal='ledger']" },
    ],
    /*
     * The request, the card, the votes — one at a time, each drawing the drop
     * that arrives at it.
     */
    column: [
      { play: copyIn },
      { play: (el) => approveDiagram(el, 0), delay: WITH_HEADING },
      { play: (el) => approveDiagram(el, 1) },
      { play: (el) => approveDiagram(el, 2) },
      { play: approveLedger, own: "[data-reveal='ledger']" },
    ],
    ambient: [traceLoop, glowDrift],
  },
  {
    id: "works",
    label: "How Squad Works",
    beats: [{ play: copyIn }, { play: worksCards, delay: WITH_HEADING }],
    /*
     * The stagger that says "1, 2, 3" up here becomes three arrivals half a
     * screen of scrolling apart, which says the same thing at the speed a
     * column is read.
     */
    column: [
      { play: copyIn },
      { play: (el) => worksCards(el, 0), delay: WITH_HEADING },
      { play: (el) => worksCards(el, 1) },
      { play: (el) => worksCards(el, 2) },
    ],
    /*
     * Two loops inside step 1 alone, and they are about different things: the
     * rings breathe because the group is being assessed continuously, the four
     * members go round because a squad is an arrangement rather than a picture
     * of one.
     */
    ambient: [worksAmbient, worksOrbit, traceLoop, glowDrift],
  },
  {
    /*
     * Five beats rather than two, and the only section that needs that many:
     * the funnel is a chain of four rows, each drawing itself into the one
     * below, so it has an order of its own beyond "heading, then diagram".
     */
    id: "intelligence",
    label: "Intelligence Layer",
    beats: [
      { play: copyIn },
      /* Only the first row syncs with the heading. */
      { play: intelMembers, delay: WITH_HEADING },
      { play: intelSignals, delay: AFTER_ROW },
      { play: intelHub, delay: AFTER_ROW },
      { play: intelVerdict, delay: AFTER_ROW },
    ],
    /*
     * The engine's bloom, which is the one thing in the funnel still working
     * once everything above it has arrived and settled.
     */
    ambient: [intelAmbient, traceLoop, glowDrift],
  },
  {
    /*
     * The one section between the funnel and the invitation, and the only one
     * that is about a week rather than about a mechanism: a lane being spent
     * down, a member covering another member, the squad's own health.
     */
    id: "life",
    label: "Life Inside Squad",
    beats: [
      { play: copyIn },
      { play: lifeLanes, delay: WITH_HEADING },
      { play: lifeHealth, own: "[data-reveal='health']" },
    ],
    /*
     * The lane, then the one covering it — 227px apart in the column, which is
     * a beat rather than a wait.
     */
    column: [
      { play: copyIn },
      { play: (el) => lifeLanes(el, 0), delay: WITH_HEADING },
      { play: (el) => lifeLanes(el, 1) },
      { play: lifeHealth, own: "[data-reveal='health']" },
    ],
    /*
     * traceLoop for the hairline between the two faces, which is the one thing
     * in the section still happening once everything has arrived.
     */
    ambient: [traceLoop, glowDrift],
  },

  {
    id: "invitation",
    label: "Invite Your Squad",
    beats: [{ play: copyIn }, { play: inviteCard, delay: WITH_HEADING }],
    ambient: glowDrift,
  },
  {
    /*
     * The only section that leads with artwork instead of a heading, so its
     * beats run the other way round — card first, words second.
     */
    id: "early",
    label: "Early Access",
    beats: [{ play: earlyCard }, { play: earlyForm, delay: WITH_CARD }],
    ambient: glowDrift,
  },
];
