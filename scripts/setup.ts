import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  console.log(".env already exists; left unchanged.");
} else {
  writeFileSync(
    ".env",
    `MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/Noter\nBETTER_AUTH_SECRET=${randomBytes(32).toString("base64url")}\nBETTER_AUTH_URL=http://localhost:3000\n`,
  );
  console.log("Created .env. Add your Atlas connection string to MONGODB_URI.");
}
