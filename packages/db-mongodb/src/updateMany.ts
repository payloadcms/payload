import type { MongooseUpdateQueryOptions } from 'mongoose'
import type { UpdateMany } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const updateMany: UpdateMany = async function updateMany(
  this: MongooseAdapter,
  {
    collection: collectionSlug,
    data,
    locale,
    options: optionsArgs = {},
    req,
    returning,
    select,
    where,
  },
) {
  const { collectionConfig, Model } = getCollection({ adapter: this, collectionSlug })

  const options: MongooseUpdateQueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: collectionConfig.flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    collectionSlug,
    fields: collectionConfig.flattenedFields,
    locale,
    where,
  })

  transform({ adapter: this, data, fields: collectionConfig.fields, operation: 'write' })

  try {
    await Model.updateMany(query, data, options)
  } catch (error) {
    handleError({ collection: collectionSlug, error, req })
  }

  if (returning === false) {
    return null
  }

  const result = await Model.find(query, {}, options)

  transform({
    adapter: this,
    data: result,
    fields: collectionConfig.fields,
    operation: 'read',
  })

  return result
}
