import { DeleteMany } from '@alessiogr/payloadtest/database';
import { PayloadRequest } from '@alessiogr/payloadtest/types';
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
