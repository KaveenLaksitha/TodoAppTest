import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../server/src/app.js';
import { todoRepository } from '../server/src/todo.js';

// Dedicated, disposable MongoDB; never connects to the user's actual task data.
const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());
const server = createApp(todoRepository).listen(3002, '127.0.0.1', () => {
  console.log('Browser-test server ready at http://127.0.0.1:3002');
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async () => {
      await mongoose.disconnect();
      await mongo.stop();
      process.exit(0);
    });
  });
}
