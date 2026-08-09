/*
 * The four squad members appear across several sections at different avatar
 * sizes. Name, portrait and intrinsic aspect are invariant; the crop framing is
 * not — Figma nudges it per placement — so that travels with each usage.
 */

export type Person = {
  name: string;
  src: string;
  /** Intrinsic aspect of the source portrait. */
  aspect: string;
};

/** Where the portrait sits inside its circular mask, as Figma specifies it. */
export type Framing = {
  left: string;
  right: string;
  top: string;
};

export const PEOPLE = {
  aram: {
    name: "Aram Petrosyan",
    src: "/avatars/aram.png",
    aspect: "1200/1200",
  },
  mika: {
    name: "Mika Grigoryan",
    src: "/avatars/mika.png",
    aspect: "1200/1200",
  },
  lilit: {
    name: "Lilit Sargsyan",
    src: "/avatars/lilit.png",
    aspect: "1200/1200",
  },
  david: {
    name: "David Melkonyan",
    src: "/avatars/david.png",
    aspect: "800/1200",
  },
} as const satisfies Record<string, Person>;

export type PersonKey = keyof typeof PEOPLE;

/** Framing used by the 40.8px avatars in the comparison chips. */
export const CHIP_FRAMING: Record<PersonKey, Framing> = {
  aram: { left: "-5.88%", right: "-8.83%", top: "calc(50% + 4.03px)" },
  mika: { left: "-8.82%", right: "-14.71%", top: "calc(50% + 1.89px)" },
  lilit: { left: "-5.89%", right: "-5.88%", top: "calc(50% + 0.6px)" },
  david: { left: "5.89%", right: "5.88%", top: "calc(50% + 6.17px)" },
};

/** Framing used by the 34px avatars in the "With Squad" cluster. */
export const CLUSTER_FRAMING: Record<PersonKey, Framing> = {
  aram: { left: "-5.88%", right: "-8.82%", top: "calc(50% + 4.43px)" },
  mika: { left: "-8.82%", right: "-14.71%", top: "calc(50% + 2.29px)" },
  lilit: { left: "-5.88%", right: "-5.88%", top: "calc(50% + 1.2px)" },
  david: { left: "5.88%", right: "5.88%", top: "calc(50% + 7px)" },
};

/**
 * Framing used by the 34px avatars in the vote rows and the request-card
 * header. left/right % is the crop and is identical across every instance of
 * a given person (it only depends on the source image, not the container
 * size) — only the px top offset changes with the ring's size.
 */
export const VOTE_FRAMING: Record<PersonKey, Framing> = {
  aram: { left: "-5.88%", right: "-8.82%", top: "calc(50% + 4.5px)" },
  mika: { left: "-8.82%", right: "-14.71%", top: "calc(50% + 2px)" },
  lilit: { left: "-5.88%", right: "-5.88%", top: "calc(50% + 1px)" },
  david: { left: "5.88%", right: "5.88%", top: "calc(50% + 7px)" },
};

/** Framing used by the 20.4px avatars in the ledger bar's member chips. */
export const LEDGER_FRAMING: Record<PersonKey, Framing> = {
  aram: { left: "-5.88%", right: "-8.83%", top: "calc(50% + 2.7px)" },
  mika: { left: "-8.83%", right: "-14.7%", top: "calc(50% + 1.2px)" },
  lilit: { left: "-5.88%", right: "-5.89%", top: "calc(50% + 0.6px)" },
  david: { left: "5.88%", right: "5.89%", top: "calc(50% + 4.2px)" },
};

/**
 * Framing used by the 25.5px avatars in the step-2 score badges. Same crop as
 * VOTE_FRAMING (34px) — every top offset here is exactly 0.75x its VOTE_FRAMING
 * counterpart, i.e. the offset scales with container size as expected; the
 * left/right % is identical since it depends only on the source crop.
 */
export const SCORE_FRAMING: Record<PersonKey, Framing> = {
  aram: { left: "-5.88%", right: "-8.82%", top: "calc(50% + 3.38px)" },
  mika: { left: "-8.82%", right: "-14.71%", top: "calc(50% + 1.5px)" },
  lilit: { left: "-5.88%", right: "-5.88%", top: "calc(50% + 0.75px)" },
  david: { left: "5.88%", right: "5.88%", top: "calc(50% + 5.25px)" },
};
