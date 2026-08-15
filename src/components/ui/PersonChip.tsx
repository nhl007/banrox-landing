import AvatarRing from "@/components/ui/AvatarRing";
import { Cancel, Tick, VerifiedCheck } from "@/components/ui/icons";
import { CHIP_FRAMING, PEOPLE, type PersonKey } from "@/data/people";

/*
 * Floating status chip that orbits a comparison card. The declined variant
 * carries a reason under a hairline rule; the approved variant swaps that for a
 * verified badge beside the name.
 */

export type PersonChipProps = {
  person: PersonKey;
  /** Declined chips show this under a divider. Omit for the approved variant. */
  reason?: string;
  approved?: boolean;
  /** Position within the parent card, in artboard px. */
  left: number;
  top: number;
};

export default function PersonChip({
  person,
  reason,
  approved = false,
  left,
  top,
}: PersonChipProps) {
  const p = PEOPLE[person];

  return (
    <div
      className="flex h-[66px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2 backdrop-blur-[3px] sm:absolute"
      style={{ left, top }}
      data-animate="chip"
    >
      <AvatarRing size={48} person={p} framing={CHIP_FRAMING[person]} />

      <div className="flex flex-col items-start gap-1.5">
        <div className="flex sm:flex-col items-start gap-1">
          <div className="flex items-center gap-1">
            <span className="font-heading text-sm sm:text-[12px] leading-none font-medium whitespace-nowrap text-white">
              {p.name}
            </span>
            {approved ? <VerifiedCheck size={8} /> : null}
          </div>
          <div className="flex items-center gap-0.5">
            {approved ? <Tick size={12} /> : <Cancel size={12} />}
            <span className="font-heading text-sm sm:text-[10px] leading-[1.2] whitespace-nowrap text-white/70">
              {approved ? "Approved" : "Declined"}
            </span>
          </div>
        </div>

        {reason ? (
          <>
            <span className="block h-px w-full bg-white/10" />
            <span className="font-heading text-sm sm:text-[10px] leading-none whitespace-nowrap text-white/50">
              {reason}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
