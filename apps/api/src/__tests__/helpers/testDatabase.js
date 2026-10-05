import mongoose from "mongoose";

const TEST_DATABASE_URI =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/cera_test";

export async function connectTestDatabase() {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  await mongoose.connect(TEST_DATABASE_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}

export async function clearTestDatabase() {
  const collections = Object.values(mongoose.connection.collections);

  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

export async function disconnectTestDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.dropDatabase();

  await mongoose.disconnect();
}
