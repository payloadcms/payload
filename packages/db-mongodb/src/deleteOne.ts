import { DeleteOne } from '@alessiogr/payloadtest/database';
import type { Document } from '@alessiogr/payloadtest/types';
import { PayloadRequest } from '@alessiogr/payloadtest/types';
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js';
import type { MongooseAdapter } from './index.js';
import { withSession } from './withSession.js';

export const deleteOne: DeleteOne = async function deleteOne(
  this: MongooseAdapter,
  { collection, where, req = {} as PayloadRequest },
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
