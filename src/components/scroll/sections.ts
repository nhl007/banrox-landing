import type gsap from "gsap";
import {
  aloneIntro,
  approveIntro,
  earlyIntro,
  heroIntro,
  intelIntro,
  inviteIntro,
  worksAmbient,
  worksIntro,
} from "./timelines";

/*
 * The one place a section is registered.
 *
 * Adding a section to the sequence is a single entry here — the controller
 * needs no edit. A section with no `intro` simply is not animated; it scrolls
 * like any other part of the page.
 *
 * Every section listed below has since earned choreography of its own, so
 * timelines.ts's `sectionIntro` currently has no caller. It stays as the
 * starting point for the next one: tag the copy and the payload, name it here,
 * and the section is in the sequence before anything bespoke is written.
 */

/**
 * Where a section's timeline sits at a given point in its pinned scroll range.
 *
 * The section is held still for `pinLength` viewport heights of scroll. Across
 * that, the timeline runs forward through `in`, holds, then runs *backwards*
 * through `out` — the same timeline instance, playhead reversed, which is what
 * makes the outro an exact inverse rather than a second forward animation that
 * resembles one. Only once the outro has finished does the pin release and the
 * next section arrive.
 *
 *   0 ─── in[0] ══ in[1] ─────── out[0] ══ out[1] ─── 1   scroll through the pin
 *   0        0 ───────► 1 ─────────── 1 ───────► 0   0   timeline
 *                                                    └─ unpins here
 */
export type Shape = { in: [number, number]; out: [number, number] };

export type SectionSpec = {
  /** Matches data-sequence-section in the markup. */
  id: string;
  /** Builds the intro. The outro is this timeline reversed — never a second factory. */
  intro?: (el: HTMLElement) => gsap.core.Timeline;
  /**
   * Motion that runs on its own clock rather than on the scrollbar, for the
   * rare thing that should never look settled. Returns a PAUSED, looping
   * timeline; the controller plays it only while the section is on screen.
   *
   * Deliberately separate from `intro`. The intro is scrubbed — its playhead is
   * wherever the wheel puts it — and a loop inside it would be dragged back and
   * forth rather than looping.
   */
  ambient?: (el: HTMLElement) => gsap.core.Timeline;
  shape?: Shape;
  /** Overrides MOTION.pinLength for a section that needs more or less room. */
  pinLength?: number;
  /**
   * How much of the timeline plays *before* the section pins, while it is
   * arriving.
   *
   * Normally left unset: a factory marks the end of its arrival with an
   * "arrived" label and the controller derives this from it, so the beat that
   * plays during the handover and the scroll it plays over stay in step even
   * after the timeline is retimed. `defaults.lead` covers a factory with no
   * label at all.
   *
   * Setting it to 0 disables the pre-roll entirely, which the hero needs: it is
   * already on screen at scroll 0, so any pre-roll would have it part-played
   * before the user has scrolled at all.
   */
  lead?: number;
};

/*
 * The hold in the middle is deliberately short. It is dead scroll — the user is
 * turning the wheel and nothing is moving — so it exists only to give the
 * finished composition a beat before it starts coming apart.
 */
const DEFAULT_SHAPE: Shape = { in: [0.03, 0.46], out: [0.58, 0.97] };
const DEFAULT_LEAD = 0.22;

export const SECTIONS: SectionSpec[] = [
  { id: "hero", intro: heroIntro, pinLength: 3, lead: 0 },
  { id: "alone", intro: aloneIntro },
  { id: "approve", intro: approveIntro },
  { id: "works", intro: worksIntro, ambient: worksAmbient },
  { id: "intelligence", intro: intelIntro },
  { id: "invitation", intro: inviteIntro },
  /*
   * The last one keeps what it built. An outro exists so the section is out of
   * the way before the next one arrives behind it — and behind this one there
   * is only the footer, which is not part of the sequence. Running it here
   * would empty the screen and then scroll a blank pane past for the length of
   * the viewport before the footer showed up. So it holds, unpins composed, and
   * scrolls away like an ordinary page. The shorter pin is the same reasoning:
   * with no outro to spend it on, the rest would be dead scroll.
   */
  {
    id: "early",
    intro: earlyIntro,
    pinLength: 1.2,
    shape: { in: [0.05, 0.8], out: [1, 1] },
  },
];

export const defaults = { shape: DEFAULT_SHAPE, lead: DEFAULT_LEAD };
