import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import Badge from "@/components/ui/Badge";
import ConnectorTrace from "@/components/ui/ConnectorTrace";
import SquadCard from "@/components/ui/SquadCard";
import StageBackdrop from "@/components/ui/StageBackdrop";
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

const PHONE_W = 302;
const PHONE_H = 1675;

/**
 * One of those drops. The same hairline the wide run is drawn with — 1px, white
 * at 0.4, dashed 3 on 3 off — as a gradient rather than an asset, because at
 * this length an SVG would be more markup than the line it draws.
 */
function DashDown({ top, run }: { top: number; run: string }) {
  return (
    <span
      aria-hidden
      data-reveal="lines"
      data-trace-axis="y"
      data-run={run}
      className="absolute left-[151px] block h-16 w-px sm:hidden"
      style={{
        top,
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.4) 0 3px, transparent 3px 6px)",
      }}
    />
  );
}

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
      className="absolute top-0 left-[8px] h-[334px] w-[286px] overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,8,20,0.5)] sm:top-[8px] sm:left-0"
      data-reveal="request"
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
      className="absolute top-[812px] left-0 flex w-[302px] flex-col items-start justify-between gap-2 rounded-[20px] border border-white/10 p-2 shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)] sm:top-[10px] sm:left-[816px] sm:h-[330px] sm:gap-0"
      data-reveal="votes"
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
      className={`relative flex h-[74px] w-[140px] shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-white/10 py-2.5 sm:w-[var(--chip-w)] ${
        reserve ? "bg-white/[0.02]" : "bg-white/[0.02] backdrop-blur-[4px]"
      }`}
      style={{ "--chip-w": `${width}px` } as React.CSSProperties}
      data-reveal="chip"
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
      className="absolute top-[1166px] left-[65px] h-[509px] w-[172px] sm:top-[410px] sm:left-[145.5px] sm:h-[122px] sm:w-[827px]"
      data-reveal="ledger"
    >
      <Image
        src="/approve/ledger-ambient-glow.svg"
        alt=""
        width={547}
        height={158}
        className="pointer-events-none absolute left-1/2 hidden max-w-none -translate-x-1/2 sm:block"
        style={{ top: -107 }}
      />

      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 origin-top scale-85 sm:scale-100">
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
            className="pointer-events-none absolute -top-[34px] left-1/2 max-w-none -translate-x-1/2 mix-blend-plus-lighter sm:left-[270px] sm:translate-x-0"
          />
          <Image
            src="/approve/ledger-texture.svg"
            alt=""
            width={960}
            height={238}
            className="pointer-events-none absolute top-[55px] left-1/2 max-w-none -translate-x-1/2 sm:left-0 sm:translate-x-0"
          />
        </div>

        <div className="relative flex h-full flex-col items-center gap-4 p-4 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
          <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <p className="text-[12px] leading-[1.5] font-medium tracking-[-0.24px] text-white/70">
              One Line
            </p>
            <p className="font-heading text-[24px] leading-[1.2] text-white">
              $25,000
            </p>
          </div>

          <span className="h-px w-[140px] shrink-0 bg-white/10 sm:h-10 sm:w-px" />

          <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-start">
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
  /*
   * Clipped on x only: the 694px ambient glow below is wider than a phone
   * viewport and would otherwise scroll the whole page sideways. overflow-y
   * stays visible so the glow keeps bleeding past the section, which is what
   * the design shows.
   */
  return (
    <section
      className="screen relative w-full overflow-x-clip"
      data-sequence-section="approve"
    >
      <div className="screen-body">
        <div className="screen-copy mx-auto flex max-w-[1240px] flex-col items-center gap-4 px-4 sm:gap-[clamp(0.5rem,1.8svh,1rem)] sm:px-6">
          <div className="flex" data-reveal="copy">
            <Badge icon={<CheckmarkBadge />}>Squad Approves</Badge>
          </div>
          <div className="flex w-full flex-col items-center gap-4 text-center sm:gap-[clamp(0.5rem,1.8svh,1rem)]">
            <h2
              className="font-heading type-title w-full pb-px leading-none font-normal"
              data-reveal="copy"
            >
              Need more than <br className="sm:hidden" />
              your lane? <br className="hidden sm:inline" />
              <span className="font-display italic">The squad</span> decides.
            </h2>
            <p
              className="type-lede max-w-[604px] leading-normal tracking-[-0.32px] text-white/70"
              data-reveal="copy"
            >
              When one member needs to spend above their limit, the squad votes.
              The extra releases from the shared reserve - the group total never
              changes.
            </p>
          </div>
        </div>

        <div className="screen-payload px-4 sm:px-0">
          <div className="hidden sm:contents">
            <StageBackdrop width={STAGE_W} height={STAGE_H}>
              <Image
                src="/approve/squadcard-glow.svg"
                alt=""
                width={694}
                height={694}
                className="pointer-events-none absolute max-w-none"
                style={{ left: 559 - 347, top: 176 - 347 }}
                data-reveal="squad-glow"
                data-glow-from="-1 0.25"
              />
            </StageBackdrop>
          </div>

          <div className="stage-viewport stage-viewport-clip stage-fluid">
            <div
              className="stage-sizer"
              style={
                {
                  "--stage-w": STAGE_W,
                  "--stage-h": STAGE_H,
                } as React.CSSProperties
              }
            >
              <div className="stage">
                <div className="panel-fit">
                  <div
                    className="panel-sizer"
                    style={
                      {
                        "--panel-w": PHONE_W,
                        "--panel-h": PHONE_H,
                      } as React.CSSProperties
                    }
                  >
                    <div className="panel-stage">
                      <ConnectorTrace
                        className="hidden sm:block"
                        src="/approve/connector-lines.svg"
                        width={536}
                        height={219}
                        left={287}
                        top={66}
                        pad={20}
                      />
                      <DashDown top={334} run="squad" />
                      <DashDown top={748} run="votes" />

                      <RequestCard />

                      <div
                        className="absolute top-[398px] left-[42px] sm:top-0 sm:left-[446px]"
                        data-reveal="squad"
                      >
                        <SquadCard size={218} />
                      </div>

                      <VoteList />

                      <LedgerBar />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
