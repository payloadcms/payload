import type { MongooseQueryOptions } from 'mongoose';
import type { FindOne } from 'payload/database';
import type { Document } from 'payload/types';
import { PayloadRequest } from 'payload/types';
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js';
import type { MongooseAdapter } from './index.js';
import { withSession } from './withSession.js';

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
