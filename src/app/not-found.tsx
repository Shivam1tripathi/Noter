import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="eyebrow">404 · Not found</p>
      <h1 className="mt-4 text-3xl font-semibold">Nothing to see here.</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This page doesn’t exist or isn’t available to your account.
      </p>
      <Button asChild className="mt-7">
        <Link href="/notes">Back to my notes</Link>
      </Button>
    </main>
  );
}
