import type { MongooseAdapter } from '.';
import type { UpdateOne } from '../database/types';
import { ValidationError } from '../errors';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import i18nInit from '../translations/init';

export const updateOne: UpdateOne = async function updateOne(this: MongooseAdapter,
  { collection, data, where, locale }) {
  const Model = this.collections[collection];

  const query = await Model.buildQuery({
    payload: this.payload,
    locale,
    where,
  });

  let result;
  try {
    result = await Model.findOneAndUpdate(
      query,
      data,
      { new: true },
    );
  } catch (error) {
    // Handle uniqueness error from MongoDB
    throw error.code === 11000 && error.keyValue
      ? new ValidationError([{
        message: 'Value must be unique',
        field: Object.keys(error.keyValue)[0],
      }], i18nInit(this.payload.config.i18n).t)
      : error;
  }

  result = JSON.parse(JSON.stringify(result));
  result.id = result._id as string | number;
  result = sanitizeInternalFields(result);


  return result;
};
