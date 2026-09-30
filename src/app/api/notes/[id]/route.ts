import { handleApi, json, requireUser } from "@/backend/http";
import { getOwnedNote } from "@/backend/notes";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const user = await requireUser(request);
    return json(await getOwnedNote(user.id, (await context.params).id));
  });
}
