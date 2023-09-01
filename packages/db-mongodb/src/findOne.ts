import type { MongooseQueryOptions } from 'mongoose';
import type { FindOne } from 'payload/database';
import type { PayloadRequest } from 'payload/types';
import type { Document } from 'payload/types';

import type { MongooseAdapter } from '.';

import sanitizeInternalFields from './utilities/sanitizeInternalFields';
import { withSession } from './withSession';

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection];
  const options: MongooseQueryOptions = {
    ...withSession(this, req.transactionID),
    lean: true,
  };

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
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
