import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import Badge from "@/components/ui/Badge";
import ComparisonCard from "@/components/ui/ComparisonCard";
import PersonChip from "@/components/ui/PersonChip";
import StrengthBar from "@/components/ui/StrengthBar";
import { ArrowDataTransfer, Cancel, Tick } from "@/components/ui/icons";
import SectionBloom from "@/components/ui/SectionBloom";
import { CLUSTER_FRAMING, PEOPLE, type PersonKey } from "@/data/people";

/*
 * "Alone Vs Together" — two 564x628 panels on a 1240-wide row, 112px apart,
 * with the VS mark centred between them.
 */

const ROW_W = 1240;
const ROW_H = 628;

/** The squad cluster: offsets and diameters straight off the artboard. */
const CLUSTER: {
  person: PersonKey;
  size: number;
  left: number;
  top: number;
}[] = [
  { person: "david", size: 40, left: 0, top: 17 },
  { person: "lilit", size: 56, left: 29, top: 41 },
  { person: "mika", size: 40, left: 74, top: 17 },
  { person: "aram", size: 40, left: 37, top: 0 },
];

function Separator({ tone }: { tone: "negative" | "success" }) {
  return (
    <span
      className={`block size-1 shrink-0 rounded-full ${
        tone === "negative" ? "bg-negative" : "bg-success"
      }`}
    />
  );
}

function AloneCard() {
  return (
    <ComparisonCard variant="alone" reveal="card-left">
      <div className="flex w-full flex-col items-center gap-5 px-4 pt-6 sm:absolute sm:top-[148px] sm:left-1/2 sm:w-[216px] sm:-translate-x-1/2 sm:px-0 sm:pt-0">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <AvatarRing size={56} tone="muted">
              <Image
                src="/icons/shield-filled.svg"
                alt=""
                width={24}
                height={27}
                style={{ width: 23.91, height: 26.65 }}
              />
            </AvatarRing>
            <p className="font-heading text-base leading-[1.2] whitespace-nowrap text-white/50">
              Applying Alone
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-0.5">
            <div className="flex items-center justify-center gap-2">
              <span className="flex items-center gap-2">
                <Cancel size={20} />
                <span className="font-heading text-negative text-[24px] leading-[1.2] whitespace-nowrap">
                  Declined
                </span>
              </span>
              <Separator tone="negative" />
              <span className="font-heading text-negative text-[24px] leading-[1.2] font-medium whitespace-nowrap">
                $0.00
              </span>
            </div>
            <p className="font-heading text-[16px] leading-[1.2] whitespace-nowrap text-white/70">
              No access
            </p>
          </div>
        </div>

        <p className="font-heading w-full text-center text-base leading-[1.5] text-white opacity-50 sm:text-[12px] sm:leading-[1.4]">
          File, on its own. High DTI. Rebuilding score. No approval.
        </p>
      </div>

      {/* Scattered around the panel on the artboard, a wrapped row underneath
          the verdict on a phone: their positions mean "all around you", which a
          564px frame can say and a 320px one cannot. */}
      <div className="flex flex-wrap justify-center gap-2 px-4 pt-5 sm:contents">
        <PersonChip
          person="lilit"
          reason="Income too low"
          left={367}
          top={47}
        />
        <PersonChip
          person="aram"
          reason="Recent account issue"
          left={34}
          top={100}
        />
        <PersonChip
          person="mika"
          reason="Limited credit history"
          left={16}
          top={353}
        />
        <PersonChip
          person="david"
          reason="High utilization"
          left={381}
          top={376}
        />
      </div>

      <div className="px-4 pt-5 pb-5 sm:contents">
        <StrengthBar
          reveal="bar"
          title="Alone Strength"
          note="Not enough approval power."
          stats={[
            { value: "502", label: "Credit Score" },
            { value: "68%", label: "DTI" },
            { value: "$4.5k", label: "Income" },
          ]}
        />
      </div>
    </ComparisonCard>
  );
}

function SquadCard() {
  return (
    <ComparisonCard variant="squad" reveal="card-right">
      <div className="flex w-full flex-col items-center gap-5 px-4 pt-6 sm:absolute sm:top-[133.5px] sm:left-[calc(50%+1px)] sm:w-[241px] sm:-translate-x-1/2 sm:px-0 sm:pt-0">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            {/* AvatarRing is itself `relative`, so placement goes on a wrapper
                rather than through className — the two would tie and collide. */}
            <div className="relative h-[97px] w-[114px]">
              {CLUSTER.map(({ person, size, left, top }) => (
                <span key={person} className="absolute" style={{ left, top }}>
                  <AvatarRing
                    size={size}
                    person={PEOPLE[person]}
                    framing={CLUSTER_FRAMING[person]}
                  />
                </span>
              ))}
            </div>
            <p className="font-heading text-[16px] leading-[1.2] whitespace-nowrap text-white/70">
              With Squad
            </p>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex w-full items-center gap-2">
              <span className="flex items-center gap-1.5">
                <Tick size={20} />
                <span className="font-heading text-success text-[24px] leading-[1.2] font-medium whitespace-nowrap">
                  Approved
                </span>
              </span>
              <Separator tone="success" />
              <span className="font-heading text-success text-[24px] leading-[1.2] font-medium whitespace-nowrap">
                $25,000
              </span>
            </div>
            <p className="font-heading text-center text-[16px] leading-[1.2] font-medium whitespace-nowrap text-white">
              Shared Credit Line
            </p>
          </div>
        </div>

        <p className="w-full max-w-[192px] text-center text-base leading-[1.5] tracking-[-0.24px] text-white/50 sm:text-[12px] sm:leading-[1.4]">
          Same file. Backed by three others and one shared reserve.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 px-4 pt-5 sm:contents">
        <PersonChip person="lilit" approved left={336} top={42} />
        <PersonChip person="aram" approved left={22} top={76} />
        <PersonChip person="mika" approved left={16} top={327} />
        <PersonChip person="david" approved left={373} top={373} />
      </div>

      <div className="px-4 pt-5 pb-5 sm:contents">
        <StrengthBar
          reveal="bar"
          title="Squad Strength"
          note="Higher approval power."
          stats={[
            { value: "712", label: "Avg Squad score", positive: true },
            { value: "34%", label: "Avg DTI", positive: true },
            { value: "$21.5K", label: "Combined Income", positive: true },
          ]}
        />
      </div>
    </ComparisonCard>
  );
}

