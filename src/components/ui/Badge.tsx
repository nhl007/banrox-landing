import type { ReactNode } from "react";

/*
 * The small pill that sits above a section headline.
 *
 * Note on the border: Figma's generated code reports the stroke as a solid
 * #e2e6ff, but the rendered artboard measures it at roughly 6% opacity — the
 * export drops the stroke's own alpha. The measured value is the correct one.
 */
export default function Badge({
  icon,
  children,
  className = "",
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-badge border-hairline/[0.06] flex h-[34px] shrink-0 items-center gap-2 rounded-lg border-[1.5px] pr-4 pl-3 ${className}`.trim()}
    >
      {icon}
      <span className="text-base tracking-[-0.32px] whitespace-nowrap">
        {children}
      </span>
    </div>
  );
}
