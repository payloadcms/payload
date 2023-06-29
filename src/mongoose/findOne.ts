import type { MongooseAdapter } from '.';
import type { FindOne } from '../database/types';
import type { Document } from '../types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export const findOne: FindOne = async function findOne(this: MongooseAdapter,
  { collection, where, locale }) {
  const Model = this.collections[collection].model;


  const query = await Model.buildQuery({
    payload: this.payload,
    locale,
    where,
  });

  const doc = await Model.findOne(query).lean();

  if (!doc) {
    return null;
  }


  let result: Document = JSON.parse(JSON.stringify(doc));

  // custom id type reset
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
