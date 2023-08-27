import { ValidationError } from '@alessiogr/payloadtest/errors';
import type { PayloadRequest } from '@alessiogr/payloadtest/types';
import type { UpdateOne } from '@alessiogr/payloadtest/database';
import { i18nInit } from '@alessiogr/payloadtest/utilities';
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js';
import type { MongooseAdapter } from './index.js';
import { withSession } from './withSession.js';

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  { collection, data, where: whereArg, id, locale, req = {} as PayloadRequest },
) {
  const where = id ? { id: { equals: id } } : whereArg;
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
    result = await Model.findOneAndUpdate(query, data, options);
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
