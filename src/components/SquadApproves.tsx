import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import Badge from "@/components/ui/Badge";
import SquadCard from "@/components/ui/SquadCard";
import StatusPill, { type Status } from "@/components/ui/StatusPill";
import VoteRow from "@/components/ui/VoteRow";
import { CheckmarkBadge, Reserve } from "@/components/ui/icons";
import { LEDGER_FRAMING, PEOPLE, VOTE_FRAMING } from "@/data/people";

/*
 * "Squad Approves" — a 1118x532 diagram (request card, squad card, connector
 * lines, vote list) sitting above a 827x122 ledger bar, both centred in a
 * 1240 content column.
 *
 * The one Figma quirk worth flagging: the metadata reports the SquadCard
 * instance at y=350 inside its 350px-tall parent group — i.e. entirely below
 * the visible content. Empirically (screenshot pixel-measured) it actually
 * sits at y=0, overlapping the row exactly as the design shows; every other
 * child's metadata position checked out exactly against the screenshot, so
 * this one instance's y is treated as a Figma export artifact and overridden.
 */

const STAGE_W = 1118;
const STAGE_H = 532;

function ApproverRow({ name, status }: { name: string; status: Status }) {
  return (
    <div className="flex w-full items-start justify-between rounded-lg bg-white/5 py-2 pr-2 pl-3">
      <p className="text-center text-[12px] leading-[1.5] tracking-[-0.24px] text-white/80">
        {name}
      </p>
      <StatusPill status={status} />
    </div>
  );
}

function RequestCard() {
  return (
    <div
      className="absolute overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,8,20,0.5)]"
      style={{ left: 0, top: 8, width: 286, height: 334 }}
    >
      <Image
        src="/approve/request-glow-1.svg"
        alt=""
        width={436}
        height={351}
        className="pointer-events-none absolute -top-[190px] left-1/2 max-w-none -translate-x-1/2"
      />
      <Image
        src="/approve/request-glow-2.svg"
        alt=""
        width={353}
        height={347}
        className="pointer-events-none absolute -top-[186px] left-[calc(50%+0.5px)] max-w-none -translate-x-1/2"
      />

      <div className="relative flex w-[286px] flex-col items-start gap-4 px-4 pt-4 pb-6">
        <div className="flex w-full flex-col items-center gap-2">
          <AvatarRing
            size={40}
            person={PEOPLE.mika}
            framing={VOTE_FRAMING.mika}
          />
          <div className="flex flex-col items-center gap-1 text-center leading-none whitespace-nowrap text-white">
            <p className="font-heading text-[14px] font-medium">
              Mika needs $1,500 more
            </p>
            <p className="font-heading text-[10px] opacity-50">
              MacBook Pro - above lane limit
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-3">
          <ApproverRow name="Maya Reynolds" status="approved" />
          <ApproverRow name="Lilit Thompson" status="approved" />
          <ApproverRow name="Jordan Mitchell" status="pending" />
        </div>

        <div className="relative h-1 w-full shrink-0 rounded-[20px] bg-white/10">
          <div
            className="absolute top-0 left-0 h-1 rounded-[20px]"
            style={{
              width: "65%",
              backgroundImage:
                "linear-gradient(5deg, #2b58fa 10.843%, #89a3ff 84.747%)",
            }}
          />
        </div>

        <div className="border-pending/10 bg-pending/5 flex w-full items-center justify-center gap-2 rounded-lg border py-2 pr-2 pl-3">
          <p className="text-pending text-center text-[12px] leading-[1.5] tracking-[-0.24px]">
            2 of 3 approved
          </p>
          <span className="bg-pending block size-[3px] shrink-0 rounded-full" />
          <p className="text-pending text-center text-[12px] leading-[1.5] tracking-[-0.24px]">
            waiting on Jordan
          </p>
        </div>
      </div>
    </div>
  );
}

function VoteList() {
  return (
    <div
      className="absolute flex flex-col items-start justify-between rounded-[20px] border border-white/10 p-2 shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]"
      style={{ left: 816, top: 10, width: 302, height: 330 }}
    >
      <VoteRow
        person={PEOPLE.david}
        personKey="david"
        amount="$6,000"
        status="approved"
      />
      <VoteRow
        person={PEOPLE.aram}
        personKey="aram"
        amount="$5,250"
        status="pending"
      />
      <VoteRow
        person={{ ...PEOPLE.lilit, name: "Lilit Thompson" }}
        personKey="lilit"
        amount="$5,000"
        status="approved"
      />
    </div>
  );
}

type MemberChipProps = { name: string; amount: string; width: number } & (
  | { personKey: keyof typeof LEDGER_FRAMING; reserve?: false }
  | { personKey?: never; reserve: true }
);

function MemberChip({
  name,
  amount,
  width,
  personKey,
  reserve,
}: MemberChipProps) {
  return (
    <div
      className={`relative flex h-[74px] shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-white/10 py-2.5 ${
        reserve ? "bg-white/[0.02]" : "bg-white/[0.02] backdrop-blur-[4px]"
      }`}
      style={{ width }}
    >
      {reserve ? (
        <Image
          src="/approve/reserve-lines.svg"
          alt=""
          width={234.82}
          height={162.57}
          className="pointer-events-none absolute max-w-none"
          style={{ left: -56, top: -39 }}
        />
      ) : null}

      <div className="relative flex items-center justify-center gap-2">
        {reserve ? (
          <Reserve />
        ) : (
          <AvatarRing
            size={24}
            person={PEOPLE[personKey]}
            framing={LEDGER_FRAMING[personKey]}
          />
        )}
        <p className="font-heading text-center text-[12px] leading-none text-white/70">
          {name}
        </p>
      </div>
      <p className="font-sans relative text-center text-[16px] leading-[1.5] font-semibold tracking-[-0.32px] text-white">
        {amount}
      </p>

      <Image
        src="/approve/chip-glow.svg"
        alt=""
        width={162}
        height={113}
        className="pointer-events-none absolute left-1/2 max-w-none -translate-x-1/2 -translate-y-9"
        style={{ top: "100%" }}
      />
    </div>
  );
}

