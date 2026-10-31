import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

/** One JSON line per request: id, method, path, status, duration. No cookies, no bodies. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID();
  const started = process.hrtime.bigint();
  res.setHeader("x-request-id", id);
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(
      JSON.stringify({
        level: "info",
        requestId: id,
        method: req.method,
        path: req.originalUrl.split("?")[0],
        status: res.statusCode,
        durationMs: Math.round(durationMs * 10) / 10,
      }),
    );
  });
  next();
}
