import type { QueryOptions, UpdateQuery } from 'mongoose'
import type { Job, UpdateJobs, Where } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const updateJobs: UpdateJobs = async function updateMany(
  this: MongooseAdapter,
  { id, data, limit, req, returning, sort: sortArg, where: whereArg },
) {
  if (
    !(data?.log as object[])?.length &&
    !(data.log && typeof data.log === 'object' && '$push' in data.log)
  ) {
    delete data.log
  }

  const where = id ? { id: { equals: id } } : (whereArg as Where)

  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug: 'payload-jobs',
  })

  const sort: Record<string, unknown> | undefined = buildSortParam({
    adapter: this,
    config: this.payload.config,
    fields: collectionConfig.flattenedFields,
    sort: sortArg || collectionConfig.defaultSort,
    timestamps: true,
  })

  const query = await buildQuery({
    adapter: this,
    collectionSlug: collectionConfig.slug,
    fields: collectionConfig.flattenedFields,
    where,
  })

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
    fields: collectionConfig.fields,
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
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  } satisfies QueryOptions

  const findOptions: QueryOptions = {
    ...baseOptions,
    lean: true,
    new: true,
  }

  let result: Job[] = []

  try {
    if (id) {
      if (returning === false) {
        await Model.updateOne(query, updateData, baseOptions)
        transform({ adapter: this, data, fields: collectionConfig.fields, operation: 'read' })

        return null
      } else {
        const doc = await Model.findOneAndUpdate(query, updateData, findOptions)
        result = doc ? [doc] : []
      }
    } else if (typeof limit === 'number' && limit > 0) {
      const candidates = await Model.find(
        query,
        {},
        { ...findOptions, limit, projection: { _id: 1 }, sort },
      )

      if (candidates.length === 0) {
        return null
      }

      const candidateIDs = candidates.map((candidate) => candidate._id)

      if (typeof data.processingToken === 'string') {
        /**
         * `processingToken` identifies this claim update. `processing: true` cannot, because every
         * worker writes the same value. The token lets us reliably find the jobs this update won.
         */
        const claimQuery = {
          $and: [query, { _id: { $in: candidateIDs } }],
        }

        await Model.updateMany(claimQuery, updateData, baseOptions)

        if (returning === false) {
          return null
        }

        const claimedJobsQuery = {
          _id: { $in: candidateIDs },
          processingToken: { $eq: data.processingToken },
        }

        result = await Model.find(claimedJobsQuery, {}, { ...findOptions, sort })
      } else {
        const limitedUpdateQuery = { _id: { $in: candidateIDs } }

        await Model.updateMany(limitedUpdateQuery, updateData, baseOptions)

        if (returning === false) {
          return null
        }

        result = await Model.find(limitedUpdateQuery, {}, { ...findOptions, sort })
      }
    } else {
      await Model.updateMany(query, updateData, baseOptions)

      if (returning === false) {
        return null
      }

      result = await Model.find(query, {}, { ...findOptions, sort })
    }
  } catch (error) {
    handleError({ collection: collectionConfig.slug, error, req })
  }

  transform({
    adapter: this,
    data: result,
    fields: collectionConfig.fields,
    operation: 'read',
  })

  return result
}
