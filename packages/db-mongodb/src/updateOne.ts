import type { UpdateOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { ValidationError } from 'payload/errors'
import { i18nInit } from 'payload/utilities'

import type { MongooseAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  { collection, data, id, locale, req = {} as PayloadRequest, where: whereArg },
) {
  const where = id ? { id: { equals: id } } : whereArg
  const Model = this.collections[collection]
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
    new: true,
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  let result
  try {
    result = await Model.findOneAndUpdate(query, data, options)
  } catch (error) {
    // Handle uniqueness error from MongoDB
    throw error.code === 11000 && error.keyValue
      ? new ValidationError(
          [
            {
              field: Object.keys(error.keyValue)[0],
              message: 'Value must be unique',
            },
          ],
          req?.t ?? i18nInit(this.payload.config.i18n).t,
        )
      : error
  }

  result = JSON.parse(JSON.stringify(result))
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
