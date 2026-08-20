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
  traceLoop,
  worksAmbient,
  worksCards,
  worksOrbit,
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
   *
   * Ignored on a beat that carries `own`: that one is not queued behind
   * anything, it waits for its own subject.
   */
  delay?: number;
  /**
   * A selector for the thing this beat is ABOUT, when that thing is not where
   * the section's own trigger fires.
   *
   * Every other beat is queued behind the one above it and the whole run starts
   * when the SECTION arrives — which is when its top edge is a quarter of the
   * way up the window, and on a full-height screen that means the heading is
   * showing and nothing else is. Anything at the foot of the section is most of
   * a windowful below the fold at that moment, so it played where nobody could
   * see it and the reader met a still picture of something that had already
   * happened. Measured at 1440x900: the strength rails 591px below the fold,
   * the approve ledger 471px, both finished before either was reachable.
   *
   * Naming an element here gives the beat a ScrollTrigger of its own on that
   * element instead, at MOTION.own.line. It is for the exception, not the
   * rule: a section that arrives as one thing should keep arriving as one
   * thing, and this is only for the parts that the section's own moment cannot
   * honestly cover.
   */
  own?: string;
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
   * What the section is called in the navigation rail, which is the only place
   * a reader ever sees it. Kept here rather than in the rail so that adding a
   * section is still one entry in one file.
   */
  label: string;
  /**
   * What sets this section's beats going.
   *
   * "scroll" is the default and what six of the seven do: the section plays its
   * entrance the first time it is scrolled into view, once, and never again —
   * see the controller.
   *
   * "load" is for the one section that cannot wait to be scrolled to, because
   * it is the page opening. The hero is already in front of the reader before
   * there is any scrolling to respond to, so it plays on a clock.
   */
  plays?: "scroll" | "load";
  beats: Beat[];
  /** One, or several — they are independent and need not share a clock. */
  ambient?: Ambient | Ambient[];
};

/**
 * The delay that puts a section's payload on the same clock as its heading.
 *
 * The controller queues each beat at `max(0, cursor + delay)`, where the cursor
 * is the end of the beat above. Handing it the heading's own duration back as a
 * negative cancels almost all of that, so the diagram sets off a fraction after
 * the first word rather than after the last one — and since both then run at
 * MOTION.copy's duration and ease (see `inStep` in timelines.ts), the two travel
 * together and land together.
 *
 * It used to be -0.35, which left the payload starting as the heading finished:
 * two arrivals in a row on a screen the reader cannot scroll past, and the
 * second one always looked like it was waiting its turn.
 */
const WITH_HEADING = -MOTION.copy.duration;

/**
 * The same idea for Early Access, where the reference is the card rather than a
 * heading: this section leads with its artwork, so the copy, the form fields
 * and the button are the things that have to keep up.
 *
 * Handing back the card beat's own duration cancels the cursor the controller
 * would otherwise queue behind it, so the form starts on the card's first frame
 * — and since all four then run at MOTION.early.card's duration and ease, they
 * travel together and land together.
 *
 * It used to be -1.2, which started the form a second and a bit before the card
 * had finished: close enough to look deliberate and far enough to look late.
 */
const WITH_CARD = -MOTION.early.card.duration;

/**
 * How far each row of the Intelligence funnel overlaps the one above it.
 *
 * The rows deliberately do NOT all start together — the funnel is a chain, each
 * row drawing itself into the one below, and collapsing that into a single
 * arrival would throw away the one thing the section is about. What they share
 * is a rate: every row now runs at MOTION.copy's duration, so the overlap is
 * stated in terms of that duration rather than as a bare number.
 *
 * It used to be a flat -0.8, tuned when the rows were 1s and 1.5s long. Once
 * they all became 1.5 that fixed number stopped being the same *proportion* of
 * a row and the funnel stretched: measured end to end at 3.14s of wall clock,
 * against the ~4s of timeline time (1.6s at this pace) it was written for.
 */
const AFTER_ROW = -MOTION.copy.duration;

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
    label: "Squad Card",
    plays: "load",
    beats: [
      { play: heroCopy, delay: MOTION.hero.afterNav },
      { play: heroCards, delay: MOTION.hero.afterCopy },
    ],
    /* The four passport cards breathing, and the bloom and band behind them
       drifting. Both wait for the fan to finish opening — see the controller —
       and both stop as soon as the hero is scrolled past.
       glowDrift is the one ambient every section has: whatever a section's
       ambient light is, it is what moves it. */
    ambient: [heroFloat, glowDrift],
  },
  {
    id: "alone",
    label: "Alone Vs Together",
    beats: [
      { play: copyIn },
      { play: alonePanels, delay: WITH_HEADING },
      /* The rails at the bottom of the panels, which the section's own moment
         is nowhere near — see Beat.own and aloneRails. */
      { play: aloneRails, own: "[data-reveal='bar']" },
    ],
    ambient: glowDrift,
  },
  {
    id: "approve",
    label: "Squad Approves",
    beats: [
      { play: copyIn },
      { play: approveDiagram, delay: WITH_HEADING },
      /* The ledger the diagram produces, at the foot of the section — see
         Beat.own and approveLedger. */
      { play: approveLedger, own: "[data-reveal='ledger']" },
    ],
    ambient: [traceLoop, glowDrift],
  },
  {
    id: "works",
    label: "How Squad Works",
    beats: [{ play: copyIn }, { play: worksCards, delay: WITH_HEADING }],
    /* Two loops inside step 1 alone, and they are about different things: the
       rings breathe because the group is being assessed continuously, the four
       members go round because a squad is an arrangement rather than a picture
       of one. Kept apart because they are also shaped differently — one yoyos,
       the other must never turn back. */
    ambient: [worksAmbient, worksOrbit, traceLoop, glowDrift],
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
    label: "Intelligence Layer",
    beats: [
      { play: copyIn },
      /* Only the first row syncs with the heading. The four below it are a
         chain — each draws itself into the one under it — so they keep their
         own overlaps rather than all starting at once. */
      { play: intelMembers, delay: WITH_HEADING },
      { play: intelSignals, delay: AFTER_ROW },
      { play: intelHub, delay: AFTER_ROW },
      { play: intelVerdict, delay: AFTER_ROW },
    ],
    /* The engine's bloom, which is the one thing in the funnel still working
       once everything above it has arrived and settled. */
    ambient: [intelAmbient, traceLoop, glowDrift],
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
