"use client";

import Image from "next/image";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { AddTeamIcon, CopyIcon } from "@/components/ui/icons";
import SectionBloom from "@/components/ui/SectionBloom";
import Button from "./ui/Button";

/*
 * "Invite your squad" — a 604x552 card under a heading.
 *
 * The card is the one payload on the page that is not a diagram, but it is
 * staged like one anyway: it has a fixed height (the QR panel, the link bar and
 * the two CTAs add up to exactly the 552 Figma reserves) and no way to reflow
 * into a shorter box, so on a short window it scales rather than overflowing.
 * The section used to carry a flat 100px of padding on all four sides, which on
 * a phone left 190px of the 390 for the content.
 */
const CARD_W = 604;
const CARD_H = 552;

export default function SquadInvitation() {
  const [copied, setCopied] = useState(false);
  const inviteUrl = "squadcard.app/i/MR-K4X9";

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${inviteUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className="screen relative isolate w-full"
      data-node-id="9304:25728"
      data-sequence-section="invitation"
    >
      {/* isolate above, z-10 here: between them the ambient ground is pinned
          behind this section's content and in front of the page, and cannot
          escape to either side of that. See .screen-glow. */}
      <SectionBloom id="invitation" />
      <div className="screen-body relative z-10">
        <div
          className="screen-copy mx-auto flex max-w-[604px] flex-col items-center gap-4 px-4 sm:gap-[clamp(0.5rem,1.8svh,1rem)] sm:px-6"
          data-node-id="9304:25729"
        >
          <div className="flex" data-reveal="copy">
            <Badge icon={<AddTeamIcon className="size-[16px]" />}>
              Invite Your Squad
            </Badge>
          </div>

          <h2
            className="font-heading type-title w-full text-center leading-none font-normal text-white"
            data-node-id="9304:25738"
            data-reveal="copy"
          >
            {/* The wide layout's break. The phone's two lines fall after
                "your" instead, which is where the frame wraps it on its own. */}
            <span>{`A squad without `}</span>
            <span className="font-display italic">{`your people`}</span>{" "}
            <br className="hidden sm:inline" />
            {`isn't a squad.`}
          </h2>

          <p
            className="font-sans type-lede type-measure w-full tracking-[-0.32px] text-white opacity-70"
            data-node-id="9304:25739"
            data-reveal="copy"
          >
            Invite your people now. When Squad launches, your group is already
            set.
          </p>
        </div>

        {/* No data-reveal on the wrapper: the card arrives and then fills
            itself in, and a group fade would flatten that into one crossfade. */}
        {/* px-6 where the diagrams have none: this one is a card with a border
            rather than a diagram bled to the edges, and on a phone the stage
            fits the container exactly — so with no gutter it would touch both
            sides of the screen. Above 604px the scale is capped at 1 and the
            padding costs nothing. */}
        <div className="screen-payload px-4 sm:px-6" data-node-id="9304:25740">
          <div className="stage-viewport stage-fluid">
            <div
              className="stage-sizer"
              style={
                {
                  "--stage-w": CARD_W,
                  "--stage-h": CARD_H,
                } as React.CSSProperties
              }
            >
              <div className="stage">
                <div
                  className="content-stretch relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-3xl border-[1.5px] border-solid border-white/15 bg-white/[0.03] p-4 shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)] backdrop-blur-[2px] sm:gap-[16px] sm:rounded-[32px] sm:p-[16px]"
                  data-node-id="9304:25742"
                  data-name="Step 3 Content"
                  data-reveal="card"
                >
                  {/* Top-Left Corner Glow Asset */}
                  <div
                    className="pointer-events-none absolute top-[-1.5px] left-[-1.5px] size-[151px]"
                    data-node-id="9304:25743"
                  >
                    <div className="absolute inset-[-145.7%]">
                      <Image
                        src="/works/ellipse-6131.svg"
                        alt=""
                        width={591}
                        height={591}
                        className="block size-full max-w-none"
                      />
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div
                    /* The panel bleeds past the card's 16px padding on the
                       phone and stops at it from the gate up — both the
                       artboard's. Down there Figma leaves the 572px container
                       at its full width inside a 370px card and lets the card's
                       own clip cut it, so the QR sits on a band that runs edge
                       to edge with its corners taken off. */
                    className="relative -mx-4 h-[260px] w-[calc(100%+32px)] shrink-0 overflow-hidden rounded-[16px] bg-white/[0.04] sm:mx-0 sm:w-full"
                    data-node-id="9304:25744"
                    data-reveal="item"
                  >
                    <div
                      className="absolute top-0 left-1/2 contents -translate-x-1/2"
                      data-node-id="9304:25745"
                      data-name="Step 3 Image Container"
                    >
                      <p
                        className="font-sans absolute left-1/2 top-[calc(50%+97px)] -translate-x-1/2 text-center text-[14px] leading-[1.5] font-normal tracking-[-0.28px] whitespace-nowrap text-white opacity-70"
                        data-node-id="9304:25747"
                      >
                        scan to join Maya&rsquo; Squad
                      </p>
                    </div>

                    {/* Exact Figma QR Code PNG Asset */}
                    <div
                      className="absolute top-1/2 left-1/2 size-[178px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[4px]"
                      data-node-id="9304:25748"
                      data-name="image 583172"
                    >
                      <Image
                        src="/works/qr-code.png"
                        alt="scan to join Maya' Squad"
                        width={178}
                        height={178}
                        className="absolute inset-0 block size-full object-contain"
                        priority
                      />
                    </div>
                  </div>

                  {/* Invite Link Bar */}
                  <div
                    className="content-stretch relative flex h-[48px] w-full shrink-0 items-center justify-between overflow-hidden rounded-lg border-[1.5px] border-solid border-[rgba(255,255,255,0.3)] bg-white/[0.04] py-[16px] pr-[4px] pl-[20px] backdrop-blur-sm sm:border-[rgba(255,255,255,0.1)]"
                    data-node-id="9304:25749"
                    data-reveal="item"
                  >
                    <p
                      className="font-sans relative shrink-0 overflow-hidden text-[14px] leading-none font-normal text-ellipsis whitespace-nowrap text-white opacity-70 select-all"
                      data-node-id="9304:25750"
                    >
                      {inviteUrl}
                    </p>

                    {/* Copy Link Button */}
                    <Button
                      type="button"
                      onClick={handleCopy}
                      className="content-stretch relative flex h-[40px] shrink-0 items-center justify-center gap-[8px] py-[16px] pr-[16px] pl-[12px] !rounded-[4px]"
                      variant="primary"
                      data-node-id="9304:25751"
                      data-name="CTA - Primary"
                    >
                      <div
                        className="relative size-[16px] shrink-0"
                        data-node-id="9304:25752"
                        data-name="copy-01"
                      >
                        <CopyIcon className="size-[16px]" />
                      </div>
                      <span
                        className="font-sans relative shrink-0 text-[12px] leading-none font-medium tracking-[-0.24px] whitespace-nowrap text-white"
                        data-node-id="9304:25755"
                      >
                        {copied ? "Copied!" : "Copy Link"}
                      </span>
                    </Button>
                  </div>

                  {/* Card Text Content */}
                  <div
                    className="content-stretch relative flex w-full shrink-0 flex-col items-start gap-[12px] overflow-hidden px-[16px] pb-[16px] text-white"
                    data-node-id="9304:25756"
                    data-reveal="item"
                  >
                    <div
                      className="font-heading relative shrink-0 text-[28px] leading-[0] font-normal tracking-[-0.28px] whitespace-nowrap"
                      data-node-id="9304:25757"
                    >
                      <p className="mb-0 leading-[1.2]">Your squad.</p>
                      <p className="leading-[1.2]">Your line.</p>
                    </div>
                    <p
                      className="font-sans relative w-full shrink-0 text-base leading-[1.5] font-normal tracking-[-0.32px] opacity-70"
                      data-node-id="9304:25758"
                    >
                      Apply together. Qualify for more. Spend in your lane.
                    </p>
                  </div>

                  {/* Share via Email CTA Button */}
                  <a
                    href={`mailto:?subject=Join%20my%20Banrox%20Squad&body=Hey!%20Join%20my%20squad%20on%20Banrox:%20https://${inviteUrl}`}
                    className="content-stretch relative flex h-[44px] w-full shrink-0 items-center justify-center gap-[8px] rounded-[8px] border border-solid border-[rgba(255,255,255,0.2)] py-[16px] pr-[24px] pl-[32px] transition-colors hover:bg-white/10"
                    data-node-id="9304:25759"
                    data-name="CTA - Primary"
                    data-reveal="item"
                  >
                    <span
                      className="font-sans relative shrink-0 text-[16px] leading-none font-medium tracking-[-0.32px] whitespace-nowrap text-white"
                      data-node-id="I9304:25759;243:144"
                    >
                      Share via Email
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
