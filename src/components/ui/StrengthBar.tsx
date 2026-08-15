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
     * `relative` matters more than it looks. The wash below is `absolute
     * inset-0`, so it needs this box to be its containing block — and from sm:
     * up `absolute` supplied that, but on a phone the rail is in flow and
     * without `relative` here the wash resolved against the comparison card
     * instead, stretched over the whole panel, and put its 3px backdrop blur
     * across everything painted above it. Which is to say: the entire card,
     * except this rail, out of focus.
     */
    <div
      data-reveal={reveal}
      className="relative flex w-full flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 px-5 py-4 shadow-[inset_-2px_-2px_6px_0px_rgba(255,255,255,0.05),inset_4px_4px_8px_0px_rgba(0,0,0,0.2)] sm:absolute sm:top-[496px] sm:left-1/2 sm:w-[516px] sm:-translate-x-1/2"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-white/[0.02] backdrop-blur-[3px]"
      />

      <div className="font-heading relative flex w-full items-start justify-between text-[14px] leading-none whitespace-nowrap text-white">
        <p className="opacity-50">{title}</p>
        <p className="opacity-70">{note}</p>
      </div>

      {/*
        The three figures sit on one row at every size, but only from sm: up do
        their captions fit on one line each: at 390px "Avg Squad score" and
        "Combined Income" are 16px of type in about 90px of column, so on a
        phone the captions wrap and the row is given a gap to keep the hairlines
        off them. Shrinking the type instead would have put a caption under the
        legibility floor to save two lines.
      */}
      <div className="relative flex w-full items-start justify-between gap-3 sm:items-center sm:gap-0">
        {stats.map((stat, i) => (
          <div key={stat.label} className="contents">
            {i > 0 ? <span className="h-8 w-px shrink-0 self-center bg-white/10" /> : null}
            <div className="font-heading flex flex-col items-center justify-center gap-1.5 text-center leading-none font-medium sm:whitespace-nowrap">
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
              <p className="text-base leading-tight text-white opacity-50 sm:text-[12px] sm:leading-none">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
