import mongoose from 'mongoose';
import { Destroy } from '../database/types';
import { MongooseAdapter } from './index';

export const destroy: Destroy = async function destroy(
  this: MongooseAdapter,
) {
  if (this.mongoMemoryServer) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await this.mongoMemoryServer.stop();
  }
};
