import { z } from "zod";
import { auth } from "./auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", ...extraHeaders },
  });
}

export async function handleApi(action: () => Promise<Response>) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ApiError)
      return json(
        { error: error.message },
        error.status,
        error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {},
      );
    // Avoid logging request URLs or bodies: they can contain sharing secrets.
    console.error("Request failed:", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

export function checkOrigin(request: Request) {
  const expected = process.env.BETTER_AUTH_URL;
  if (!expected || request.headers.get("origin") !== new URL(expected).origin) {
    throw new ApiError(403, "This request must come from Noter.");
  }
}

export async function requireUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new ApiError(401, "Please sign in to continue.");
  return session.user;
}

export async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Send JSON data.");
  // Bound the stream itself; Content-Length can be missing or dishonest.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Please send the required information.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 100_000) {
      await reader.cancel();
      throw new ApiError(413, "This request is too large.");
    }
    chunks.push(value);
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "Invalid JSON data.");
  }
  const result = schema.safeParse(body);
  if (!result.success) throw new ApiError(400, result.error.issues[0].message);
  return result.data;
}
