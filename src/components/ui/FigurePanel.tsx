import Image from "next/image";
import type { ReactNode } from "react";

/*
 * The 360x260 illustration panel inside each step card: bordered surface,
 * dot-grid texture (different cloud pattern per step, hence passed in), and
 * an inset top highlight. Content is layered on top via children.
 */

export type FigurePanelProps = {
  texture: string;
  children: ReactNode;
};

export default function FigurePanel({ texture, children }: FigurePanelProps) {
  return (
    <div className="relative h-[260px] w-[360px] shrink-0 overflow-hidden rounded-2xl border-[1.5px] border-white/10 bg-white/[0.02] shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]">
      <Image
        src={texture}
        alt=""
        width={358}
        height={239}
        className="pointer-events-none absolute top-0 left-0 max-w-none"
      />
      {children}
    </div>
  );
}
