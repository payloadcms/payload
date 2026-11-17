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
  const claimedIDs: unknown[] = []
  const isJobClaim =
    data.processing === true &&
    Object.keys(data).every((field) => field === 'processing' || field === 'updatedAt')

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
    } else if (limit === 1) {
      /**
       * Select, update, and return one job atomically in a single database call.
       * We can only do this with limit === 1, which can be expressed as findOne.
       */
      const doc = await Model.findOneAndUpdate(query, updateData, {
        ...findOptions,
        projection: returning === false ? { _id: 1 } : undefined,
        sort,
      })

      if (returning === false) {
        return null
      }

      result = doc ? [doc] : []
    } else {
      const hasLimit = typeof limit === 'number' && limit > 0

      if (!hasLimit && returning === false) {
        await Model.updateMany(query, updateData, baseOptions)

        return null
      }

      const candidates = await Model.find(
        query,
        {},
        { ...findOptions, limit: hasLimit ? limit : undefined, projection: { _id: 1 }, sort },
      )

      /**
       * Update each candidate with a conditional findOneAndUpdate that re-checks the original query.
       * A job that another runner modified since it was selected (e.g. claimed it by setting
       * `processing: true`) no longer matches and is skipped, so only the documents this call
       * actually updated are returned. Reading back by the candidate IDs would return jobs claimed
       * by other runners, and reading back by the original query would miss the jobs this call claimed.
       */
      for (const candidate of candidates) {
        const doc = await Model.findOneAndUpdate(
          { $and: [query, { _id: candidate._id }] },
          updateData,
          {
            ...findOptions,
            projection: returning === false ? { _id: 1 } : undefined,
          },
        )

        if (doc) {
          result.push(doc)
          if (isJobClaim) {
            claimedIDs.push(candidate._id)
          }
        }
      }

      // Losing every candidate does not mean the queue is empty. Select again
      // so jobs beyond this batch remain available to this runner.
      if (isJobClaim && candidates.length && !result.length) {
        return updateJobs.call(this, { data, limit, req, returning, sort: sortArg, where })
      }

      if (returning === false) {
        return null
      }
    }
  } catch (error) {
    // Earlier per-document claims have not been returned to a runner yet. Release
    // those known winners if a later write fails, so the batch can be retried.
    // A caller-supplied transaction owns its rollback instead.
    if (claimedIDs.length && !baseOptions.session) {
      try {
        await Model.updateMany(
          { _id: { $in: claimedIDs }, processing: true },
          { $set: { processing: false } },
          baseOptions,
        )
      } catch (releaseError) {
        this.payload.logger.error({
          err: releaseError,
          msg: 'Failed to release partial job claims',
        })
      }
    }
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
