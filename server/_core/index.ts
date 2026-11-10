import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe";
import { getServiceStatus } from "./env";
import { registerShopifyRoutes } from "../shopify-routes";
import { getCommerceProvider } from "../../shared/commerce-provider";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  // Must precede every JSON/urlencoded parser and Origin middleware: Stripe
  // validates its own signature on the exact raw webhook bytes.
  registerStripeWebhook(app);
  app.get("/api/health", (_req, res) => {
    res
      .set("Cache-Control", "no-store")
      .json({ ok: true, listener: "up", ...getServiceStatus() });
  });
  app.get("/api/ready", (_req, res) => {
    const status = getServiceStatus();
    res
      .set("Cache-Control", "no-store")
      .status(status.configured ? 200 : 503)
      .json(status);
  });
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: false }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  if (getCommerceProvider() === "shopify") registerShopifyRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );
  // An unknown API/storage path must never return the frontend HTML with 200.
  app.use(["/api", "/manus-storage"], (_req, res) => {
    res.status(404).json({ error: "API route not found." });
  });
  return app;
}

export function configuredPort(value = process.env.PORT || "3000") {
  if (!/^\d+$/.test(value))
    throw new Error("PORT must be an integer from 1 to 65535.");
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be an integer from 1 to 65535.");
  return port;
}

export async function startServer() {
  const port = configuredPort();
  const app = createApp();
  const server = createServer(app);
  let vite: Awaited<ReturnType<typeof setupVite>> | undefined;
  if (process.env.NODE_ENV === "development")
    vite = await setupVite(app, server);
  else serveStatic(app);
  app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status =
      typeof error?.status === "number" &&
      error.status >= 400 &&
      error.status < 600
        ? error.status
        : 500;
    console.warn(`[Server] Request failed (HTTP ${status})`);
    res.status(status).json({
      error:
        status === 413
          ? "Request is too large."
          : "Request could not be processed.",
    });
  };
  app.use(handleError);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "0.0.0.0", () => {
        server.removeListener("error", reject);
        resolve();
      });
    });
  } catch (error) {
    await vite?.close();
    throw error;
  }
  server.once("close", () => {
    void vite?.close();
  });
  console.log(
    `[Server] Listening on 0.0.0.0:${port}; service configuration ready: ${getServiceStatus().configured}`
  );
  return server;
}

// Importing this module in tests does not start a listener. Both tsx source
// execution and node dist/index.js execute the single real entrypoint.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer().catch((error: unknown) => {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "STARTUP_FAILED";
    console.error(
      `[Server] Startup failed (${code}). No alternate port was selected.`
    );
    process.exitCode = 1;
  });
}
