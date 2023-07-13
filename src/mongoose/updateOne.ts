import type { MongooseAdapter } from '.';
import type { UpdateOne } from '../database/types';
import { ValidationError } from '../errors';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import i18nInit from '../translations/init';
import { withSession } from './withSession';

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  { collection, data, where, locale, transactionID },
) {
  const Model = this.collections[collection];
  const options = {
    ...withSession(this, transactionID),
    new: true,
    lean: true,
  };

  const query = await Model.buildQuery({
    payload: this.payload,
    locale,
    where,
  });

  let result;
  try {
    result = await Model.findOneAndUpdate(query, data, options).lean();
  } catch (error) {
    // Handle uniqueness error from MongoDB
    throw error.code === 11000 && error.keyValue
      ? new ValidationError(
        [
          {
            message: 'Value must be unique',
            field: Object.keys(error.keyValue)[0],
          },
        ],
        i18nInit(this.payload.config.i18n).t,
      )
      : error;
  }

  result = JSON.parse(JSON.stringify(result));
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
