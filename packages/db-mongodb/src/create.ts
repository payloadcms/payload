import type { Create } from 'payload/database'
import type { Document, PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from '.'

import { withSession } from './withSession'
import { ValidationError } from 'payload/errors'
import { i18nInit } from 'payload/utilities'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection, data, req = {} as PayloadRequest },
) {
  const Model = this.collections[collection]
  const options = withSession(this, req.transactionID)
  let doc
  try {
    ;[doc] = await Model.create([data], options)
  } catch (error) {
    // Handle uniqueness error from MongoDB
    throw error.code === 11000 && error.keyValue
      ? new ValidationError(
          [
            {
              field: Object.keys(error.keyValue)[0],
              message: req.t('error:valueMustBeUnique'),
            },
          ],
          req?.t ?? i18nInit(this.payload.config.i18n).t,
        )
      : error
  }

  // doc.toJSON does not do stuff like converting ObjectIds to string, or date strings to date objects. That's why we use JSON.parse/stringify here
  const result: Document = JSON.parse(JSON.stringify(doc))
  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id
  if (verificationToken) {
    result._verificationToken = verificationToken
  }

  return result
}
