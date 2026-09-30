import { SharedNote } from "@/frontend/components/shared-note";
export const dynamic = "force-dynamic";
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedNote key={token} token={token} />;
}
