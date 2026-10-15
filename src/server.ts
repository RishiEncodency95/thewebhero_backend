import app from "./app";
import { env } from "./config/env";
import { connectDBWithRetry } from "./config/db";
import { logger } from "./config/logger";

const start = async (): Promise<void> => {
  // Listen right away; API routes answer 503 until the database is reachable.
  void connectDBWithRetry();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error(reason, "Unhandled promise rejection");
  });
};

start();
