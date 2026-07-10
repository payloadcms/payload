import type { Create } from 'payload'

import { type CreateOptions, Schema, Types } from 'mongoose'

import type { MongooseAdapter } from './index.js'

import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection: collectionSlug, data, req, returning },
) {
  const { collectionConfig, customIDType, Model } = getCollection({ adapter: this, collectionSlug })

  let doc

  if (!data.createdAt) {
    data.createdAt = new Date().toISOString()
  }

  transform({
    adapter: this,
    data,
    fields: collectionConfig.fields,
    operation: 'write',
  })

  if (customIDType) {
    data._id = data.id
  } else if (this.allowIDOnCreate && data.id) {
    // With a non-ObjectId adapter-wide `idType` (e.g. UUID), pass the value through and
    // let Mongoose cast it to the schema's `_id` type.
    if (this.idType && this.idType !== Schema.Types.ObjectId) {
      data._id = data.id
    } else {
      try {
        data._id = new Types.ObjectId(data.id as string)
      } catch (error) {
        this.payload.logger.error(
          `It appears you passed ID to create operation data but it cannot be sanitized to ObjectID, value - ${JSON.stringify(data.id)}`,
        )
        throw error
      }
    }
  }

  const options: CreateOptions = {
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  }

  try {
    ;[doc] = await Model.create([data], options)
  } catch (error) {
    handleError({ collection: collectionSlug, error, req })
  }
  if (returning === false) {
    return null
  }

  doc = doc.toObject()

  transform({
    adapter: this,
    data: doc,
    fields: collectionConfig.fields,
    operation: 'read',
  })

  return doc
}
