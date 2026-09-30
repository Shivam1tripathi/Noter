"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { authClient } from "@/frontend/lib/auth-client";
import { Button } from "./ui/button";
import { Logo } from "./logo";
export function WorkspaceNav({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 sm:px-12">
      <Logo />
      <nav className="flex items-center gap-4 text-xs sm:gap-6">
        <Link href="/notes" className="text-muted-foreground hover:text-white">
          My notes
        </Link>
        <Link href="/notes/new" className="text-primary">
          New note
        </Link>
        <span title={email} className="hidden text-muted-foreground sm:block">
          {name}
        </span>
        <Button variant="ghost" size="icon" aria-label="Sign out" disabled={busy} onClick={logout}>
          <LogOut />
        </Button>
      </nav>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </header>
  );
}
