export default function Loading() {
  return (
    <div role="status" className="animate-pulse space-y-6">
      <div className="h-9 w-56 rounded bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <div className="h-72 rounded-xl bg-muted" />
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
