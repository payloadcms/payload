import type { QueryOptions, UpdateQuery } from 'mongoose'
import type { UpdateOne } from 'payload'

import { applyBranchIDProjection, resolveBranchRowID, withBranchIDSelect } from 'payload'

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
    branch,
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

  if (id !== undefined && id !== null) {
    id = await resolveBranchRowID({ id, branch, collectionSlug, req })
  }

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
  if (Object.keys(updateOps).length) {
    updateOps.$set = updateData
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
    // Mongoose 9 deprecated `new`, and the warning it logs fails any e2e test that saves.
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: collectionConfig.flattenedFields,
      select: withBranchIDSelect({ branch, collectionSlug, req, select }),
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

  // The row written on a branch is the shadow row, so the document it returns
  // carries that row's primary key rather than the document's canonical ID.
  applyBranchIDProjection({
    branch,
    collectionSlug,
    docs: [result as Record<string, unknown>],
    req,
  })

  return result
}
