import Image from "next/image";

/*
 * The hero's bloom, for the three sections that never had one.
 *
 * Four of the seven screens already carry their own ambient light — the bloom
 * and band behind the card fan, the halo behind the approve diagram's Squad
 * card, the aura behind the intelligence funnel, the pair behind the Early
 * Access card. Those are animated where they stand (see glowDrift): they are
 * artwork belonging to a diagram, in that diagram's stage coordinates, and
 * moving them out of it would break the one thing they are for.
 *
 * Alone Vs Together, How Squad Works and Invite Your Squad had none. Rather
 * than draw something new for them, they get the same asset the hero uses,
 * placed in the section instead of in a stage — so the deck is lit by one
 * thing throughout rather than by six of one kind and three of another.
 *
 * ---------------------------------------------------------------------------
 * WHY EACH ONE ARRIVES FROM SOMEWHERE ELSE
 *
 * The deck cuts between sections in a single frame — no dissolve, nothing
 * between the two (see the controller). What the reader sees of a handover is
 * the arriving section assembling itself, and if every section's light simply
 * faded up in place, the one thing spanning the whole deck would be the one
 * thing that never moved. So each section's light comes in from somewhere else,
 * and `from` is that direction: a unit-ish vector, scaled by MOTION.glow.travel
 * when the timeline reads it off data-glow-from. Positive y is downwards, so [0, 1]
 * arrives from below and [0, -1] from above.
 *
 * ---------------------------------------------------------------------------
 * WHY ALONE VS TOGETHER IS LIT BEHIND ITS HEADINGS
 *
 * Because the hero is. The hero's brightest ground is the band behind its
 * headline, so that is where the reader's eye is when they leave it; putting
 * the next section's light in the same band, arriving downwards from above,
 * means the room they land in is lit where they were already looking.
 *
 * ---------------------------------------------------------------------------
 * The boxes are percentages of the section, so one arrangement serves every
 * window, and each stays inside its section: the layer clips (see .screen-glow)
 * and this asset does not fade to nothing until its own edge, so a bloom hung
 * over the section's edge would be cut through something still lit.
 */
const BLOOM = { src: "/hero/glow-bloom.svg", size: 1828 } as const;

type Placed = {
  from: readonly [number, number];
  left: string;
  top: string;
  width: string;
  height: string;
};

const BLOOMS: Record<string, Placed> = {
  /* Behind the headings, arriving downwards onto them — see above. Wide and
     shallow rather than round: the heading here is two long lines and a
     sub-paragraph, and the light has to be under all of it. */
  alone: { from: [0, -1], left: "16%", top: "0%", width: "68%", height: "48%" },

  /* Above the cards rather than behind them. The three step cards are the one
     payload on the deck that is opaque and fills its screen edge to edge —
     measured, they cover everything below 30% of the section — so light placed
     under them is light spent on nothing. What is left is the band the heading
     sits in, lit right-heavy rather than centred so that it does not simply
     repeat the section before it: the light came in from the right and it stays
     where it landed. */
  works: { from: [1, 0.25], left: "34%", top: "0%", width: "64%", height: "48%" },

  /* Down from the top left, onto the largest single card on the page. Offset to
     one side of it rather than centred on it, so the card is read against the
     light rather than washed by it. */
  invitation: {
    from: [-0.7, -0.7],
    left: "6%",
    top: "6%",
    width: "58%",
    height: "64%",
  },
};

/**
 * Drop it in as the FIRST child of a <section>, give that section `isolate` and
 * its .screen-body `relative z-10`, and the layer is pinned behind the
 * section's content and in front of the page — see .screen-glow in globals.css
 * for why both of those are load-bearing.
 *
 * data-reveal is what holds it hidden until its section arrives (the stylesheet
 * does that before hydration) and what copyIn tweens in. data-glow-from is what
 * glowDrift picks up, and carries the direction the arrival travels from.
 */
export default function SectionBloom({ id }: { id: keyof typeof BLOOMS }) {
  const placed = BLOOMS[id];
  if (!placed) return null;

  const { from, ...box } = placed;

  return (
    <div className="screen-glow" aria-hidden="true">
      <div
        className="absolute"
        style={box}
        data-reveal="glow"
        data-glow-from={`${from[0]} ${from[1]}`}
      >
        <Image
          src={BLOOM.src}
          alt=""
          width={BLOOM.size}
          height={BLOOM.size}
          className="block size-full max-w-none"
        />
      </div>
    </div>
  );
}
