import type { MongooseAdapter } from '.';
import type { Create } from '../database/types';
import { Document } from '../types';

export const create: Create = async function create(this: MongooseAdapter,
  { collection, data }) {
  const Model = this.collections[collection];

  const doc = await Model.create(data);

  let result: Document = doc.toJSON({ virtuals: true });
  const verificationToken = doc._verificationToken;

  // custom id type reset
  result.id = result._id;
  result = JSON.parse(JSON.stringify(result));
  if (verificationToken) {
    result._verificationToken = verificationToken;
  }
  return result;
};
