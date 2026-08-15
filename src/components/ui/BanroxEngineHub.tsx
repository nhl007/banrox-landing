import Image from "next/image";

/*
 * The 342x336 hub card the whole intelligence-layer diagram converges on —
 * same texture/glow/logomark structure as SquadCard's brand mark, but square
 * and backed by a much heavier blur (22px vs the panel default).
 */

function Dot() {
  return <span className="bg-white/70 block size-[3px] shrink-0 rounded-full" />;
}

export default function BanroxEngineHub() {
  return (
    <div className="relative h-[336px] w-full max-w-[342px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-[rgba(8,8,20,0.5)] backdrop-blur-[22px] sm:w-[342px] sm:max-w-none">
      {/*
        data-glow: these three never settle — the section's ambient loop breathes
        them for as long as it is on screen (see intelAmbient). Tagged in DOM
        order widest to narrowest, which is the order that loop staggers along.
      */}
      <Image
        src="/intel/hub-glow-1.svg"
        alt=""
        width={501}
        height={351}
        className="pointer-events-none absolute -top-[139px] left-1/2 max-w-none -translate-x-1/2"
        data-glow=""
      />
      <Image
        src="/intel/hub-glow-2.svg"
        alt=""
        width={398}
        height={347}
        className="pointer-events-none absolute -top-[135px] left-1/2 max-w-none -translate-x-1/2"
        data-glow=""
      />
      <Image
        src="/intel/hub-glow-3.svg"
        alt=""
        width={285}
        height={351}
        className="pointer-events-none absolute -top-[139px] left-[108px] max-w-none mix-blend-plus-lighter"
        data-glow=""
      />
      <Image
        src="/intel/hub-texture.svg"
        alt=""
        width={341}
        height={339}
        className="pointer-events-none absolute -top-[3px] left-0 max-w-none"
      />

      <Image
        src="/intel/hub-logo.svg"
        alt=""
        width={144}
        height={160}
        className="pointer-events-none absolute top-[calc(50%-44px)] left-[calc(50%+10px)] max-w-none -translate-x-1/2 -translate-y-1/2 mix-blend-hard-light"
      />

      <div className="absolute top-[242px] left-1/2 flex w-full -translate-x-1/2 flex-col items-center gap-3">
        <p className="font-heading text-center text-[32px] leading-none whitespace-nowrap text-white">
          Banrox <span className="font-display italic">Engine</span>
        </p>
        <div className="flex items-center justify-center gap-2 text-center text-[14px] leading-normal tracking-[-0.28px] whitespace-nowrap text-white/70">
          <p>Group risk scoring</p>
          <Dot />
          <p>4 Files</p>
          <Dot />
          <p>1 Decision</p>
        </div>
      </div>
    </div>
  );
}
