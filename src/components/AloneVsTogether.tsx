import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import Badge from "@/components/ui/Badge";
import ComparisonCard from "@/components/ui/ComparisonCard";
import PersonChip from "@/components/ui/PersonChip";
import StrengthBar from "@/components/ui/StrengthBar";
import { ArrowDataTransfer, Cancel, Tick } from "@/components/ui/icons";
import { CLUSTER_FRAMING, PEOPLE, type PersonKey } from "@/data/people";

/*
 * "Alone Vs Together" — two 564x628 panels on a 1240-wide row, 112px apart,
 * with the VS mark centred between them.
 */

const ROW_W = 1240;
const ROW_H = 628;

/** The squad cluster: offsets and diameters straight off the artboard. */
const CLUSTER: { person: PersonKey; size: number; left: number; top: number }[] =
  [
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
    <ComparisonCard variant="alone">
      <div className="absolute top-[148px] left-1/2 flex w-[216px] -translate-x-1/2 flex-col items-center gap-5">
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
            <p className="font-heading text-[16px] leading-[1.2] whitespace-nowrap text-white/50">
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

        <p className="font-heading w-full text-center text-[12px] leading-[1.4] text-white opacity-50">
          File, on its own. High DTI. Rebuilding score. No approval.
        </p>
      </div>

      <PersonChip person="lilit" reason="Income too low" left={367} top={47} />
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

      <StrengthBar
        title="Alone Strength"
        note="Not enough approval power."
        stats={[
          { value: "502", label: "Credit Score" },
          { value: "68%", label: "DTI" },
          { value: "$4.5k", label: "Income" },
        ]}
      />
    </ComparisonCard>
  );
}

function SquadCard() {
  return (
    <ComparisonCard variant="squad">
      <div className="absolute top-[133.5px] left-[calc(50%+1px)] flex w-[241px] -translate-x-1/2 flex-col items-center gap-5">
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

        <p className="w-[192px] text-center text-[12px] leading-[1.4] tracking-[-0.24px] text-white/50">
          Same file. Backed by three others and one shared reserve.
        </p>
      </div>

      <PersonChip person="lilit" approved left={336} top={42} />
      <PersonChip person="aram" approved left={22} top={76} />
      <PersonChip person="mika" approved left={16} top={327} />
      <PersonChip person="david" approved left={373} top={373} />

      <StrengthBar
        title="Squad Strength"
        note="Higher approval power."
        stats={[
          { value: "712", label: "Avg Squad score", positive: true },
          { value: "34%", label: "Avg DTI", positive: true },
          { value: "$21.5K", label: "Combined Income", positive: true },
        ]}
      />
    </ComparisonCard>
  );
}

export default function AloneVsTogether() {
  return (
    <section className="w-full pt-[176px] pb-[170px]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-15 px-6">
        <div className="flex w-full flex-col items-center gap-4">
          <Badge icon={<ArrowDataTransfer />}>Alone Vs Together</Badge>
          <div className="flex w-full flex-col items-center gap-4 text-center">
            {/* pb-px: Figma measures this two-line box at 97px where the
                browser lays it out at 96, which would pull everything below
                up by a pixel. The glyphs themselves already align. */}
            <h2 className="font-heading w-full pb-px text-[clamp(1.75rem,3.9vw,3rem)] leading-none font-normal">
              Alone, each of you falls short.
              <br />
              <span className="font-display italic">Together,</span> you qualify
              for more.
            </h2>
            <p className="max-w-[604px] text-base leading-[1.5] tracking-[-0.32px] text-white/70">
              Squad combines your profiles into one group application.
              <br />
              Different strengths, one shared line.
            </p>
          </div>
        </div>
      </div>

      {/* Gap lives on the wrapper: .stage-viewport sets its own margin-block
          and a utility here would collide with it. */}
      <div className="mt-15 w-full">
        <div className="stage-viewport w-full">
          <div
            className="stage-sizer relative"
            style={
              {
                "--stage-w": ROW_W,
                "--stage-h": ROW_H,
                "--stage-min": 0.5,
              } as React.CSSProperties
            }
          >
            <div className="stage relative">
              <div className="flex h-full items-start gap-28">
                <AloneCard />
                <SquadCard />
              </div>
              <span className="font-display absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[48px] leading-none text-white italic opacity-70">
                VS
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
