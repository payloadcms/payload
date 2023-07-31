import type { MongooseQueryOptions } from 'mongoose';
import type { FindOne } from 'payload/dist/database/types';
import type { Document } from 'payload/types';
import { PayloadRequest } from 'payload/dist/express/types';
import sanitizeInternalFields from 'payload/dist/utilities/sanitizeInternalFields';
import type { MongooseAdapter } from '.';
import { withSession } from './withSession';

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection, where, locale, req = {} as PayloadRequest },
) {
  const Model = this.collections[collection];
  const options: MongooseQueryOptions = {
    ...withSession(this, req.transactionID),
    lean: true,
  };

  const query = await Model.buildQuery({
    payload: this.payload,
    locale,
    where,
  });

  const doc = await Model.findOne(query, {}, options);

  if (!doc) {
    return null;
  }

  let result: Document = JSON.parse(JSON.stringify(doc));

  // custom id type reset
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
