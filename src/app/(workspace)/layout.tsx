import { requireSession } from "@/backend/session";
import { WorkspaceNav } from "@/frontend/components/workspace-nav";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  return (
    <div className="min-h-screen">
      <WorkspaceNav name={user.name} email={user.email} />
      <main className="mx-auto max-w-[1536px] px-5 py-8 sm:px-12">{children}</main>
    </div>
  );
}
