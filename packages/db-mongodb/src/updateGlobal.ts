import type { UpdateGlobal } from 'payload/dist/database/types';
import sanitizeInternalFields from 'payload/dist/utilities/sanitizeInternalFields';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { MongooseAdapter } from '.';
import { withSession } from './withSession';

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  const Model = this.globals;
  const options = {
    ...withSession(this, req.transactionID),
    new: true,
    lean: true,
  };

  let result;
  result = await Model.findOneAndUpdate(
    { globalType: slug },
    data,
    options,
  );

  result = JSON.parse(JSON.stringify(result));

  // custom id type reset
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
