import Link from "next/link";
import { ArrowUpRight, Clock3, Eye, FileText, KeyRound, Plus } from "lucide-react";
import { requireSession } from "@/backend/session";
import { listNotes } from "@/backend/notes";
import { getNoteStatus } from "@/frontend/lib/note-status";
import { Button } from "@/frontend/components/ui/button";
import { NoteStatus } from "@/frontend/components/note-status";
import { LocalTime } from "@/frontend/components/local-time";

export default async function NotesPage() {
  const { user } = await requireSession();
  const notes = await listNotes(user.id);
  const active = notes.filter((note) => getNoteStatus(note) === "Active").length;
  return (
    <>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            My notes<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A home for your words, with sharing on your terms.
          </p>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus /> New note
          </Link>
        </Button>
      </div>
      <div className="mb-10 grid grid-cols-3 divide-x rounded-xl border bg-card py-5">
        {[
          { title: "Notes", value: notes.length },
          { title: "Active links", value: active },
          { title: "Successful views", value: notes.reduce((total, n) => total + n.viewCount, 0) },
        ].map((item) => (
          <div key={item.title} className="px-4 sm:px-7">
            <p className="text-2xl font-semibold">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.title}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Your collection</h2>
        <p className="text-xs text-muted-foreground">Newest first · up to 100 notes</p>
      </div>
      {notes.length === 0 ? (
        <div className="panel flex flex-col items-center px-6 py-20 text-center">
          <div className="mb-5 rounded-2xl bg-primary/10 p-4 text-primary">
            <FileText className="size-7" />
          </div>
          <h2 className="text-xl font-semibold">Every good note starts somewhere.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Write your first note, choose how it’s shared, and we’ll take care of the link.
          </p>
          <Button asChild className="mt-7">
            <Link href="/notes/new">
              <Plus /> Write a note
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {notes.map((note) => (
            <Link
              href={`/notes/${note.id}`}
              key={note.id}
              className="panel group p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-lg bg-background p-2 text-primary">
                  <FileText className="size-5" />
                </div>
                <NoteStatus note={note} />
              </div>
              <h3 className="mt-5 flex items-center justify-between gap-3 text-lg font-semibold">
                <span className="truncate">{note.title}</span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </h3>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="size-3.5" />
                  {note.accessType === "password" ? "Key protected" : "Public link"}
                </span>
                <span>·</span>
                <span>{note.shareType === "one-time" ? "One-time" : "Time-based"}</span>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  <LocalTime date={note.expiresAt.toISOString()} />
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="size-3.5" />
                  {note.viewCount} views
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
