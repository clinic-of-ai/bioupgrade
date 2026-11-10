import { TRPCError } from "@trpc/server";
import { ENV, isServiceUrl } from "./env";

export async function notifyOwner(input: {
  title: string;
  content: string;
}): Promise<boolean> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content || title.length > 1200 || content.length > 20000) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A valid notification title and content are required.",
    });
  }
  if (!isServiceUrl(ENV.forgeApiUrl) || !ENV.forgeApiKey) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Owner notifications are not configured.",
    });
  }
  const url = new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
  );
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ title, content }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      console.warn(`[Notification] Service returned HTTP ${response.status}`);
      return false;
    }
    const data: unknown = await response.json().catch(() => null);
    return !(data && typeof data === "object" && "error" in data);
  } catch {
    console.warn("[Notification] Service request failed");
    return false;
  }
}
