import { verifyPassword } from "better-auth/crypto";
import { getNoteModel, type NoteDocument } from "@/backend/db";
import { ApiError } from "./http";

function checkShare(note: NoteDocument) {
  if (note.revokedAt) throw new ApiError(410, "The owner has revoked this link.");
  if (note.expiresAt.getTime() <= Date.now()) throw new ApiError(410, "This link has expired.");
  if (note.shareType === "one-time" && note.usedAt)
    throw new ApiError(410, "This one-time link has already been used.");
}

async function findShare(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new ApiError(404, "This share link is invalid.");
  const Note = await getNoteModel();
  const note = await Note.findOne({ token }).lean<NoteDocument>();
  if (!note) throw new ApiError(404, "This share link is invalid.");
  return note;
}

export async function getShareInfo(token: string) {
  const note = await findShare(token);
  checkShare(note);
  return { accessType: note.accessType, shareType: note.shareType, expiresAt: note.expiresAt };
}

async function limitAttempts(note: NoteDocument) {
  const now = new Date();
  // Each link owns one counter. This update is atomic across app processes.
  const Note = await getNoteModel();
  const attempt = await Note.findOneAndUpdate(
    { _id: note._id },
    [
      {
        $set: {
          attemptCount: {
            $cond: [
              { $lte: ["$attemptsResetAt", now] },
              1,
              { $min: [{ $add: ["$attemptCount", 1] }, 1_000_000] },
            ],
          },
          attemptsResetAt: {
            $cond: [
              { $lte: ["$attemptsResetAt", now] },
              new Date(now.getTime() + 60_000),
              "$attemptsResetAt",
            ],
          },
        },
      },
    ],
    { returnDocument: "after", updatePipeline: true },
  ).lean<NoteDocument>();
  const maximum = note.accessType === "password" ? 10 : 120;
  if (attempt && attempt.attemptCount > maximum)
    throw new ApiError(429, "Too many attempts. Please wait a minute and try again.", 60);
}

export async function accessShare(token: string, accessKey?: string) {
  const note = await findShare(token);
  checkShare(note);
  await limitAttempts(note);
  if (note.accessType === "password") {
    if (
      !accessKey ||
      !note.keyHash ||
      !(await verifyPassword({ password: accessKey, hash: note.keyHash }))
    )
      throw new ApiError(403, "Incorrect access key. Please try again.");
  }

  const now = new Date();
  // One conditional update claims the link and increments its count.
  // Simultaneous one-time requests cannot both match usedAt: null.
  const Note = await getNoteModel();
  const claimed = await Note.findOneAndUpdate(
    {
      _id: note._id,
      revokedAt: null,
      expiresAt: { $gt: now },
      $or: [{ shareType: "time-based" }, { shareType: "one-time", usedAt: null }],
    },
    note.shareType === "one-time"
      ? { $inc: { viewCount: 1 }, $set: { usedAt: now } }
      : { $inc: { viewCount: 1 } },
    { returnDocument: "after", projection: { title: 1, content: 1 } },
  ).lean<NoteDocument>();
  if (!claimed) {
    const current = await findShare(token);
    checkShare(current);
    throw new ApiError(410, "This link is no longer available.");
  }
  return { title: claimed.title, content: claimed.content };
}
