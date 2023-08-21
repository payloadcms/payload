import { DeleteMany } from 'payload/dist/database/types';
import { PayloadRequest } from 'payload/dist/express/types';
import type { MongooseAdapter } from '.';
import { withSession } from './withSession';

export const deleteMany: DeleteMany = async function deleteMany(this: MongooseAdapter,
  { collection, where, req = {} as PayloadRequest }) {
  const Model = this.collections[collection];
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
  };

  const query = await Model.buildQuery({
    payload: this.payload,
    where,
  });

  await Model.deleteMany(query, options);
};
