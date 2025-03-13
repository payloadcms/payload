import type { CreateOptions } from 'mongoose'
import type { Create } from 'payload'

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

  const options: CreateOptions = {
    session: await getSession(this, req),
  }

  let doc

  transform({
    adapter: this,
    data,
    fields: collectionConfig.fields,
    operation: 'write',
  })

  if (customIDType) {
    data._id = data.id
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
