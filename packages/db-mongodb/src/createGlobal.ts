import { PayloadRequest } from 'payload/types';
import sanitizeInternalFields from 'payload/dist/utilities/sanitizeInternalFields';
import { CreateGlobal } from 'payload/dist/database/types';
import { withSession } from './withSession';
import type { MongooseAdapter } from '.';

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { data, slug, req = {} as PayloadRequest },
) {
  const Model = this.globals;
  const global = {
    globalType: slug,
    ...data,
  };
  const options = withSession(this, req.transactionID);

  let [result] = (await Model.create([global], options)) as any;

  result = JSON.parse(JSON.stringify(result));

  // custom id type reset
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
