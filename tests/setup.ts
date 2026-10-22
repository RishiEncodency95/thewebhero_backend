import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret_123456";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_123456";
// Tests never touch the real Cloudinary account: uploads go to local disk.
process.env.CLOUDINARY_CLOUD_NAME = "your_cloud_name";
process.env.CLOUDINARY_API_KEY = "your_api_key";
process.env.CLOUDINARY_API_SECRET = "your_api_secret";
// ...and never send real email.
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
