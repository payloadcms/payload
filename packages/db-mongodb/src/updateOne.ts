import type { QueryOptions } from 'mongoose'
import type { UpdateOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  { id, collection, data, locale, options: optionsArgs = {}, req, select, where: whereArg },
) {
  const where = id ? { id: { equals: id } } : whereArg
  const Model = this.collections[collection]
  const fields = this.payload.collections[collection].config.fields
  const options: QueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: this.payload.collections[collection].config.flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    collectionSlug: collection,
    fields: this.payload.collections[collection].config.flattenedFields,
    locale,
    where,
  })

  let result

  transform({ adapter: this, data, fields, operation: 'write' })

  try {
    result = await Model.findOneAndUpdate(query, data, options)
  } catch (error) {
    handleError({ collection, error, req })
  }

  if (!result) {
    return null
  }

  transform({ adapter: this, data: result, fields, operation: 'read' })

  return result
}
