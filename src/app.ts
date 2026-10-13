import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";

import { env, isProd } from "./config/env";
import { logger } from "./config/logger";
import { globalRateLimiter } from "./common/middlewares/rateLimiter.middleware";
import { errorHandler, notFoundHandler } from "./common/middlewares/error.middleware";
import v1Router from "./routes/v1";
import { UPLOAD_DIR } from "./modules/media/storage";

const app: Application = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: [env.CLIENT_URL, env.ADMIN_URL],
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use(
  morgan(isProd ? "combined" : "dev", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Locally stored uploads (when Cloudinary isn't configured). Served with a
// locked-down CSP so an uploaded SVG can never run script, and a cross-origin
// resource policy so the website and admin (other origins) can show images.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "30d",
    immutable: true,
    index: false,
    setHeaders: (res) => {
      res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

app.use("/api/v1", globalRateLimiter, v1Router);

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "TheWebHero API is running" });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
