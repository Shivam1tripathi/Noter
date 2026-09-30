"use client";
import { Button } from "@/frontend/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">We couldn’t load this page.</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please try again in a moment.</p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
