import type { QueryOptions, UpdateQuery } from 'mongoose'
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

  const query = await buildQuery({
    adapter: this,
    collectionSlug,
    fields: collectionConfig.flattenedFields,
    locale,
    where,
  })

  let result

  let updateData: UpdateQuery<any> = data

  const $inc: Record<string, number> = {}
  const $push: Record<string, { $each: any[] } | any> = {}
  const $addToSet: Record<string, { $each: any[] } | any> = {}
  const $pull: Record<string, { $in: any[] } | any> = {}

  transform({
    $addToSet,
    $inc,
    $pull,
    $push,
    adapter: this,
    data,
    fields,
    operation: 'write',
  })

  const updateOps: UpdateQuery<any> = {}

  if (Object.keys($inc).length) {
    updateOps.$inc = $inc
  }
  if (Object.keys($push).length) {
    updateOps.$push = $push
  }
  if (Object.keys($addToSet).length) {
    updateOps.$addToSet = $addToSet
  }
  if (Object.keys($pull).length) {
    updateOps.$pull = $pull
  }
  // Raw operators can write createdAt too (e.g. `$set: { createdAt }`), and MongoDB rejects
  // an update that writes the same path twice
  const writesCreatedAt =
    typeof data.createdAt !== 'undefined' ||
    Object.entries(data).some(
      ([key, value]) =>
        key.startsWith('$') && typeof value === 'object' && value !== null && 'createdAt' in value,
    )

  // Mongoose timestamps are disabled below, so an upsert that inserts would get no createdAt.
  // $setOnInsert only applies on insert, so a matched document keeps its createdAt.
  if (optionsArgs.upsert && collectionConfig.timestamps !== false && !writesCreatedAt) {
    updateOps.$setOnInsert = { createdAt: new Date().toISOString() }
  }
  if (Object.keys(updateOps).length) {
    // Raw operators passed in data (e.g. `$inc`, `$unset`) must stay at the top level,
    // Mongoose drops them when they're nested in `$set`
    const $set: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(updateData)) {
      if (key.startsWith('$')) {
        updateOps[key] = { ...updateOps[key], ...value }
      } else {
        $set[key] = value
      }
    }

    if (Object.keys($set).length) {
      updateOps.$set = { ...updateOps.$set, ...$set }
    }

    updateData = updateOps
  }

  const baseOptions = {
    ...optionsArgs,
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  } satisfies QueryOptions

  const findOptions: QueryOptions = {
    ...baseOptions,
    lean: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: collectionConfig.flattenedFields,
      select,
    }),
    returnDocument: 'after',
  }

  try {
    if (returning === false) {
      await Model.updateOne(query, updateData, baseOptions)
      transform({ adapter: this, data, fields, operation: 'read' })
      return null
    } else {
      result = await Model.findOneAndUpdate(query, updateData, findOptions)
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
