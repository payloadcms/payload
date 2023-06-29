import type { MongooseAdapter } from '.';
import type { UpdateOne } from '../database/types';
import { ValidationError } from '../errors';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export const updateOne: UpdateOne = async function updateOne(this: MongooseAdapter,
  { collection, data, where, locale, req }) {
  const Model = this.collections[collection].model;

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
      { new: true, lean: true },
    ).lean();
  } catch (error) {
    // Handle uniqueness error from MongoDB
    throw error.code === 11000 && error.keyValue
      ? new ValidationError([{
        message: 'Value must be unique',
        field: Object.keys(error.keyValue)[0],
      }], req?.t ?? this.payload.config.initializedi18n.t)
      : error;
  }

  result = JSON.parse(JSON.stringify(result));
  result.id = result._id;
  result = sanitizeInternalFields(result);


  return result;
};
