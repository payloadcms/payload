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

  result = result.toJSON({ virtuals: true });

  // custom id type reset
  result.id = result._id;
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result = sanitizeInternalFields(result);

  return result;
};
