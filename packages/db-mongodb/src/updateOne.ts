import { ValidationError } from 'payload/errors';
import type { PayloadRequest } from 'payload/types';
import type { UpdateOne } from 'payload/dist/database/types';
import sanitizeInternalFields from 'payload/dist/utilities/sanitizeInternalFields';
import i18nInit from 'payload/dist/translations/init';
import type { MongooseAdapter } from '.';
import { withSession } from './withSession';

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  { collection, data, where, locale, req = {} as PayloadRequest },
) {
  const Model = this.collections[collection];
  const options = {
    ...withSession(this, req.transactionID),
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
        req?.t ?? i18nInit(this.payload.config.i18n).t,
      )
      : error;
  }

  result = JSON.parse(JSON.stringify(result));
  result.id = result._id;
  result = sanitizeInternalFields(result);

  return result;
};
