import type { MongooseAdapter } from '.';
import { CreateArgs } from '../database/types';
import { Document } from '../../types';

export async function create<T = unknown>(
  this: MongooseAdapter,
  { collection, data }: CreateArgs,
): Promise<T> {
  const Model = this.collections[collection];

  const doc = await Model.create(data);

  let result: Document = doc.toJSON({ virtuals: true });
  const verificationToken = doc._verificationToken;

  // custom id type reset
  result.id = result._id;
  result = JSON.parse(JSON.stringify(result));
  result._verificationToken = verificationToken;
  return result;
}