function LedgerBar() {
  return (
    <div
      className="absolute"
      style={{ left: 145.5, top: 410, width: 827, height: 122 }}
    >
      {/*
        Figma nests this inside the bar's own overflow-clip, yet it visibly
        bleeds well above the border in the reference render (a blur-effect
        vs. clip-order quirk on Figma's side). Rendered as a sibling here so
        it isn't cut off by the bar's rounded corners, matching what's shown.
      */}
      <Image
        src="/approve/ledger-ambient-glow.svg"
        alt=""
        width={547}
        height={158}
        className="pointer-events-none absolute left-1/2 max-w-none -translate-x-1/2"
        style={{ top: -107 }}
      />

      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]">
        <Image
          src="/approve/ledger-glow-1.svg"
          alt=""
          width={1013}
          height={210}
          className="pointer-events-none absolute -top-[34px] left-[calc(50%+15px)] max-w-none -translate-x-1/2"
        />
        <Image
          src="/approve/ledger-glow-2.svg"
          alt=""
          width={755}
          height={209}
          className="pointer-events-none absolute -top-[33px] left-[calc(50%+17px)] max-w-none -translate-x-1/2"
        />
        <Image
          src="/approve/ledger-glow-3.svg"
          alt=""
          width={477}
          height={210}
          className="pointer-events-none absolute -top-[34px] left-[270px] max-w-none mix-blend-plus-lighter"
        />
        <Image
          src="/approve/ledger-texture.svg"
          alt=""
          width={960}
          height={238}
          className="pointer-events-none absolute top-[55px] left-0 max-w-none"
        />

        <div className="relative flex items-center gap-8 p-6">
          <div className="flex flex-col items-start gap-1">
            <p className="text-[12px] leading-[1.5] font-medium tracking-[-0.24px] text-white/70">
              One Line
            </p>
            <p className="font-heading text-[24px] leading-[1.2] text-white">
              $25,000
            </p>
          </div>

          <span className="h-10 w-px shrink-0 bg-white/10" />

          <div className="flex items-center gap-1.5">
            <MemberChip
              personKey="david"
              name="David"
              amount="$6,000"
              width={130}
            />
            <MemberChip
              personKey="lilit"
              name="Lilit"
              amount="$5,000"
              width={120}
            />
            <MemberChip
              personKey="aram"
              name="Aram"
              amount="$4,000"
              width={110}
            />
            <MemberChip
              personKey="mika"
              name="Mike"
              amount="$7,000"
              width={140}
            />
            <MemberChip reserve name="Reserve" amount="$3,000" width={100} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SquadApproves() {
  return (
    <section className="w-full pt-25 pb-[170px]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-4 px-6">
        <Badge icon={<CheckmarkBadge />}>Squad Approves</Badge>
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <h2 className="font-heading w-full pb-px text-[clamp(1.75rem,3.9vw,3rem)] leading-none font-normal">
            Need more than your lane?
            <br />
            <span className="font-display italic">The squad</span> decides.
          </h2>
          <p className="max-w-[604px] text-base leading-normal tracking-[-0.32px] text-white/70">
            When one member needs to spend above their limit, the squad votes.
            The extra releases from the shared reserve - the group total never
            changes.
          </p>
        </div>
      </div>

      <div className="relative mt-15 w-full">
        {/*
          Ambient glow behind the SquadCard — Figma's Ellipse 6146. It is the
          first child of the section frame, so it sits under everything in the
          section; -z-10 reproduces that without the copy above needing to opt
          into a stacking context.

          It is centred on the card at stage (559, 176) and the asset carries
          its own 100px blur margin, putting its top-left 200px up and left of
          the 294px ellipse — i.e. 171px above the stage. That is why it lives
          out here rather than inside .stage-viewport, which clips on the y axis
          and would cut the blur into a hard edge. The +4px on the offset is
          .stage-viewport's negative margin-block collapsing through this
          wrapper, the same correction the hero glow needs.
        */}
        <Image
          src="/approve/squadcard-glow.svg"
          alt=""
          width={694}
          height={694}
          className="pointer-events-none absolute left-1/2 -z-10 max-w-none -translate-x-1/2"
          style={{ top: -167 }}
        />

        <div className="stage-viewport w-full">
          <div
            className="stage-sizer relative"
            style={
              {
                "--stage-w": STAGE_W,
                "--stage-h": STAGE_H,
                "--stage-min": 0.45,
              } as React.CSSProperties
            }
          >
            <div className="stage relative">
              <Image
                src="/approve/connector-lines.svg"
                alt=""
                width={536}
                height={219}
                className="pointer-events-none absolute max-w-none"
                style={{ left: 287, top: 66 }}
              />

              <RequestCard />

              <div className="absolute" style={{ left: 446, top: 0 }}>
                <SquadCard size={218} />
              </div>

              <VoteList />

              <LedgerBar />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
