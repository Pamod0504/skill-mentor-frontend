import { SessionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: SessionStatus | string | undefined | null }) {
  // Handle case where status might be undefined or null
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
        Unknown
      </span>
    );
  }

  // Convert string status to SessionStatus enum if needed
  let normalizedStatus: SessionStatus;
  if (typeof status === 'string') {
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'PENDING') normalizedStatus = SessionStatus.PENDING;
    else if (upperStatus === 'ACCEPTED') normalizedStatus = SessionStatus.ACCEPTED;
    else if (upperStatus === 'COMPLETED') normalizedStatus = SessionStatus.COMPLETED;
    else {
      // Unknown status, show as-is
      return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
          {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
        </span>
      );
    }
  } else {
    normalizedStatus = status;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        normalizedStatus === SessionStatus.PENDING && "bg-yellow-100 text-yellow-800",
        normalizedStatus === SessionStatus.ACCEPTED && "bg-green-100 text-green-800",
        normalizedStatus === SessionStatus.COMPLETED && "bg-blue-100 text-blue-800"
      )}
    >
      {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1).toLowerCase()}
    </span>
  );
}
