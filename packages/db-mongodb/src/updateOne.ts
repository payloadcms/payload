import type { MongooseUpdateQueryOptions, UpdateQuery } from 'mongoose'
import type { UpdateOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  {
    id,
    collection: collectionSlug,
    data,
    locale,
    options: optionsArgs = {},
    req,
    returning,
    select,
    where: whereArg = {},
  },
) {
  const { collectionConfig, Model } = getCollection({ adapter: this, collectionSlug })
  const where = id ? { id: { equals: id } } : whereArg
  const fields = collectionConfig.fields

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

  let result

  const $inc: Record<string, number> = {}
  let updateData: UpdateQuery<any> = data
  transform({ $inc, adapter: this, data, fields, operation: 'write' })
  if (Object.keys($inc).length) {
    updateData = { $inc, $set: updateData }
  }

  try {
    if (returning === false) {
      await Model.updateOne(query, updateData, options)
      transform({ adapter: this, data, fields, operation: 'read' })
      return null
    } else {
      result = await Model.findOneAndUpdate(query, updateData, options)
    }
  } catch (error) {
    handleError({ collection: collectionSlug, error, req })
  }

  if (!result) {
    return null
  }

  transform({ adapter: this, data: result, fields, operation: 'read' })

  return result
}
