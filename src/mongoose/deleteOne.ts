import type { MongooseAdapter } from '.';
import type { DeleteOneArgs } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import { Document } from '../types';

export async function deleteOne<T = unknown>(
  this: MongooseAdapter,
  { collection, id }: DeleteOneArgs,
): Promise<T> {
  const Model = this.collections[collection];

  const doc = await Model.findOneAndDelete({ _id: id });

  let result: Document = doc.toJSON({ virtuals: true });

  // custom id type reset
  result.id = result._id;
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result = sanitizeInternalFields(result);


  return result;
}
