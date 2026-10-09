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

app.use("/api/v1", globalRateLimiter, v1Router);

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "TheWebHero API is running" });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
