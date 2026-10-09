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

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});
