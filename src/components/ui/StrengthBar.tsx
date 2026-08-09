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
};

export default function StrengthBar({ title, note, stats }: StrengthBarProps) {
  return (
    <div className="absolute top-[496px] left-1/2 flex w-[516px] -translate-x-1/2 flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 px-5 py-4 shadow-[inset_-2px_-2px_6px_0px_rgba(255,255,255,0.05),inset_4px_4px_8px_0px_rgba(0,0,0,0.2)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-white/[0.02] backdrop-blur-[3px]"
      />

      <div className="font-heading relative flex w-full items-start justify-between text-[14px] leading-none whitespace-nowrap text-white">
        <p className="opacity-50">{title}</p>
        <p className="opacity-70">{note}</p>
      </div>

      <div className="relative flex w-full items-center justify-between">
        {stats.map((stat, i) => (
          <div key={stat.label} className="contents">
            {i > 0 ? <span className="h-8 w-px bg-white/10" /> : null}
            <div className="font-heading flex flex-col items-center justify-center gap-1.5 text-center leading-none font-medium whitespace-nowrap">
              <p
                className={`text-[20px] ${stat.positive ? "text-success" : "text-white"}`}
              >
                {stat.value}
              </p>
              <p className="text-[12px] text-white opacity-50">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
