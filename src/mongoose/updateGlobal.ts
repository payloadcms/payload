import type { MongooseAdapter } from '.';
import type { UpdateGlobal } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export const updateGlobal: UpdateGlobal = async function updateGlobal(this: MongooseAdapter,
  { slug, data }) {
  const Model = this.globals;

  let result;
  result = await Model.findOneAndUpdate(
    { globalType: slug },
    data,
    { new: true },
  );

  result = result.toJSON({ virtuals: true });

  // custom id type reset
  result.id = result._id;
  result = JSON.parse(JSON.stringify(result));
  result = sanitizeInternalFields(result);


  return result;
};