export default function AloneVsTogether() {
  return (
    <section
      className="screen relative isolate w-full"
      data-sequence-section="alone"
    >
      {/* isolate above, z-10 here: between them the ambient ground is pinned
          behind this section's content and in front of the page, and cannot
          escape to either side of that. See .screen-glow. */}
      <SectionBloom id="alone" />
      <div className="screen-body relative z-10">
        <div className="screen-copy mx-auto flex max-w-[1240px] flex-col items-center gap-4 px-5 sm:gap-[clamp(0.5rem,1.8svh,1rem)] sm:px-6">
          <div className="flex" data-reveal="copy">
            <Badge icon={<ArrowDataTransfer />}>Alone Vs Together</Badge>
          </div>
          <div className="flex w-full flex-col items-center gap-[clamp(0.5rem,1.8svh,1rem)] text-center">
            {/* pb-px: Figma measures this two-line box at 97px where the
                browser lays it out at 96, which would pull everything below
                up by a pixel. The glyphs themselves already align. */}
            <h2
              className="font-heading type-title w-full pb-px leading-none font-normal"
              data-reveal="copy"
            >
              Alone, each of you falls short.
              <br />
              <span className="font-display italic">Together,</span> you qualify
              for more.
            </h2>
            <p
              className="type-lede type-measure max-w-[604px] tracking-[-0.32px] text-white/70"
              data-reveal="copy"
            >
              Squad combines your profiles into one group application.
              <br />
              Different strengths, one shared line.
            </p>
          </div>
        </div>

        {/*
          stage-viewport-clip: the panels start a little below where they sit
          (MOTION.alone.lift) and shorter than they end up, so both extend past
          the stage's floor on the way in.

          They used to start off the viewport's left and right edges instead,
          which is what this class was added for: a rightward translate in an
          LTR scroll container is *scrollable* overflow, so it raised a
          horizontal scrollbar and held it for as long as the panel was parked
          outside. The clip still has to be on both axes — `overflow-x: clip`
          beside the existing `overflow-y: hidden` computes back to `hidden`,
          leaving it a scroll container.
        */}
        <div className="screen-payload px-5 sm:px-0">
          <div className="stage-viewport stage-viewport-clip stage-fluid">
            <div
              className="stage-sizer"
              style={
                {
                  "--stage-w": ROW_W,
                  "--stage-h": ROW_H,
                } as React.CSSProperties
              }
            >
              <div className="stage w-full sm:w-auto">
                {/*
                  sm:scale-[0.92] — the row, a shade smaller than the artboard
                  draws it.

                  On the row rather than on either card, and that is the whole
                  point of putting it here: the two panels, the 112px between
                  them and the VS in the middle are one composition, and
                  shrinking a card on its own would widen the gap around it and
                  leave the VS at full size. Scaled together from the centre,
                  nothing about the arrangement changes except how much of the
                  screen it takes.

                  Nothing here has to be reconciled with the sequence: it
                  writes to the panels, the VS and the copy, and never to this
                  row — verified by watching every inline style written across
                  the section's whole crossing. An ancestor's scale composes
                  with a descendant's transform in any case, which is what .stage
                  has always done to these same panels.

                  What the property DOES do that matters is establish a
                  containing block, which re-parents the absolutely-placed VS
                  from .stage to this row — the two boxes are identical, so it
                  stays on the same centre, and it is now scaled along with the
                  cards instead of standing at full size between two smaller
                  ones.

                  Behind sm: because below the gate the stage chain is
                  display:contents and this row is a plain column of full-width
                  cards; there is nothing to scale down there and doing it would
                  just make a phone's cards smaller than its own margins.
                */}
                <div className="flex w-full flex-col items-stretch gap-4 sm:h-full sm:scale-[0.92] sm:flex-row sm:items-start sm:gap-28">
                  <AloneCard />
                  {/* Between the two panels on a phone, dead centre of the row
                      from sm: up — the same word doing the same job either way. */}
                  <span
                    className="font-display self-center text-[40px] leading-none text-white italic opacity-70 my-6 sm:my-0 sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:self-auto sm:text-[48px]"
                    data-reveal="vs"
                  >
                    VS
                  </span>
                  <SquadCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
