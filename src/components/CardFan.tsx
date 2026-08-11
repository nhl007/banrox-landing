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
      { bureau: "experian", score: 762, rating: "Good", range: "300-850", fill: 43 },
      { bureau: "transunion", score: 748, rating: "Good", range: "300-850", fill: 41 },
      { bureau: "equifax", score: 762, rating: "Good", range: "300-850", fill: 43 },
    ],
    metrics: [
      { icon: "wallet", label: "Verified income", value: "$9,800/mo" },
      { icon: "speed", label: "Debt-to-income", value: "21%", tone: "positive" },
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
      { bureau: "experian", score: 588, rating: "Good", range: "300-850", fill: 30 },
      { bureau: "transunion", score: 574, rating: "Good", range: "300-850", fill: 26 },
      { bureau: "equifax", score: 607, rating: "Good", range: "300-850", fill: 32 },
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
      { bureau: "experian", score: 502, rating: "Good", range: "300-850", fill: 28 },
      { bureau: "transunion", score: 496, rating: "Good", range: "300-850", fill: 25 },
      { bureau: "equifax", score: 513, rating: "Good", range: "300-850", fill: 34 },
    ],
    metrics: [
      { icon: "wallet", label: "Verified income", value: "$2,100/mo" },
      { icon: "speed", label: "Debt-to-income", value: "68%", tone: "negative" },
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
      { bureau: "experian", score: 815, rating: "Good", range: "300-850", fill: 50 },
      { bureau: "transunion", score: 802, rating: "Good", range: "300-850", fill: 46 },
      { bureau: "equifax", score: 829, rating: "Good", range: "300-850", fill: 53 },
    ],
    metrics: [
      { icon: "wallet", label: "Verified income", value: "$19,500/mo" },
      { icon: "speed", label: "Debt-to-income", value: "18%", tone: "positive" },
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
      <div className="stage-sizer relative" style={{ "--stage-w": 1262, "--stage-h": 516 } as React.CSSProperties}>
        <div className="stage relative" style={{ perspective: "900px" }}>
          <div className="absolute inset-0" data-reveal="fan">
            {cards.map((card) => {
              const { left, top, z, ...cardProps } = card;
              return (
                <div
                  key={card.name}
                  className={`absolute ${z}`}
                  style={{ left, top }}
                  data-reveal="card"
                >
                  <PassportCard {...cardProps} />
                </div>
              );
            })}
            <div className="absolute z-50" style={{ left: 501, top: 96 }} data-fan-anchor="">
              <SquadCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
