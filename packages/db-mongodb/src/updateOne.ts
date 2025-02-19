import type { QueryOptions } from 'mongoose'
import type { UpdateOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'

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

  const sanitizedData = sanitizeRelationshipIDs({
    config: this.payload.config,
    data,
    fields,
  })

  try {
    result = await Model.findOneAndUpdate(query, sanitizedData, options)
  } catch (error) {
    handleError({ collection, error, req })
  }

  if (!result) {
    return null
  }

  result = JSON.parse(JSON.stringify(result))
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
