import Image from "next/image";
import type { ReactNode } from "react";

/*
 * Shell for one "How Squad Works" step — 392x508. The corner-glow asset is
 * identical across all three cards (same shape/blur at the same size), so
 * it's hardcoded rather than threaded through as a prop.
 */

export type StepCardProps = {
  figure: ReactNode;
  title: string;
  description: string;
};

export default function StepCard({ figure, title, description }: StepCardProps) {
  return (
    <div
      className="relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-3xl border-[1.5px] border-white/10 p-4 shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)] sm:h-[508px]"
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl" />

      <Image
        src="/works/corner-glow.svg"
        alt=""
        width={591}
        height={591}
        className="pointer-events-none absolute -top-[221px] -left-[221px] max-w-none"
      />

      {figure}

      <div className="flex w-full flex-col items-start gap-3 px-4 text-white">
        <p className="font-heading w-full text-[28px] leading-[1.2]">{title}</p>
        <p className="w-full text-base leading-normal tracking-[-0.32px] text-white/70">
          {description}
        </p>
      </div>
    </div>
  );
}
