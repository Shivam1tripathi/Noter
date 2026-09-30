import { z } from "zod";
import { checkOrigin, handleApi, json, readBody } from "@/backend/http";
import { accessShare } from "@/backend/shares";
const schema = z.object({ accessKey: z.string().max(128, "Access key is too long.").optional() });
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async () => {
    checkOrigin(request);
    const { accessKey } = await readBody(request, schema);
    return json(await accessShare((await context.params).token, accessKey));
  });
}
