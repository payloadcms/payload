import type { DeleteOne } from 'payload/database';
import type { PayloadRequest } from 'payload/types';
import type { Document } from 'payload/types';

import type { MongooseAdapter } from './index.js';

import sanitizeInternalFields from './utilities/sanitizeInternalFields.js';
import { withSession } from './withSession.js';

export const deleteOne: DeleteOne = async function deleteOne(
  this: MongooseAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection];
  const options = withSession(this, req.transactionID);

  const query = await Model.buildQuery({
    payload: this.payload,
    where,
  });

  const doc = await Model.findOneAndDelete(query, options).lean();

  let result: Document = JSON.parse(JSON.stringify(doc));

  // custom id type reset
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
