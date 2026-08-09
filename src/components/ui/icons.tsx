import Image from "next/image";

/*
 * Every glyph here is the asset exported from Figma and committed under
 * public/ — none are hand-authored, so they stay pixel-identical to the design.
 */

export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/ArrowUpRight.svg"
      alt=""
      width={18}
      height={18}
      className={`size-[18px] ${className}`.trim()}
    />
  );
}

/** Figma wraps the 10.33x5 chevron in a 16x16 box; the box sets the spacing. */
export function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex size-4 shrink-0 items-center justify-center ${className}`.trim()}
    >
      <Image
        src="/icons/chevron-down.svg"
        alt=""
        width={10}
        height={5}
        className="w-[10.33px]"
      />
    </span>
  );
}

export function CreditCard({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/icons/credit-card.svg"
      alt=""
      width={16}
      height={16}
      className={`size-4 ${className}`.trim()}
    />
  );
}

export function CheckmarkBadge({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/icons/checkmark-badge.svg"
      alt=""
      width={16}
      height={16}
      className={`size-4 ${className}`.trim()}
    />
  );
}

export function Reserve({ className = "" }: { className?: string }) {
  return (
    <span className={`flex size-4 shrink-0 items-center justify-center ${className}`.trim()}>
      <Image
        src="/icons/reserve.svg"
        alt=""
        width={9.21}
        height={12}
        style={{ width: 9.21, height: 12 }}
      />
    </span>
  );
}

export function Brain({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/icons/brain.svg"
      alt=""
      width={16}
      height={16}
      className={`size-4 ${className}`.trim()}
    />
  );
}

/** Sits inset 9.38% inside a 40x40 box, which nets out to the asset's own 32.5px size. */
export function Fingerprint({ className = "" }: { className?: string }) {
  return (
    <span className={`flex size-10 shrink-0 items-center justify-center ${className}`.trim()}>
      <Image src="/icons/fingerprint-small.svg" alt="" width={32.5} height={32.5} />
    </span>
  );
}

const SIGNAL_ICONS = {
  shield: "/icons/shield-check.svg",
  dollar: "/icons/dollar-01.svg",
  pie: "/icons/pie-chart.svg",
  chart: "/icons/chart-01.svg",
} as const;

export type SignalIconKey = keyof typeof SIGNAL_ICONS;

export function SignalIcon({ icon }: { icon: SignalIconKey }) {
  return (
    <Image src={SIGNAL_ICONS[icon]} alt="" width={16} height={16} className="size-4" />
  );
}

export function ArrowDataTransfer({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/icons/arrow-data-transfer-horizontal.svg"
      alt=""
      width={16}
      height={16}
      className={`size-4 ${className}`.trim()}
    />
  );
}

/*
 * Cancel and tick ship at two sizes because Figma draws them at different
 * stroke weights rather than scaling one glyph.
 */
export function Cancel({ size = 20 }: { size?: 12 | 20 }) {
  return (
    <Image
      src={size === 12 ? "/icons/cancel-12.svg" : "/icons/cancel-20.svg"}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0"
    />
  );
}

const TICK_SRC = {
  12: "/icons/tick-12.svg",
  16: "/icons/tick-16.svg",
  20: "/icons/tick-20.svg",
} as const;

export function Tick({ size = 20 }: { size?: 12 | 16 | 20 }) {
  return (
    <Image
      src={TICK_SRC[size]}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0"
    />
  );
}

/** Figma's mask-filled check badge; sized by the caller. */
export function VerifiedCheck({ size = 12 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="Verified"
      className="block shrink-0 bg-[#e9ebff]"
      style={{
        width: size,
        height: size,
        maskImage: "url(/card/check.png)",
        maskSize: `${size}px ${size}px`,
        WebkitMaskImage: "url(/card/check.png)",
        WebkitMaskSize: `${size}px ${size}px`,
      }}
    />
  );
}

export function FacebookIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

export function LinkedInIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z" />
    </svg>
  );
}

export function XTwitterIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function BXWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 332 378"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M60 20H180C235.228 20 280 64.7715 280 120C280 156.4 260.5 188.2 231.2 205.5C266.8 221.7 292 257.6 292 299C292 354.228 247.228 399 192 399H60V20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.15"
      />
      <path
        d="M20 20L312 358M312 20L20 358"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.15"
      />
    </svg>
  );
}

export function AddTeamIcon({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/icons/add-team.svg"
      alt=""
      width={16}
      height={16}
      className={`size-4 ${className}`.trim()}
    />
  );
}

export function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/icons/copy-01.svg"
      alt=""
      width={16}
      height={16}
      className={`size-4 ${className}`.trim()}
    />
  );
}



