"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { LoaderCircle, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CopyButton } from "./copy-button";
import { DesignIcon } from "./design-icon";
import { apiRequest } from "@/frontend/lib/client-api";
type CreatedNote = { id: string; token: string; accessKey: string | null };
export function NoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [shareType, setShareType] = useState("one-time");
  const [accessType, setAccessType] = useState("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<(CreatedNote & { shareUrl: string }) | null>(null);
  function startNewNote() {
    formRef.current?.reset();
    setShareType("one-time");
    setAccessType("password");
    setCreated(null);
    setError("");
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || created) return;
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const expiry = new Date(String(form.get("expiresAt")));
      if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now())
        throw new Error("Choose a future expiry time.");
      const result = await apiRequest<CreatedNote>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          content: form.get("content"),
          expiresAt: expiry.toISOString(),
          shareType,
          accessType,
        }),
      });
      setCreated({ ...result, shareUrl: `${window.location.origin}/share/${result.token}` });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create the note.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-heading">Create new note</h1>
      <form ref={formRef} onSubmit={submit} className="create-grid">
        <fieldset
          disabled={busy || Boolean(created)}
          className="panel min-w-0 space-y-7 p-6 lg:min-h-[640px] lg:p-8"
        >
          <div>
            <label className="field-label" htmlFor="title">
              Note title
            </label>
            <Input
              name="title"
              id="title"
              required
              maxLength={120}
              placeholder="Give your note a title"
              className="h-12"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="content">
              Content
            </label>
            <textarea
              name="content"
              id="content"
              required
              maxLength={20000}
              placeholder="Write your note here…"
              className="h-[190px] w-full resize-y rounded-lg border bg-background p-4 font-mono text-sm leading-7 outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="expiresAt">
              Expiry date & time
            </label>
            <Input
              name="expiresAt"
              id="expiresAt"
              type="datetime-local"
              required
              className="h-12"
            />
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              Every link expires. Choose a future date and time in your local time zone.
            </p>
          </div>
        </fieldset>
        <div className="min-w-0 space-y-4">
          <fieldset disabled={busy || Boolean(created)} className="panel space-y-3 p-6">
            <legend className="sr-only">Share type</legend>
            <h2 className="mb-5 text-[13px] font-semibold">Share type</h2>
            {[
              {
                value: "one-time",
                title: "One-time",
                text: "Link is consumed after the first successful view.",
                icon: "bolt",
              },
              {
                value: "time-based",
                title: "Time-based",
                text: "Accessible multiple times until the expiry time.",
                icon: "timer",
              },
            ].map((option) => (
              <label key={option.value} className="choice">
                <DesignIcon name={option.icon} />
                <span>
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                    {option.text}
                  </span>
                </span>
                <input
                  type="radio"
                  name="shareType"
                  value={option.value}
                  checked={shareType === option.value}
                  onChange={(e) => setShareType(e.target.value)}
                />
              </label>
            ))}
          </fieldset>
          <fieldset disabled={busy || Boolean(created)} className="panel space-y-3 p-6">
            <legend className="sr-only">Access type</legend>
            <h2 className="mb-5 text-[13px] font-semibold">Access type</h2>
            {[
              {
                value: "public",
                title: "Public",
                text: "Anyone with the link can view.",
                icon: "globe",
              },
              {
                value: "password",
                title: "Password protected",
                text: "Requires an access key to unlock.",
                icon: "lock",
              },
            ].map((option) => (
              <label key={option.value} className="choice">
                <DesignIcon name={option.icon} />
                <span>
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                    {option.text}
                  </span>
                </span>
                <input
                  type="radio"
                  name="accessType"
                  value={option.value}
                  checked={accessType === option.value}
                  onChange={(e) => setAccessType(e.target.value)}
                />
              </label>
            ))}
            {accessType === "password" && (
              <p className="pt-2 text-xs leading-5 text-muted-foreground">
                A secure access key is generated when you create the note. You will see it once.
              </p>
            )}
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || Boolean(created)} className="h-[52px] w-full">
            {busy ? <LoaderCircle className="animate-spin" /> : <DesignIcon name="link" />}
            {created ? "Note created" : busy ? "Creating…" : "Create note & generate link"}
          </Button>
        </div>
        <aside className="result-panel panel min-w-0 p-6" aria-live="polite">
          <h2 className="flex items-center gap-3 text-sm font-semibold">
            {created && <DesignIcon name="check" />}
            {created ? "Share link ready" : "Ready when you are"}
          </h2>
          <p className="mt-3 mb-6 text-xs leading-5 text-muted-foreground">
            {created
              ? "Your note is ready to share securely."
              : "Create your note to generate a private share link."}
          </p>
          <label htmlFor="created-link" className="field-label">
            Share link
          </label>
          <Input
            id="created-link"
            readOnly
            value={created?.shareUrl ?? ""}
            placeholder="Your link will appear here"
            className="mb-3 font-mono text-xs text-primary"
          />
          {created && <CopyButton value={created.shareUrl} label="Copy link" />}
          {accessType === "password" && (
            <div className="mt-6">
              <label htmlFor="created-key" className="field-label">
                Access key
              </label>
              <Input
                id="created-key"
                readOnly
                value={created?.accessKey ?? ""}
                placeholder="Generated after creation"
                className="mb-3 font-mono text-xs text-amber-300"
              />
              {created?.accessKey && (
                <CopyButton value={created.accessKey} label="Copy access key" />
              )}
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                Save your key before leaving this page. Send it through a different channel from the
                link.
              </p>
            </div>
          )}
          {created && (
            <div className="mt-6 space-y-3">
              <Button type="button" className="h-[46px] w-full" onClick={startNewNote}>
                Create new note
              </Button>
              <Button asChild variant="outline" className="h-[46px] w-full">
                <Link href={`/notes/${created.id}`}>
                  <ExternalLink /> View note details
                </Link>
              </Button>
            </div>
          )}
        </aside>
      </form>
    </>
  );
}
