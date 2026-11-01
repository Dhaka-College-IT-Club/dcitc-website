import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

/** One JSON line per request: id, method, path, status, duration. No cookies, no bodies. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID();
  const started = process.hrtime.bigint();
  res.setHeader("x-request-id", id);
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const entry: Record<string, unknown> = {
      level: "info",
      requestId: id,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
    };
    if (env.TRUST_PROXY_DIAGNOSTIC) {
      // Temporary proxy-chain check; off unless an operator opts in.
      const forwarded = req.headers["x-forwarded-for"];
      entry.clientIp = req.ip ?? "";
      entry.forwardedFor = typeof forwarded === "string" ? forwarded : Array.isArray(forwarded) ? forwarded.join(",") : "";
    }
    console.log(JSON.stringify(entry));
  });
  next();
}
