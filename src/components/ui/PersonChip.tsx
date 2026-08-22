import AvatarRing from "@/components/ui/AvatarRing";
import { Cancel, Tick, VerifiedCheck } from "@/components/ui/icons";
import { CHIP_FRAMING, PEOPLE, type PersonKey } from "@/data/people";

/*
 * Floating status chip that orbits a comparison card. The declined variant
 * carries a reason under a hairline rule; the approved variant swaps that for a
 * verified badge beside the name.
 *
 * One chip, drawn once, placed twice. Both artboards float these around the
 * panel's rings — the phone's simply does it in a 370x514 frame instead of a
 * 564x628 one, with the chip itself at three quarters the size. That 0.75 is
 * exact and it is the whole difference: a 66px chip becomes 49.5, its 48px
 * avatar becomes 36, and its 12/10/10 type becomes 9/7.5/7.5, which is what the
 * mobile frame measures. So the phone gets a `scale`, not a second layout — and
 * the coordinates, which are NOT a scale of the wide ones, come in as props.
 */

export type PersonChipProps = {
  person: PersonKey;
  /** Declined chips show this under a divider. Omit for the approved variant. */
  reason?: string;
  approved?: boolean;
  /** Position within the 564x628 panel, in artboard px. */
  left: number;
  top: number;
  /** Position within the 370x514 phone panel — a different arrangement. */
  phone: { left: number; top: number };
};

export default function PersonChip({
  person,
  reason,
  approved = false,
  left,
  top,
  phone,
}: PersonChipProps) {
  const p = PEOPLE[person];

  return (
    <div
      className="absolute top-[var(--chip-pt)] left-[var(--chip-pl)] flex h-[66px] origin-top-left scale-75 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2 backdrop-blur-[3px] sm:top-[var(--chip-t)] sm:left-[var(--chip-l)] sm:scale-100"
      style={
        {
          "--chip-pl": `${phone.left}px`,
          "--chip-pt": `${phone.top}px`,
          "--chip-l": `${left}px`,
          "--chip-t": `${top}px`,
        } as React.CSSProperties
      }
      data-animate="chip"
    >
      <AvatarRing size={48} person={p} framing={CHIP_FRAMING[person]} />

      <div className="flex flex-col items-start gap-1.5">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1">
            <span className="font-heading text-[12px] leading-none font-medium whitespace-nowrap text-white">
              {p.name}
            </span>
            {approved ? <VerifiedCheck size={8} /> : null}
          </div>
          <div className="flex items-center gap-0.5">
            {approved ? <Tick size={12} /> : <Cancel size={12} />}
            <span className="font-heading text-[10px] leading-[1.2] whitespace-nowrap text-white/70">
              {approved ? "Approved" : "Declined"}
            </span>
          </div>
        </div>

        {reason ? (
          <>
            <span className="block h-px w-full bg-white/10" />
            <span className="font-heading text-[10px] leading-none whitespace-nowrap text-white/50">
              {reason}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
