import type { MongooseAdapter } from '.';
import type { CreateGlobal } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export const createGlobal: CreateGlobal = async function createGlobal(this: MongooseAdapter,
  { data, slug }) {
  const Model = this.globals;
  const global = {
    globalType: slug,
    ...data,
  };

  let result;
  if (this.session) {
    [result] = await Model.create([global], { session: this.session }) as any;
  } else {
    result = await Model.create(global) as any;
  }

  result = JSON.parse(JSON.stringify(result));

  // custom id type reset
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
