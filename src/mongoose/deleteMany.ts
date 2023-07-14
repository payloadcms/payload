import type { MongooseAdapter } from '.';
import type { DeleteMany } from '../database/types';

export const deleteMany: DeleteMany = async function deleteMany(this: MongooseAdapter,
  { collection, where }) {
  const Model = this.collections[collection];

  const query = await Model.buildQuery({
    payload: this.payload,
    where,
  });

  await Model.deleteMany(query).lean();
};
