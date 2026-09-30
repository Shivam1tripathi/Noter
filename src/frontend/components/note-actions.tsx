"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, LoaderCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/frontend/lib/client-api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CopyButton } from "./copy-button";

export function NoteActions({
  id,
  shareUrl,
  revoked,
}: {
  id: string;
  shareUrl: string;
  revoked: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function revoke() {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/api/notes/${id}/revoke`, { method: "POST" });
      setConfirming(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not revoke link.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <label className="field-label" htmlFor="share-url">
        Share link
      </label>
      <Input id="share-url" readOnly value={shareUrl} className="mb-3 text-xs" />
      <CopyButton value={shareUrl} label="Copy link" />
      <div className="mt-6 border-t pt-5">
        <Button variant="outline" size="sm" onClick={() => router.refresh()}>
          <RefreshCw /> Refresh status
        </Button>
      </div>
      <div className="mt-6 border-t pt-5">
        <h3 className="text-sm font-semibold">Close the door early</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Revoke the link to stop future access. Your original note stays here.
        </p>
        {revoked ? (
          <p className="mt-4 text-sm text-muted-foreground">This link has been revoked.</p>
        ) : confirming ? (
          <div className="mt-4">
            <p className="mb-3 text-xs">Revoke this link? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" disabled={busy} onClick={revoke}>
                {busy ? <LoaderCircle className="animate-spin" /> : <Ban />} Yes, revoke
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-destructive"
            onClick={() => setConfirming(true)}
          >
            <Ban /> Revoke link
          </Button>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
