import { cn } from "@/frontend/lib/utils";
import { getNoteStatus } from "@/frontend/lib/note-status";
export function NoteStatus({
  note,
}: {
  note: {
    revokedAt: Date | string | null;
    usedAt: Date | string | null;
    expiresAt: Date | string;
    shareType: string;
  };
}) {
  const state = getNoteStatus(note);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        state === "Active"
          ? "bg-emerald-400/10 text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          state === "Active" ? "bg-emerald-500" : "bg-stone-400",
        )}
      />
      {state}
    </span>
  );
}
