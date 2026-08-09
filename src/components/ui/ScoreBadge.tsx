import AvatarRing from "@/components/ui/AvatarRing";
import { SCORE_FRAMING, type Person, type PersonKey } from "@/data/people";

/*
 * Floating credit-score badge used 4x around the step-2 group-score ring.
 * Rating color follows the score band, same semantics as the passport cards.
 */

const RATING_TONE = {
  Good: "text-success",
  Fair: "text-brand-lighter",
  Poor: "text-danger/70",
} as const;

export type ScoreBadgeProps = {
  person: Person;
  personKey: PersonKey;
  score: number;
  rating: keyof typeof RATING_TONE;
};

export default function ScoreBadge({
  person,
  personKey,
  score,
  rating,
}: ScoreBadgeProps) {
  return (
    <div className="bg-vignette relative flex items-center gap-3 rounded-lg border border-white/10 p-2 shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]">
      <AvatarRing size={30} person={person} framing={SCORE_FRAMING[personKey]} />
      <div className="flex w-[38px] flex-col items-start gap-1 leading-none">
        <p className="font-heading text-[16px] text-white">{score}</p>
        <p className={`font-heading text-[12px] ${RATING_TONE[rating]}`}>
          {rating}
        </p>
      </div>
    </div>
  );
}
