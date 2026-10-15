import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

mongoose.set("strictQuery", true);

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB connected -> ${mongoose.connection.name}`);
  } catch (error) {
    logger.error(error, "MongoDB connection failed");
    process.exit(1);
  }
};

/**
 * For the API server: keeps retrying instead of exiting, so the server stays
 * up (answering 503) through a database outage and recovers on its own.
 */
export const connectDBWithRetry = async (retryMs = 15_000): Promise<void> => {
  for (;;) {
    try {
      await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
      logger.info(`MongoDB connected -> ${mongoose.connection.name}`);
      return;
    } catch (error) {
      logger.error(error, `MongoDB connection failed - retrying in ${retryMs / 1000}s`);
      await new Promise((r) => setTimeout(r, retryMs));
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});
