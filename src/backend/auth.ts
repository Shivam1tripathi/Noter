import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from "@/backend/db";

export const auth = betterAuth({
  appName: "NoteVault",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(mongoDb),
  emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128 },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
});
