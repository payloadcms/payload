import { PayloadRequest } from '@alessiogr/payloadtest/types';
import { CreateGlobal } from '@alessiogr/payloadtest/database';
import sanitizeInternalFields from './utilities/sanitizeInternalFields';
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
