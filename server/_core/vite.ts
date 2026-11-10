import express, { type Express, type Request } from "express";
import fs from "node:fs";
import type { Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderPublicDocument,
  publicSitemap,
  publicRobots,
} from "../public-pages";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export function resolveProjectRoot() {
  // Source executes in server/_core; the production bundle executes in dist.
  return path.basename(moduleDirectory) === "_core"
    ? path.resolve(moduleDirectory, "../..")
    : path.resolve(moduleDirectory, "..");
}

function isFrontendNavigation(req: Request) {
  return (
    (req.method === "GET" || req.method === "HEAD") &&
    !/^\/(?:api|manus-storage)(?:\/|$)/.test(req.path) &&
    !path.extname(req.path) &&
    Boolean(req.accepts("html"))
  );
}

function registerPublicDocuments(app: Express) {
  app.get("/robots.txt", (_req, res) =>
    res.type("text/plain").send(publicRobots())
  );
  app.get("/sitemap.xml", (_req, res) => {
    const xml = publicSitemap();
    if (!xml) {
      res
        .status(404)
        .type("text/plain")
        .send("Public origin is not configured.");
      return;
    }
    res.type("application/xml").send(xml);
  });
}

export async function setupVite(app: Express, server: Server) {
  // Dynamic import keeps dev-only Vite/config plugins out of startup in a
  // production container. Load the actual project's config from its root.
  const { createServer } = await import("vite");
  const root = resolveProjectRoot();
  const vite = await createServer({
    configFile: path.join(root, "vite.config.ts"),
    server: { middlewareMode: true, hmr: { server } },
    appType: "custom",
  });
  registerPublicDocuments(app);
  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    if (!isFrontendNavigation(req)) return next();
    try {
      const template = await fs.promises.readFile(
        path.join(root, "client/index.html"),
        "utf8"
      );
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      const page = renderPublicDocument(html, req.originalUrl);
      res
        .set("Cache-Control", "no-store")
        .status(page.status)
        .type("html")
        .send(page.html);
    } catch (error) {
      if (error instanceof Error) vite.ssrFixStacktrace(error);
      next(error);
    }
  });
  return vite;
}

export function serveStatic(
  app: Express,
  publicDirectory = path.join(resolveProjectRoot(), "dist/public")
) {
  registerPublicDocuments(app);
  app.use(express.static(publicDirectory, { index: false }));
  app.use((req, res, next) => {
    if (!isFrontendNavigation(req)) return next();
    const index = path.join(publicDirectory, "index.html");
    if (!fs.existsSync(index)) {
      res.status(503).json({
        error:
          "Frontend build is unavailable. Run pnpm build before pnpm start.",
      });
      return;
    }
    try {
      const page = renderPublicDocument(
        fs.readFileSync(index, "utf8"),
        req.originalUrl
      );
      res
        .set("Cache-Control", "no-store")
        .status(page.status)
        .type("html")
        .send(page.html);
    } catch (error) {
      next(error);
    }
  });
}
