"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : label}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          Select and copy the text manually.
        </span>
      )}
    </span>
  );
}
