import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import StatusPill, { type Status } from "@/components/ui/StatusPill";
import { VOTE_FRAMING, type Person } from "@/data/people";

/*
 * A single "vote card" row: avatar, name, amount (colored by status), and a
 * StatusPill, on a 286x86 dot-textured panel. Identical background assets
 * across every instance, so they're hardcoded rather than threaded as props.
 */

const TONE = {
  approved: "text-success",
  pending: "text-pending",
} as const;

export type VoteRowProps = {
  person: Person;
  personKey: keyof typeof VOTE_FRAMING;
  amount: string;
  status: Status;
};

export default function VoteRow({
  person,
  personKey,
  amount,
  status,
}: VoteRowProps) {
  return (
    <div className="relative h-[86px] w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,8,20,0.5)]">
      <Image
        src="/approve/vote-glow-1.svg"
        alt=""
        width={356}
        height={94}
        className="pointer-events-none absolute -top-[47px] left-1/2 max-w-none -translate-x-1/2"
      />
      <Image
        src="/approve/vote-glow-2.svg"
        alt=""
        width={273}
        height={94}
        className="pointer-events-none absolute -top-[47px] left-[calc(50%+0.5px)] max-w-none -translate-x-1/2"
      />
      <Image
        src="/approve/vote-glow-3.svg"
        alt=""
        width={183}
        height={94}
        className="pointer-events-none absolute -top-[47px] left-[92px] max-w-none mix-blend-plus-lighter"
      />
      <Image
        src="/approve/vote-texture.svg"
        alt=""
        width={302}
        height={89}
        className="pointer-events-none absolute -top-[3px] -left-[5px] max-w-none"
      />

      <div className="absolute top-1/2 left-0 flex w-full -translate-y-1/2 items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <AvatarRing size={40} person={person} framing={VOTE_FRAMING[personKey]} />
          <div className="flex flex-col gap-1 text-[14px] leading-[1.2]">
            <p className="font-heading font-medium text-white">{person.name}</p>
            <p className={`font-sans text-center font-semibold tracking-[-0.28px] ${TONE[status]}`}>
              {amount}
            </p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>
    </div>
  );
}
