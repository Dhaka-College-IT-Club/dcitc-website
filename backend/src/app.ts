import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { ping } from "./db/pool.js";
import { AppError } from "./lib/errors.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { requestLogger } from "./middleware/logger.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { contactRouter } from "./routes/contact.js";
import { publicRouter } from "./routes/public.js";
import { superAdminRouter } from "./routes/superAdmin.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "128kb" }));
  app.use(cookieParser());
  app.use(requestLogger);

  // Postgres text cannot store NUL; reject it before it reaches a query.
  app.use((req, _res, next) => {
    if (req.url.includes("%00") || req.url.includes("\0")) {
      return next(new AppError(400, "validation_failed", "Invalid characters in the request."));
    }
    next();
  });

  app.get("/api/v1/health", async (_req, res) => {
    const up = await ping();
    res.status(up ? 200 : 503).json({
      data: { status: up ? "ok" : "degraded", database: up ? "up" : "down" },
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/super-admin", superAdminRouter);
  app.use("/api/v1", publicRouter);
  app.use("/api/v1", contactRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
