"use client";

import Image from "next/image";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { AddTeamIcon, CopyIcon } from "@/components/ui/icons";
import Button from "./ui/Button";

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
      className="content-stretch flex flex-col items-center p-[100px] relative w-full"
      data-node-id="9304:25728"
      data-sequence-section="invitation"
    >
      {/* See Hero. */}
      <div
        className="content-stretch flex flex-col gap-[60px] items-center w-full"
        data-shift=""
      >
        {/* Header Section */}
        <div
          className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-[604px] max-w-full"
          data-node-id="9304:25729"
          data-beat="copy"
        >
          {/* Badge Component */}
          <div className="flex" data-reveal="copy">
            <Badge icon={<AddTeamIcon className="size-[16px]" />}>
              Invite Your Squad
            </Badge>
          </div>

          {/* Headline */}
          <div
            className="content-stretch flex flex-col items-center relative shrink-0 w-full"
            data-node-id="9304:25737"
          >
            <h2
              className="font-heading leading-[0] not-italic relative shrink-0 text-[48px] text-center text-white w-[1240px] max-w-full font-normal"
              data-node-id="9304:25738"
              data-reveal="copy"
            >
              <p className="mb-0 leading-none">
                <span>{`A squad without `}</span>
                <span className="font-display italic leading-none">{`your people`}</span>
              </p>
              <p className="leading-none">{`isn't a squad.`}</p>
            </h2>
          </div>

          {/* Subtitle */}
          <p
            className="font-sans font-normal leading-[1.5] opacity-70 relative shrink-0 text-[16px] text-white text-center tracking-[-0.32px] w-[604px] max-w-full"
            data-node-id="9304:25739"
            data-reveal="copy"
          >
            Invite your people now. When Squad launches, your group is already
            set.
          </p>
        </div>

        {/* Card Content Section (Step 3 Content) */}
        {/* No data-reveal on the wrapper: the card arrives and then fills
            itself in, and a group fade would flatten that into one crossfade. */}
        <div
          className="content-stretch flex flex-col items-center relative shrink-0 w-full"
          data-node-id="9304:25740"
          data-beat="payload"
        >
          <div
            className="content-stretch flex h-[552px] items-start justify-center relative shrink-0 w-full"
            data-node-id="9304:25741"
          >
            <div
              className="border-[1.5px] border-solid border-white/15 content-stretch flex flex-col gap-[16px] items-center overflow-hidden p-[16px] relative rounded-[32px] shrink-0 w-[604px] max-w-full bg-white/[0.03] backdrop-blur-[2px] shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]"
              data-node-id="9304:25742"
              data-name="Step 3 Content"
              data-reveal="card"
            >
              {/* Top-Left Corner Glow Asset */}
              <div
                className="absolute left-[-1.5px] size-[151px] top-[-1.5px] pointer-events-none"
                data-node-id="9304:25743"
              >
                <div className="absolute inset-[-145.7%]">
                  <Image
                    src="/works/ellipse-6131.svg"
                    alt=""
                    width={591}
                    height={591}
                    className="block max-w-none size-full"
                  />
                </div>
              </div>

              {/* QR Code Container */}
              <div
                className="h-[260px] overflow-hidden relative rounded-[16px] shrink-0 w-[572px] max-w-full bg-white/[0.04]"
                data-node-id="9304:25744"
                data-reveal="item"
              >
                <div
                  className="-translate-x-1/2 absolute contents left-1/2 top-0"
                  data-node-id="9304:25745"
                  data-name="Step 3 Image Container"
                >
                  <p
                    className="-translate-x-1/2 absolute font-sans font-normal leading-[1.5] left-1/2 opacity-70 text-[14px] text-center text-white top-[calc(50%+97px)] tracking-[-0.28px] whitespace-nowrap"
                    data-node-id="9304:25747"
                  >
                    scan to join Maya’ Squad
                  </p>
                </div>

                {/* Exact Figma QR Code PNG Asset */}
                <div
                  className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 rounded-[4px] size-[178px] top-1/2 overflow-hidden"
                  data-node-id="9304:25748"
                  data-name="image 583172"
                >
                  <Image
                    src="/works/qr-code.png"
                    alt="scan to join Maya' Squad"
                    width={178}
                    height={178}
                    className="absolute block inset-0 size-full object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Invite Link Bar */}
              <div
                className="border-[1.5px] border-[rgba(255,255,255,0.1)] border-solid content-stretch flex h-[48px] items-center justify-between overflow-hidden pl-[20px] pr-[4px] py-[16px] relative rounded-[8px] shrink-0 w-full bg-white/[0.04] backdrop-blur-sm"
                data-node-id="9304:25749"
                data-reveal="item"
              >
                <p
                  className="font-sans font-normal leading-none opacity-70 relative shrink-0 text-[14px] text-white whitespace-nowrap select-all"
                  data-node-id="9304:25750"
                >
                  {inviteUrl}
                </p>

                {/* Copy Link Button */}
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="content-stretch flex gap-[8px] h-[40px] items-center pl-[12px] pr-[16px] py-[16px] relative !rounded-[4px] shrink-0 "
                  variant="primary"
                  data-node-id="9304:25751"
                  data-name="CTA - Primary"
                >
                  <div
                    className="relative shrink-0 size-[16px]"
                    data-node-id="9304:25752"
                    data-name="copy-01"
                  >
                    <CopyIcon className="size-[16px]" />
                  </div>
                  <span
                    className="font-sans font-medium leading-none relative shrink-0 text-[12px] text-white tracking-[-0.24px] whitespace-nowrap"
                    data-node-id="9304:25755"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </span>
                </Button>
              </div>

              {/* Card Text Content */}
              <div
                className="content-stretch flex flex-col gap-[12px] items-start overflow-hidden pb-[16px] px-[16px] relative shrink-0 text-white w-full"
                data-node-id="9304:25756"
                data-reveal="item"
              >
                <div
                  className="font-heading leading-[0] relative shrink-0 text-[28px] tracking-[-0.28px] whitespace-nowrap font-normal"
                  data-node-id="9304:25757"
                >
                  <p className="leading-[1.2] mb-0">Your squad.</p>
                  <p className="leading-[1.2]">Your line.</p>
                </div>
                <p
                  className="font-sans font-normal leading-[1.5] opacity-70 relative shrink-0 text-[16px] tracking-[-0.32px] w-full"
                  data-node-id="9304:25758"
                >
                  Apply together. Qualify for more. Spend in your lane.
                </p>
              </div>

              {/* Share via Email CTA Button */}
              <a
                href={`mailto:?subject=Join%20my%20Banrox%20Squad&body=Hey!%20Join%20my%20squad%20on%20Banrox:%20https://${inviteUrl}`}
                className="border border-[rgba(255,255,255,0.2)] border-solid content-stretch flex gap-[8px] h-[44px] items-center justify-center pl-[32px] pr-[24px] py-[16px] relative rounded-[8px] shrink-0 w-full transition-colors hover:bg-white/10"
                data-node-id="9304:25759"
                data-name="CTA - Primary"
                data-reveal="item"
              >
                <span
                  className="font-sans font-medium leading-none relative shrink-0 text-[16px] text-white tracking-[-0.32px] whitespace-nowrap"
                  data-node-id="I9304:25759;243:144"
                >
                  Share via Email
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
