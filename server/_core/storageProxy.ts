import type { Express } from "express";
import { ENV, isServiceUrl } from "./env";

export function isSafeStorageKey(key: string): boolean {
  return (
    Boolean(key) &&
    key.length <= 2048 &&
    !/[\x00-\x1f\x7f\\?#]/.test(key) &&
    !key.startsWith("/") &&
    !/^[a-z][a-z0-9+.-]*:/i.test(key) &&
    key.split("/").every(part => Boolean(part) && part !== "." && part !== "..")
  );
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0] || "";
    if (!isSafeStorageKey(key)) {
      res.status(400).json({ error: "Invalid storage key." });
      return;
    }
    if (!isServiceUrl(ENV.forgeApiUrl) || !ENV.forgeApiKey) {
      res.status(503).json({ error: "Storage service is not configured." });
      return;
    }
    try {
      const url = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      url.searchParams.set("path", key);
      const upstream = await fetch(url, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
        signal: AbortSignal.timeout(30000),
        redirect: "error", // Do not forward the service credential to redirected hosts.
      });
      if (!upstream.ok) {
        console.warn(`[StorageProxy] Service returned HTTP ${upstream.status}`);
        res.status(502).json({ error: "Storage service request failed." });
        return;
      }
      const data = (await upstream.json()) as {
        url?: unknown;
        error?: unknown;
      };
      if (data.error || typeof data.url !== "string")
        throw new Error("Invalid presign result.");
      const signedUrl = new URL(data.url);
      if (
        signedUrl.protocol !== "https:" ||
        signedUrl.username ||
        signedUrl.password
      )
        throw new Error("Unsafe presign result.");
      // The destination comes only from the credentialed configured storage
      // service, never from a user URL/query. No arbitrary URL fetch occurs.
      res.set("Cache-Control", "no-store").redirect(307, signedUrl.toString());
    } catch {
      console.warn("[StorageProxy] Configured storage request failed");
      res
        .status(502)
        .json({ error: "Storage service is temporarily unavailable." });
    }
  });
}
