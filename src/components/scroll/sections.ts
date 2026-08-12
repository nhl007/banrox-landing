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
 * One thing that plays when one thing comes into view.
 *
 * A section is a list of these rather than a single timeline because a section
 * is taller than the window. Its heading and the diagram beneath it are never
 * on screen at the same moment, so one trigger cannot serve both: fired at the
 * heading the diagram animates below the fold, fired at the diagram the heading
 * has already been read. Each beat waits for its own subject to arrive.
 */
export type Beat = {
  /** Builds the paused timeline. */
  play: (el: HTMLElement) => gsap.core.Timeline;
  /**
   * The [data-beat] inside the section whose arrival fires this. Omitted means
   * the section itself, which is what a heading wants — a section's top edge
   * and its heading are the same place.
   */
  on?: string;
  /**
   * Where it fires, as a ScrollTrigger start position. Required, and always
   * read from MOTION.trigger rather than written here: that keeps every
   * trigger point on the page in one ordered list, and makes it impossible to
   * add a beat without deciding where it goes off.
   */
  start: string;
  /** Seconds held before playing, for a beat that has to follow another. */
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
  beats: Beat[];
  /** One, or several — they are independent and need not share a clock. */
  ambient?: Ambient | Ambient[];
};

/*
 * Written out one beat at a time rather than through a shared `copy`/`payload`
 * helper. The helpers were shorter, but they also meant a section could not be
 * retimed without retiming six others, and the trigger point of any given
 * animation was two indirections away from the animation. Every beat now names
 * its own entry in MOTION.trigger, and those entries are listed there in the
 * order they play.
 */
const T = MOTION.trigger;

export const SECTIONS: SectionSpec[] = [
  {
    /*
     * The page opens on the navbar dropping in; the hero's copy is held back
     * behind it (see MOTION.hero.afterNav) because both are on screen at load
     * and would otherwise fire on the same frame — the controller's rule that a
     * section's beats queue is what puts them in reading order.
     */
    id: "hero",
    beats: [
      { play: heroCopy, on: "copy", start: T.hero.copy, delay: MOTION.hero.afterNav },
      { play: heroCards, on: "cards", start: T.hero.cards },
    ],
  },
  {
    id: "alone",
    beats: [
      { play: copyIn, on: "copy", start: T.alone.copy },
      { play: alonePanels, on: "payload", start: T.alone.payload },
    ],
  },
  {
    id: "approve",
    beats: [
      { play: copyIn, on: "copy", start: T.approve.copy },
      { play: approveDiagram, on: "payload", start: T.approve.payload },
    ],
    ambient: traceLoop,
  },
  {
    id: "works",
    beats: [
      { play: copyIn, on: "copy", start: T.works.copy },
      { play: worksCards, on: "payload", start: T.works.payload },
    ],
    ambient: [worksAmbient, traceLoop],
  },
  {
    /*
     * Five beats rather than two: the funnel is 948px tall, so one trigger for
     * all of it would play the engine three viewports before anyone reached it.
     * Each row waits for itself.
     */
    id: "intelligence",
    beats: [
      { play: copyIn, on: "copy", start: T.intelligence.copy },
      { play: intelMembers, on: "members", start: T.intelligence.members },
      { play: intelSignals, on: "signals", start: T.intelligence.signals },
      { play: intelHub, on: "hub", start: T.intelligence.hub },
      { play: intelVerdict, on: "verdict", start: T.intelligence.verdict },
    ],
    /* The engine's bloom, which is the one thing in the funnel still working
       once everything above it has arrived and settled. */
    ambient: [intelAmbient, traceLoop],
  },
  {
    id: "invitation",
    beats: [
      { play: copyIn, on: "copy", start: T.invitation.copy },
      { play: inviteCard, on: "payload", start: T.invitation.payload },
    ],
  },
  {
    /*
     * The only section that leads with artwork instead of a heading, so its
     * beats run the other way round — card first, words second.
     */
    id: "early",
    beats: [
      { play: earlyCard, on: "card", start: T.early.card },
      { play: earlyForm, on: "form", start: T.early.form },
    ],
  },
];
