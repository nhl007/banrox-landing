import PassportCard, {
  type PassportCardProps,
} from "@/components/ui/PassportCard";
import SquadCard from "@/components/ui/SquadCard";

/*
 * Five cards fanned across a 1262x516 stage. Positions are the Figma offsets
 * relative to the group origin; z-order follows Figma's layer order, which is
 * why Mika sits over Aram and Lilit sits over David.
 */

type Placed = PassportCardProps & { left: number; top: number; z: string };

const cards: Placed[] = [
  {
    left: 0,
    top: 0,
    z: "z-10",
    name: "Aram Petrosyan",
    subtitle: "Prefect credit. low income",
    avatar: {
      src: "/avatars/aram.png",
      left: "-5.88%",
      right: "-8.82%",
      top: "calc(50% + 4.5px)",
      aspect: "1200/1200",
    },
    bureaus: [
      {
        bureau: "experian",
        score: 762,
        rating: "Good",
        range: "300-850",
        fill: 43,
      },
      {
        bureau: "transunion",
        score: 748,
        rating: "Good",
        range: "300-850",
        fill: 41,
      },
      {
        bureau: "equifax",
        score: 762,
        rating: "Good",
        range: "300-850",
        fill: 43,
      },
    ],
    metrics: [
      { icon: "wallet", label: "Verified income", value: "$9,800/mo" },
      {
        icon: "speed",
        label: "Debt-to-income",
        value: "21%",
        tone: "positive",
      },
      { icon: "pulse", label: "Cash-flow score", value: "92/100" },
      {
        icon: "shield",
        label: "Identity & privacy",
        value: "88/100",
        tone: "positiveStrong",
      },
    ],
  },
  {
    left: 251,
    top: 48,
    z: "z-40",
    name: "Mika Grigoryan",
    subtitle: "Good credit, growing income",
    avatar: {
      src: "/avatars/mika.png",
      left: "-11.76%",
      right: "-11.76%",
      top: "calc(50% + 2px)",
      aspect: "1200/1200",
    },
    bureaus: [
      {
        bureau: "experian",
        score: 588,
        rating: "Good",
        range: "300-850",
        fill: 30,
      },
      {
        bureau: "transunion",
        score: 574,
        rating: "Good",
        range: "300-850",
        fill: 26,
      },
      {
        bureau: "equifax",
        score: 607,
        rating: "Good",
        range: "300-850",
        fill: 32,
      },
    ],
    metrics: [
      { icon: "wallet", label: "Verified income", value: "$3,400/mo" },
      { icon: "speed", label: "Debt-to-income", value: "52%", tone: "warning" },
      { icon: "pulse", label: "Cash-flow score", value: "64/100" },
      {
        icon: "shield",
        label: "Identity & privacy",
        value: "88/100",
        tone: "positiveStrong",
      },
    ],
  },
  {
    left: 751,
    top: 48,
    z: "z-30",
    name: "Lilit Sargsyan",
    subtitle: "Prefect credit. low income",
    avatar: {
      src: "/avatars/lilit.png",
      left: "-5.88%",
      right: "-5.88%",
      top: "calc(50% + 2px)",
      aspect: "1200/1200",
    },
    bureaus: [
      {
        bureau: "experian",
        score: 502,
        rating: "Good",
        range: "300-850",
        fill: 28,
      },
      {
        bureau: "transunion",
        score: 496,
        rating: "Good",
        range: "300-850",
        fill: 25,
      },
      {
        bureau: "equifax",
        score: 513,
        rating: "Good",
        range: "300-850",
        fill: 34,
      },
    ],
    metrics: [
      { icon: "wallet", label: "Verified income", value: "$2,100/mo" },
      {
        icon: "speed",
        label: "Debt-to-income",
        value: "68%",
        tone: "negative",
      },
      { icon: "pulse", label: "Cash-flow score", value: "38/100" },
      {
        icon: "shield",
        label: "Identity & privacy",
        value: "62/100",
        tone: "warning",
      },
    ],
  },
  {
    left: 1002,
    top: 0,
    z: "z-20",
    name: "David Melkonyan",
    subtitle: "Prefect credit. high income",
    avatar: {
      src: "/avatars/david.png",
      left: "5.88%",
      right: "5.88%",
      top: "calc(50% + 7px)",
      aspect: "800/1200",
    },
    bureaus: [
      {
        bureau: "experian",
        score: 815,
        rating: "Good",
        range: "300-850",
        fill: 50,
      },
      {
        bureau: "transunion",
        score: 802,
        rating: "Good",
        range: "300-850",
        fill: 46,
      },
      {
        bureau: "equifax",
        score: 829,
        rating: "Good",
        range: "300-850",
        fill: 53,
      },
    ],
    metrics: [
      { icon: "wallet", label: "Verified income", value: "$19,500/mo" },
      {
        icon: "speed",
        label: "Debt-to-income",
        value: "18%",
        tone: "positive",
      },
      { icon: "pulse", label: "Cash-flow score", value: "95/100" },
      {
        icon: "shield",
        label: "Identity & privacy",
        value: "99/100",
        tone: "positiveStrong",
      },
    ],
  },
];

