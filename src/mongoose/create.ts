import type { MongooseAdapter } from '.';
import type { Create } from '../database/types';
import type { Document } from '../types';

export const create: Create = async function create(this: MongooseAdapter,
  { collection, data }) {
  const Model = this.collections[collection];

  const doc = await Model.create(data);

  // doc.toJSON does not do stuff like converting ObjectIds to string, or date strings to date objects. That's why we use JSON.parse/stringify here
  const result: Document = JSON.parse(JSON.stringify(doc));
  const verificationToken = doc._verificationToken;

  // custom id type reset
  result.id = result._id;
  if (verificationToken) {
    result._verificationToken = verificationToken;
  }
  return result;
};
