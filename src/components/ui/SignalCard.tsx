import { SignalIcon, Tick, type SignalIconKey } from "@/components/ui/icons";

/*
 * One of the four 230x194 "signal category" cards. Unlike the score cards and
 * hub, Figma gives this card only a flat tint + vignette — no dot texture or
 * corner-glow triangles — so it reuses .bg-vignette directly with no extra
 * asset layers.
 */

export type SignalRow = { label: string; value: string } | { label: string; verified: true };

export type SignalCardProps = {
  icon: SignalIconKey;
  title: [string, string];
  /** 3 or 4 rows — every card reserves a 4th row's height regardless. */
  rows: SignalRow[];
};

export default function SignalCard({ icon, title, rows }: SignalCardProps) {
  return (
    <div className="relative flex h-[194px] w-[230px] shrink-0 flex-col items-center gap-4 overflow-hidden rounded-xl border border-white/10 p-4">
      <div className="bg-vignette pointer-events-none absolute inset-0 bg-[rgba(8,8,20,0.2)]" />

      <div className="relative flex items-center justify-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-white/[0.04]">
          <SignalIcon icon={icon} />
        </span>
        <p className="font-heading w-[130px] text-[16px] leading-[1.2] text-white/70">
          {title[0]}
          <br />
          {title[1]}
        </p>
      </div>

      <div className="relative flex w-full flex-col items-start gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex w-full items-center justify-between text-[14px] tracking-[-0.28px] whitespace-nowrap"
          >
            <p className="text-white/70">{row.label}</p>
            {"verified" in row ? (
              <Tick size={20} />
            ) : (
              <p className="text-success font-medium">{row.value}</p>
            )}
          </div>
        ))}
        {/* Cards with only 3 rows still reserve a 4th row's height, keeping
            every card the same 194px regardless of content. */}
        {rows.length === 3 ? <div aria-hidden className="h-[21px] w-full" /> : null}
      </div>
    </div>
  );
}
