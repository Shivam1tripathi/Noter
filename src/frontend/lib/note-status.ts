type ShareStatus = {
  revokedAt: Date | string | null;
  usedAt: Date | string | null;
  expiresAt: Date | string;
  shareType: string;
};

export function getNoteStatus(note: ShareStatus) {
  if (note.revokedAt) return "Revoked";
  if (new Date(note.expiresAt).getTime() <= Date.now()) return "Expired";
  if (note.shareType === "one-time" && note.usedAt) return "Used";
  return "Active";
}
