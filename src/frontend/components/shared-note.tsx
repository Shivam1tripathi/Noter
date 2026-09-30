"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { apiRequest } from "@/frontend/lib/client-api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DesignIcon } from "./design-icon";
import { LocalTime } from "./local-time";
import { CopyButton } from "./copy-button";

type ShareInfo = {
  accessType: "public" | "password";
  shareType: "one-time" | "time-based";
  expiresAt: string;
};
type Note = { title: string; content: string };
type InitialResult = { info: ShareInfo; note?: Note };

function unavailableState(error: string) {
  if (error.includes("revoked"))
    return {
      icon: "revoked",
      title: "Link revoked",
      text: "The owner has revoked access to this note.",
      badge: "Access revoked by owner",
      color: "text-rose-400",
    };
  if (error.includes("expired"))
    return {
      icon: "expired",
      title: "This link has expired",
      text: "The sharing window for this note has ended. It is no longer available.",
      badge: "Link expired",
      color: "text-amber-300",
    };
  if (error.includes("already been used"))
    return {
      icon: "used",
      title: "This link has been used",
      text: "This was a one-time note. It has already been opened and cannot be viewed again.",
      badge: "One-time link consumed",
      color: "text-primary",
    };
  if (error.includes("invalid"))
    return {
      icon: "invalid",
      title: "Link not found",
      text: "This link doesn't exist or may have been copied incorrectly.",
      badge: "Invalid share link",
      color: "text-muted-foreground",
    };
  return {
    icon: "invalid",
    title: "Unable to open this note",
    text: error || "Please try again later.",
    badge: "Access unavailable",
    color: "text-muted-foreground",
  };
}

export function SharedNote({ token }: { token: string }) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const initialRequest = useRef<Promise<InitialResult> | null>(null);
  useEffect(() => {
    let active = true;
    // Reuse this request during Strict Mode's effect replay. A public one-time
    // link must not be consumed by a second automatic request.
    initialRequest.current ??= (async () => {
      const info = await apiRequest<ShareInfo>(`/api/share/${token}`);
      const note =
        info.accessType === "public"
          ? await apiRequest<Note>(`/api/share/${token}/access`, { method: "POST", body: "{}" })
          : undefined;
      return { info, note };
    })();
    initialRequest.current
      .then((result) => {
        if (active) {
          setInfo(result.info);
          setNote(result.note ?? null);
        }
      })
      .catch((error) => {
        if (active) setError(error instanceof Error ? error.message : "Could not open this link.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      setNote(
        await apiRequest<Note>(`/api/share/${token}/access`, {
          method: "POST",
          body: JSON.stringify({ accessKey: String(form.get("accessKey")).trim() }),
        }),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not unlock the note.");
    } finally {
      setBusy(false);
    }
  }
  const terminalError = /revoked|expired|already been used|invalid/.test(error);
  const state = unavailableState(error);
  return (
    <main className="auth-shell">
      <p className="text-[21px] font-bold">
        NoteVault <span className="font-normal text-muted-foreground">/ Shared note</span>
      </p>
      {loading ? (
        <div
          role="status"
          className="flex justify-center gap-3 py-40 text-sm text-muted-foreground"
        >
          <LoaderCircle className="size-5 animate-spin" />
          Opening your note…
        </div>
      ) : note ? (
        <div className="mx-auto mt-24 w-full max-w-[600px]">
          <article className="panel p-6 sm:p-8">
            <header className="flex items-center gap-4">
              <div className="brand-tile shrink-0">
                <DesignIcon name="pen" />
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-lg font-bold">{note.title}</h1>
                <p className="mt-2 text-xs text-muted-foreground">Shared securely via NoteVault</p>
              </div>
            </header>
            <div className="note-content mt-6 min-h-[150px] rounded-lg border bg-background p-5 text-sm text-zinc-300">
              {note.content}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>{info?.accessType === "password" ? "Key protected" : "Public access"}</span>
              {info && (
                <span>
                  Expires <LocalTime date={info.expiresAt} />
                </span>
              )}
            </div>
            <div className="mt-6">
              <CopyButton
                value={typeof window === "undefined" ? "" : window.location.href}
                label="Copy share link"
              />
            </div>
          </article>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-6">
            <DesignIcon name="check" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">View counted (+1).</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {info?.shareType === "one-time"
                  ? "This one-time link is now used. Keep this page open while reading; refreshing will not reopen it."
                  : "You can view this note until it expires or the owner revokes access."}
              </p>
            </div>
          </div>
        </div>
      ) : info?.accessType === "password" && !terminalError ? (
        <section className="auth-card panel">
          <div className="mx-auto flex size-14 items-center justify-center rounded-[14px] border border-rose-400/20 bg-rose-400/10">
            <DesignIcon name="locked" />
          </div>
          <h1 className="mt-7 text-center text-xl font-bold">
            {error ? "Access denied" : "This note is locked"}
          </h1>
          <p className="mt-3 text-center text-[13px] leading-6 text-muted-foreground">
            Enter the access key shared by the owner.
          </p>
          <form onSubmit={unlock} className="mt-7">
            <label htmlFor="accessKey" className="field-label">
              Access key
            </label>
            <Input
              id="accessKey"
              name="accessKey"
              type="password"
              autoComplete="off"
              maxLength={128}
              required
              placeholder="Enter access key"
              className={`h-[50px] text-center font-mono ${error ? "border-rose-400 text-rose-300" : ""}`}
            />
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/5 p-4"
              >
                <p className="text-sm font-semibold text-rose-300">{error}</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Unsuccessful attempts do not count as views or consume this link. Repeated
                  attempts are limited for 60 seconds.
                </p>
              </div>
            )}
            <Button className="mt-5 h-[52px] w-full" disabled={busy}>
              {busy && <LoaderCircle className="animate-spin" />}
              {busy ? "Unlocking…" : error ? "Try again" : "Unlock note"}
            </Button>
          </form>
          {!error && (
            <div className="mt-6 rounded-lg border bg-background p-4 text-xs leading-6 text-muted-foreground">
              Ask the owner for the access key. For your privacy, the key is sent separately from
              this link.{info.shareType === "one-time" && " This note can be opened only once."}
            </div>
          )}
        </section>
      ) : (
        <section className="auth-card panel min-h-[420px] text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted">
            <DesignIcon name={state.icon} />
          </div>
          <h1 className="mt-7 text-xl font-bold">{state.title}</h1>
          <p role="alert" className="mt-5 text-[13px] leading-6 text-muted-foreground">
            {state.text}
          </p>
          <span className={`badge mt-7 ${state.color}`}>{state.badge}</span>
          <p className="mt-8 border-t pt-5 text-xs leading-6 text-muted-foreground">
            Need access? Ask the owner for a fresh link.
          </p>
        </section>
      )}
    </main>
  );
}
