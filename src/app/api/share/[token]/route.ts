import { handleApi, json } from "@/backend/http";
import { getShareInfo } from "@/backend/shares";
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async () => json(await getShareInfo((await context.params).token)));
}
