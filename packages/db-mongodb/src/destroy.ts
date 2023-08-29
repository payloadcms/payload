import mongoose from 'mongoose';
import { Destroy } from 'payload/database';
import { MongooseAdapter } from './index.js';

export const destroy: Destroy = async function destroy(
  this: MongooseAdapter,
) {
  if (this.mongoMemoryServer) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await this.mongoMemoryServer.stop();
  }
};
