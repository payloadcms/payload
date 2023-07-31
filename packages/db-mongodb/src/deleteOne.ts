import { DeleteOne } from 'payload/dist/database/types';
import type { Document } from 'payload/types';
import { PayloadRequest } from 'payload/dist/express/types';
import sanitizeInternalFields from './utilities/sanitizeInternalFields';
import type { MongooseAdapter } from '.';
import { withSession } from './withSession';

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
