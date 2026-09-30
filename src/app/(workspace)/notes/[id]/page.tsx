import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { requireSession } from "@/backend/session";
import { getOwnedNote } from "@/backend/notes";
import { ApiError } from "@/backend/http";
import { NoteStatus } from "@/frontend/components/note-status";
import { LocalTime } from "@/frontend/components/local-time";
import { NoteActions } from "@/frontend/components/note-actions";
import { DesignIcon } from "@/frontend/components/design-icon";
export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession();
  const { id } = await params;
  const note = await getOwnedNote(user.id, id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const shareUrl = `${process.env.BETTER_AUTH_URL}/share/${note.token}`;
  return (
    <>
      <h1 className="page-heading">Note details</h1>
      <div className="flex items-start gap-4">
        <Link
          href="/notes"
          aria-label="Back to my notes"
          className="rounded-lg border bg-muted p-3"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h2 className="break-words text-[23px] font-bold">{note.title}</h2>
          <p className="mt-3 text-xs text-muted-foreground">
            Created <LocalTime date={note.createdAt.toISOString()} />
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="badge text-amber-300">
          <DesignIcon name={note.shareType === "one-time" ? "bolt" : "timer"} />
          {note.shareType === "one-time" ? "One-time" : "Time-based"}
        </span>
        <span className="badge text-rose-300">
          <DesignIcon name={note.accessType === "password" ? "lock" : "globe"} />
          {note.accessType === "password" ? "Password protected" : "Public"}
        </span>
        <NoteStatus note={note} />
      </div>
      <div className="mt-6 grid max-w-[1044px] items-start gap-6 lg:grid-cols-[1.68fr_1fr]">
        <div className="min-w-0 space-y-4">
          <article className="panel p-6">
            <h3 className="mb-5 text-[13px] font-semibold">Note content</h3>
            <div className="note-content min-h-[136px] rounded-lg border bg-background p-4 font-mono text-[13px] text-zinc-300">
              {note.content}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Owner preview · does not count as a view
            </p>
          </article>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="panel p-5">
              <dt className="text-xs text-muted-foreground">Total views</dt>
              <dd className="mt-3 text-2xl font-bold">{note.viewCount}</dd>
            </div>
            <div className="panel p-5">
              <dt className="text-xs text-muted-foreground">Expires at</dt>
              <dd className="mt-3 text-xs leading-5 text-amber-300">
                <LocalTime date={note.expiresAt.toISOString()} />
              </dd>
            </div>
            <div className="panel p-5">
              <dt className="text-xs text-muted-foreground">Access key</dt>
              <dd className="mt-3 text-sm text-primary">
                {note.accessType === "password" ? "Protected" : "Not required"}
              </dd>
            </div>
          </dl>
          <section className="panel p-6">
            <h3 className="text-[13px] font-semibold">How views are counted</h3>
            <div className="mt-5 space-y-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-3">
                <Check className="size-4 text-emerald-400" />
                Successful public access adds one view.
              </p>
              <p className="flex items-center gap-3">
                <Check className="size-4 text-emerald-400" />
                The correct access key unlocks the note and adds one view.
              </p>
              <p className="flex items-center gap-3">
                <X className="size-4" />
                Wrong keys and unavailable links do not count.
              </p>
              <p className="border-t pt-4 leading-6 text-primary">
                A one-time link can be opened successfully only once, even when two people try at
                the same time.
              </p>
            </div>
          </section>
        </div>
        <aside className="panel min-w-0 p-6">
          <h3 className="mb-6 text-[13px] font-semibold">Share settings</h3>
          {note.accessType === "password" && (
            <p className="mb-6 rounded-lg border bg-background p-3 text-xs leading-5 text-muted-foreground">
              Your access key was shown once at creation. It cannot be recovered.
            </p>
          )}
          <NoteActions id={note.id} shareUrl={shareUrl} revoked={Boolean(note.revokedAt)} />
        </aside>
      </div>
    </>
  );
}
