import { checkOrigin, handleApi, json, requireUser } from "@/backend/http";
import { revokeNote } from "@/backend/notes";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    checkOrigin(request);
    const user = await requireUser(request);
    await revokeNote(user.id, (await context.params).id);
    return json({ success: true });
  });
}
