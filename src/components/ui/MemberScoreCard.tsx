import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import { Fingerprint } from "@/components/ui/icons";
import { VOTE_FRAMING, type Person, type PersonKey } from "@/data/people";

/*
 * The 260x172 "big number" credit-score card in the Intelligence Layer row.
 * Background assets are identical across all four instances (same shape at
 * the same size), so they're hardcoded rather than threaded through props —
 * same reasoning as VoteRow.
 */

export type MemberScoreCardProps = {
  person: Person;
  personKey: PersonKey;
  memberLabel: string;
  score: number;
  rating: "Excellent" | "Good";
  /**
   * Filled % of the meter track. Not derived from score — measuring the
   * reference shows two near-identical scores (588 and 590) with visibly
   * different fills (53.9% vs 45.1%), so like the passport-card bureau
   * meters, Figma sets this by hand per card rather than by formula.
   */
  meterPercent: number;
};

const RATING_TONE = {
  Excellent: "text-success",
  Good: "text-brand-lighter",
} as const;

export default function MemberScoreCard({
  person,
  personKey,
  memberLabel,
  score,
  rating,
  meterPercent,
}: MemberScoreCardProps) {
  return (
    <div className="relative h-[172px] w-[260px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,8,20,0.2)]">
      <Image
        src="/intel/score-glow-1.svg"
        alt=""
        width={338}
        height={112}
        className="pointer-events-none absolute -top-[56px] left-1/2 max-w-none -translate-x-1/2"
      />
      <Image
        src="/intel/score-glow-2.svg"
        alt=""
        width={261}
        height={112}
        className="pointer-events-none absolute -top-[56px] left-[calc(50%+0.5px)] max-w-none -translate-x-1/2"
      />
      <Image
        src="/intel/score-glow-3.svg"
        alt=""
        width={177}
        height={112}
        className="pointer-events-none absolute -top-[56px] left-[83px] max-w-none mix-blend-plus-lighter"
      />
      <Image
        src="/intel/score-texture.svg"
        alt=""
        width={260}
        height={173}
        className="pointer-events-none absolute -top-[3px] left-0 max-w-none"
      />

      <div className="bg-vignette relative flex h-full flex-col items-center gap-4 p-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <AvatarRing
              size={40}
              person={person}
              framing={VOTE_FRAMING[personKey]}
            />
            <p className="font-heading text-[16px] leading-none whitespace-nowrap text-white">
              {memberLabel}
            </p>
          </div>
          <Fingerprint className="opacity-70" />
        </div>

        {/*
          text-center matters once this counts: the sequence pins the box to its
          finished width before the first digit changes, so without it a
          part-counted number sits at the left of a box sized for three digits
          and drifts into place as it fills. data-count is the hook — see
          countUp, which reads its target off the printed figure.
        */}
        <p
          data-count=""
          className="font-heading text-center text-[40px] leading-none text-white"
        >
          {score}
        </p>

        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex w-full items-start justify-between text-[14px] leading-none whitespace-nowrap">
            <p className={`font-heading font-medium ${RATING_TONE[rating]}`}>
              {rating}
            </p>
            <p className="font-heading text-white/50">300-850</p>
          </div>
          <div className="relative h-1.5 w-full rounded-[20px] bg-white/10">
            {/*
              data-meter carries the fill so the sequence has a target that
              survives being animated away from — the style below is the one the
              server renders and the one a reader without the sequence keeps,
              and it is also the first thing the fill overwrites.
            */}
            <div
              data-meter={meterPercent}
              className="bg-score-meter absolute top-0 left-0 h-1.5 rounded-[20px]"
              style={{ width: `${meterPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
