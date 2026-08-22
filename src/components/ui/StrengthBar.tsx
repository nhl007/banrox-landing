/*
 * The summary rail pinned to the bottom of each comparison card: a caption row
 * and three stats separated by vertical hairlines.
 */

export type Stat = {
  value: string;
  label: string;
  /** Squad-side figures are green; the alone side stays white. */
  positive?: boolean;
};

export type StrengthBarProps = {
  title: string;
  note: string;
  stats: [Stat, Stat, Stat];
  /** Hook for the scroll sequence; the rail wipes open from its own top edge. */
  reveal?: string;
};

export default function StrengthBar({
  title,
  note,
  stats,
  reveal,
}: StrengthBarProps) {
  return (
    /*
     * Pinned to the foot of the panel in both tiers, at the width and height its
     * own frame is drawn: 338 wide at y392 on the phone's 370x514 panel, 516 at
     * y496 on the wide one's 564x628. It is the one part of the panel that is
     * NOT scaled down on the phone — its type stays 20px on the figures and
     * 12px on the captions, and only the caption row above it drops from 14 to
     * 12. A 0.75 here would have put the captions at 9px, which is a rail you
     * can see and not read.
     */
    <div
      data-reveal={reveal}
      className="absolute top-[392px] left-1/2 flex w-[338px] -translate-x-1/2 flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 px-5 py-4 shadow-[inset_-2px_-2px_6px_0px_rgba(255,255,255,0.05),inset_4px_4px_8px_0px_rgba(0,0,0,0.2)] sm:top-[496px] sm:w-[516px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-white/[0.02] backdrop-blur-[3px]"
      />

      <div className="font-heading relative flex w-full items-start justify-between text-[12px] leading-none whitespace-nowrap text-white sm:text-[14px]">
        <p className="opacity-50">{title}</p>
        <p className="opacity-70">{note}</p>
      </div>

      {/* Three figures on one row, hairlines between, in both tiers. */}
      <div className="relative flex w-full items-center justify-between">
        {stats.map((stat, i) => (
          <div key={stat.label} className="contents">
            {i > 0 ? (
              <span className="h-8 w-px shrink-0 self-center bg-white/10" />
            ) : null}
            <div className="font-heading flex flex-col items-center justify-center gap-1.5 text-center leading-none font-medium whitespace-nowrap">
              {/*
                data-count: the sequence counts this up on arrival. The printed
                value stays the element's own text — it is what the server
                renders, what a reader without the sequence sees, and what the
                timeline reads the target off, so there is no second copy of the
                number to fall out of step with this one.
              */}
              <p
                data-count=""
                className={`text-[20px] whitespace-nowrap ${stat.positive ? "text-success" : "text-white"}`}
              >
                {stat.value}
              </p>
              <p className="text-[12px] leading-none text-white opacity-50">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
