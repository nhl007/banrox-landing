import { Tick } from "@/components/ui/icons";

/*
 * Approved / pending status pill — reused across the vote rows, the request
 * card's approver list, and (via its color pairing) the amount text next to
 * each. Pending's dot is a plain filled circle: Figma draws it as one too,
 * with no vector detail beyond a solid fill, so no asset is needed for it.
 */

export type Status = "approved" | "pending";

const TONE = {
  approved: "bg-success/10 border-success/20 text-success",
  pending: "bg-pending/10 border-pending/20 text-pending",
} as const;

export default function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center justify-center gap-1 rounded-[20px] border pr-2.5 pl-1.5 ${TONE[status]}`}
    >
      {status === "approved" ? (
        <Tick size={12} />
      ) : (
        <span className="bg-pending block size-[3px] shrink-0 rounded-full" />
      )}
      <span className="font-heading text-sm sm:text-[10px] leading-[1.2] whitespace-nowrap">
        {status === "approved" ? (
          "Approved"
        ) : (
          <>
            Pending<span className="text-pending/50">...</span>
          </>
        )}
      </span>
    </span>
  );
}
