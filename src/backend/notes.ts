import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { getNoteModel, type NoteDocument } from "@/backend/db";
import { ApiError } from "./http";

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Give your note a title.").max(120),
  content: z.string().trim().min(1, "Write something in your note.").max(20_000),
  expiresAt: z.iso
    .datetime({ offset: true })
    .refine((value) => new Date(value).getTime() > Date.now(), "Choose a future expiry time."),
  shareType: z.enum(["one-time", "time-based"]),
  accessType: z.enum(["public", "password"]),
});

export async function createNote(ownerId: string, input: z.infer<typeof createNoteSchema>) {
  const Note = await getNoteModel();
  await Note.init();
  const token = randomBytes(32).toString("base64url");
  const accessKey = input.accessType === "password" ? randomBytes(18).toString("base64url") : null;
  const note: NoteDocument = {
    _id: randomUUID(),
    ownerId,
    title: input.title,
    content: input.content,
    createdAt: new Date(),
    token,
    shareType: input.shareType,
    accessType: input.accessType,
    keyHash: accessKey ? await hashPassword(accessKey) : null,
    expiresAt: new Date(input.expiresAt),
    usedAt: null,
    revokedAt: null,
    viewCount: 0,
    attemptCount: 0,
    attemptsResetAt: new Date(0),
  };
  await Note.create(note);
  // The plaintext key is returned once. Only its hash is stored.
  return { id: note._id, token, accessKey };
}

function ownerView(note: NoteDocument) {
  return {
    id: note._id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
    token: note.token,
    shareType: note.shareType,
    accessType: note.accessType,
    expiresAt: note.expiresAt,
    usedAt: note.usedAt,
    revokedAt: note.revokedAt,
    viewCount: note.viewCount,
  };
}

export async function listNotes(ownerId: string) {
  const Note = await getNoteModel();
  const notes = await Note.find({ ownerId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<NoteDocument[]>();
  return notes.map(ownerView);
}

export async function getOwnedNote(ownerId: string, id: string) {
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "Note not found.");
  const Note = await getNoteModel();
  const note = await Note.findOne({ _id: id, ownerId }).lean<NoteDocument>();
  if (!note) throw new ApiError(404, "Note not found.");
  return ownerView(note);
}

export async function revokeNote(ownerId: string, id: string) {
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "Note not found.");
  const Note = await getNoteModel();
  const result = await Note.updateOne({ _id: id, ownerId }, { $set: { revokedAt: new Date() } });
  if (!result.matchedCount) throw new ApiError(404, "Note not found.");
}
