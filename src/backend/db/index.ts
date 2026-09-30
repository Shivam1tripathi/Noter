import mongoose, { Schema, type Model } from "mongoose";
import { MongoClient } from "mongodb";

export type NoteDocument = {
  _id: string;
  ownerId: string;
  title: string;
  content: string;
  createdAt: Date;
  token: string;
  shareType: "one-time" | "time-based";
  accessType: "public" | "password";
  keyHash: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  viewCount: number;
  attemptCount: number;
  attemptsResetAt: Date;
};

const uri = process.env.MONGODB_URI ?? "";
if (!uri) throw new Error("Set MONGODB_URI in .env before starting the app.");

// Better Auth expects a native MongoDB database object for its own collections.
const globalMongo = globalThis as unknown as { noterMongoClient?: MongoClient };
export const mongoClient = globalMongo.noterMongoClient ?? new MongoClient(uri);
if (process.env.NODE_ENV !== "production") globalMongo.noterMongoClient = mongoClient;
export const mongoDb = mongoClient.db();

const noteSchema = new Schema<NoteDocument>(
  {
    _id: { type: String, required: true },
    ownerId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, required: true },
    token: { type: String, required: true },
    shareType: { type: String, enum: ["one-time", "time-based"], required: true },
    accessType: { type: String, enum: ["public", "password"], required: true },
    keyHash: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    attemptCount: { type: Number, default: 0 },
    attemptsResetAt: { type: Date, default: () => new Date(0) },
  },
  { collection: "notes", versionKey: false },
);
noteSchema.index({ token: 1 }, { unique: true });
noteSchema.index({ ownerId: 1, createdAt: -1 });

const globalMongoose = globalThis as unknown as {
  noterMongooseConnection?: Promise<mongoose.Connection>;
};

export async function getNoteModel(): Promise<Model<NoteDocument>> {
  // Reuse the connection while Next.js reloads files during development.
  globalMongoose.noterMongooseConnection ??= mongoose
    .createConnection(uri)
    .asPromise()
    .catch((error) => {
      globalMongoose.noterMongooseConnection = undefined;
      throw error;
    });
  const connection = await globalMongoose.noterMongooseConnection;
  return (
    (connection.models.Note as Model<NoteDocument> | undefined) ??
    connection.model<NoteDocument>("Note", noteSchema)
  );
}
