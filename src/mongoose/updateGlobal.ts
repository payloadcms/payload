import type { MongooseAdapter } from '.';
import type { UpdateGlobal } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export const updateGlobal: UpdateGlobal = async function updateGlobal(this: MongooseAdapter,
  { slug, data }) {
  const Model = this.globals;
  const withSession = this.session ? { session: this.session } : {};

  let result;
  result = await Model.findOneAndUpdate(
    { globalType: slug },
    data,
    {
      ...withSession,
      new: true,
      lean: true,
    },
  ).lean();

  result = JSON.parse(JSON.stringify(result));

  // custom id type reset
  result.id = result._id;
  result = sanitizeInternalFields(result);


  return result;
};
