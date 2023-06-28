import type { MongooseAdapter } from '.';
import type { CreateGlobal } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export const createGlobal: CreateGlobal = async function createGlobal(this: MongooseAdapter,
  { data, slug }) {
  const Model = this.globals;


  let result = await Model.create({
    globalType: slug,
    ...data,
  }) as any;

  result = JSON.parse(JSON.stringify(result));

  // custom id type reset
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
