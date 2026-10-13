// Local development MongoDB without installing MongoDB: runs the
// mongodb-memory-server binary on 127.0.0.1:27017 and stores data in
// ./.local-db so it survives restarts. Use a real MongoDB in production.
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(__dirname, "../.local-db");
fs.mkdirSync(dbPath, { recursive: true });

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017, ip: "127.0.0.1", dbPath, storageEngine: "wiredTiger" },
  });
  // eslint-disable-next-line no-console
  console.log(`Local MongoDB running at ${mongod.getUri()} (data: ${dbPath})`);

  const stop = async () => {
    await mongod.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
})();
