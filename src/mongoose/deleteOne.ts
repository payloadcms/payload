import type { MongooseAdapter } from '.';
import type { DeleteOne } from '../database/types';
import type { Document } from '../types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export const deleteOne: DeleteOne = async function deleteOne(this: MongooseAdapter,
  { collection, where }) {
  const Model = this.collections[collection];

  const query = await Model.buildQuery({
    payload: this.payload,
    where,
  });


  const doc = await Model.findOneAndDelete(query);

  let result: Document = doc.toJSON({ virtuals: true });

  // custom id type reset
  result.id = result._id;
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result = sanitizeInternalFields(result);


  return result;
};
