import mongoose from 'mongoose';
import { createApp } from './app.js';
import { todoRepository } from './todo.js';

const port = Number(process.env.PORT || 3001);
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is missing. Copy server/.env.example to server/.env and set your MongoDB connection string.');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const server = createApp(todoRepository).listen(port, () => {
    console.log(`Daylight API listening on http://localhost:${port}`);
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await mongoose.disconnect();
      clearTimeout(timeout);
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  server.on('error', async (error) => {
    console.error('Could not start HTTP server:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  process.exit(1);
}
