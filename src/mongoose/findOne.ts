import type { MongooseAdapter } from '.';
import type { FindOneArgs } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import type { Document } from '../types';

export async function findOne<T = unknown>(
  this: MongooseAdapter,
  { collection, where, locale }: FindOneArgs,
): Promise<T> {
  const Model = this.collections[collection];


  const query = await Model.buildQuery({
    payload: this.payload,
    locale,
    where,
  });

  const doc = await Model.findOne(query);

  if (!doc) {
    return null;
  }


  let result: Document = doc.toJSON({ virtuals: true });

  // custom id type reset
  result.id = result._id;
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result = sanitizeInternalFields(result);

  return result;
}
