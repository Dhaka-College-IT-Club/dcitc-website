import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "not_found", message: "Not found." } });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) {
    if (error.headers) {
      for (const [name, value] of Object.entries(error.headers)) res.setHeader(name, value);
    }
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: { code: "validation_failed", message: "Some fields are invalid." },
    });
    return;
  }

  // body-parser errors carry a status/type; expose 413 rather than a generic 500.
  const maybe = error as { status?: number; type?: string };
  if (maybe?.type === "entity.too.large") {
    res.status(413).json({ error: { code: "payload_too_large", message: "Request body is too large." } });
    return;
  }
  if (maybe?.status === 400 && maybe.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "validation_failed", message: "Malformed JSON body." } });
    return;
  }

  console.error(
    JSON.stringify({
      level: "error",
      message: "unhandled_error",
      name: error instanceof Error ? error.name : typeof error,
      detail: isProduction ? undefined : error instanceof Error ? error.message : undefined,
    }),
  );
  res.status(500).json({ error: { code: "internal_error", message: "Something went wrong." } });
}
