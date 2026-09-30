"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
export function LocalTime({ date }: { date: string }) {
  // The server doesn't know the reader's timezone. Use UTC until hydration.
  const isBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const label = isBrowser
    ? new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : date.replace("T", " ").slice(0, 16) + " UTC";
  return <time dateTime={date}>{label}</time>;
}
