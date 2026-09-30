import { checkOrigin, handleApi, json, readBody, requireUser } from "@/backend/http";
import { createNote, createNoteSchema, listNotes } from "@/backend/notes";

export async function GET(request: Request) {
  return handleApi(async () => {
    const user = await requireUser(request);
    return json(await listNotes(user.id));
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    checkOrigin(request);
    const user = await requireUser(request);
    const input = await readBody(request, createNoteSchema);
    return json(await createNote(user.id, input), 201);
  });
}