/**
 * The fan's artboard, exported because the hero's ambient bloom is placed in
 * these coordinates and needs a stage of the same size to sit in — see
 * StageBackdrop.
 */
export const FAN_STAGE = { width: 1262, height: 516 } as const;

/*
 * The hover, and what it deliberately is not.
 *
 * It does not lift the card. The fan sits inside .stage-viewport, which clips on
 * both axes, and the top row of cards is flush with the stage's own ceiling — so
 * any upward translate takes the card straight into that clip and shears its top
 * edge off. Nothing here moves at all.
 *
 * It does not scale it either. Growing the card re-rasters everything on it —
 * three bureau meters, four metric rows, the avatar — for the length of the
 * transition, and it pushes the card into its neighbours in a fan whose whole
 * point is the overlap.
 *
 * And it draws nothing around the card. The card already carries its own light:
 * three glow layers at its top edge, inside its overflow-hidden box. Hovering
 * brings those up instead, so the response happens on the card rather than in
 * the space around it — see GLOW_HOVER in PassportCard, which is what `group/
 * card` here exists to reach.
 *
 * RAISE is the only thing that changes outside the card, and it earns its keep
 * precisely because the glow lives at the card's top edge: the cards overlap, so
 * without it a neighbour keeps its corner over the very strip that lights up.
 * z-[45] clears every passport card (z-10 to z-40) and stays under the Squad
 * card's z-50, so a hovered card comes forward of its neighbours but never in
 * front of the product in the middle.
 *
 * Tailwind puts `hover:` and `group-hover:` behind `@media (hover: hover)`, so a
 * tap on a phone cannot leave a card stuck lit.
 */
const CARD = "group/card cursor-pointer";
const RAISE = "hover:z-[45]";

/*
 * The Squad card has no TopGlow to bring up — it is a silver face, not a dark
 * one — so its hover is a little more light across the whole card. Same idea,
 * same restraint, still nothing outside its own box, and still no movement.
 */
const SQUAD =
  "cursor-pointer transition-[filter] duration-500 ease-out hover:brightness-110 motion-reduce:transition-none";

/*
 * The perspective sits on the stage so the fan's entrance (the hero timeline
 * rotates it up from flat) is measured in stage units and scales along with
 * everything else. The cards then live one level down, on a plane of their own,
 * because that plane is what turns — the stage itself already carries the scale
 * transform.
 *
 * The value is deliberately short. Perspective only bites while the stack is
 * tilted; at rest the plane is parallel to the screen and undistorted at any
 * distance. A nearer camera is what gives the flat stack enough projected depth
 * to read as a stack of cards rather than a smear. Keep it in step with
 * MOTION.flat.perspective.
 */
export default function CardFan() {
  return (
    <div className="stage-viewport w-full">
      <div
        className="stage-sizer"
        style={
          {
            "--stage-w": FAN_STAGE.width,
            "--stage-h": FAN_STAGE.height,
          } as React.CSSProperties
        }
      >
        <div className="stage" style={{ perspective: "900px" }}>
          <div className="absolute inset-0" data-reveal="fan">
            {cards.map((card) => {
              const { left, top, z, ...cardProps } = card;
              return (
                <div
                  key={card.name}
                  className={`absolute ${z} ${RAISE}`}
                  style={{ left, top }}
                  data-reveal="card"
                >
                  <PassportCard {...cardProps} className={CARD} />
                </div>
              );
            })}
            {/* Hovers like the rest of them, but it never floats and it never
                raises: it is [data-fan-anchor], not [data-reveal='card'], so
                heroFloat skips it — held still on purpose, since it is the
                product and the other four are files about people — and it is
                already the front of the fan at z-50, where z-[45] would only
                push it behind the four it sits in front of. */}
            <div
              className="absolute z-50"
              style={{ left: 501, top: 96 }}
              data-fan-anchor=""
            >
              <SquadCard className={SQUAD} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
