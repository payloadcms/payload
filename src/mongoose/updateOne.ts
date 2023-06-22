import { t } from 'i18next';
import type { MongooseAdapter } from '.';
import type { UpdateOneArgs } from '../database/types';
import { ValidationError } from '../errors';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export async function updateOne<T = unknown>(
  this: MongooseAdapter,
  { collection, data, id, locale }: UpdateOneArgs,
): Promise<T> {
  const Model = this.collections[collection];

  let result;
  try {
    result = await Model.findByIdAndUpdate(
      { _id: id, locale },
      data,
      { new: true },
    );
  } catch (error) {
    // Handle uniqueness error from MongoDB
    throw error.code === 11000 && error.keyValue
      ? new ValidationError([{
        message: 'Value must be unique',
        field: Object.keys(error.keyValue)[0],
      }], t)
      : error;
  }

  result = JSON.parse(JSON.stringify(result));
  result.id = result._id as string | number;
  result = sanitizeInternalFields(result);


  return result;
}
