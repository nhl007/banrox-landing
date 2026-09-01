import Image from "next/image";

/* The hero's bloom, for the three sections that never had one. */
const BLOOM = { src: "/hero/glow-bloom.svg", size: 1828 } as const;

type Placed = {
  from: readonly [number, number];
  left: string;
  top: string;
  width: string;
  height: string;
};

const BLOOMS: Record<string, Placed> = {
  /* Behind the headings, arriving downwards onto them — see above. */
  alone: {
    from: [0, -1],
    left: "2%",
    top: "-20%",
    width: "96%",
    height: "70%",
  },

  /* Above the cards rather than behind them. */
  works: {
    from: [1, 0.25],
    left: "34%",
    top: "0%",
    width: "64%",
    height: "48%",
  },

  /* Down from the top left, onto the largest single card on the page. */
  invitation: {
    from: [-0.7, -0.7],
    left: "6%",
    top: "6%",
    width: "58%",
    height: "64%",
  },
};

/**
 * Drop it in as the FIRST child of a <section>, give that section `isolate`
 * and its .screen-body `relative z-10`, and the layer is pinned behind the
 * section's content and in front of the page — see .screen-glow in globals.css
 * for why both of those are.
 */
export default function SectionBloom({ id }: { id: keyof typeof BLOOMS }) {
  const placed = BLOOMS[id];
  if (!placed) return null;

  const { from, ...box } = placed;

  return (
    /* Above the gate only. */
    <div className="screen-glow hidden sm:block" aria-hidden="true">
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
