import type { MongooseAdapter } from '.';
import type { CreateGlobal } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import { withSession } from './withSession';
import { PayloadRequest } from '../express/types';

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
