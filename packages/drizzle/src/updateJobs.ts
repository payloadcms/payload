import type { UpdateJobs, Where } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export const updateJobs: UpdateJobs = async function updateMany(
  this: DrizzleAdapter,
  { id, data, limit: limitArg, req, returning, sort: sortArg, where: whereArg },
) {
  if (!(data?.log as object[])?.length) {
    delete data.log
  }
  const whereToUse: Where = id ? { id: { equals: id } } : whereArg
  const limit = id ? 1 : limitArg

  const db = await getTransaction(this, req)
  const collection = this.payload.collections['payload-jobs'].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collection.defaultSort

  const jobs = await findMany({
    adapter: this,
    collectionSlug: 'payload-jobs',
    fields: collection.flattenedFields,
    limit: id ? 1 : limit,
    pagination: false,
    req,
    sort,
    tableName,
    where: whereToUse,
  })
  if (!jobs.docs.length) {
    return []
  }

  const results = []

  // TODO: We need to batch this to reduce the amount of db calls. This can get very slow if we are updating a lot of rows.
  for (const job of jobs.docs) {
    const updateData = {
      ...job,
      ...data,
    }

    const result = await upsertRow({
      id: job.id,
      adapter: this,
      data: updateData,
      db,
      fields: collection.flattenedFields,
      ignoreResult: returning === false,
      operation: 'update',
      req,
      tableName,
    })

    results.push(result)
  }

  if (returning === false) {
    return null
  }

  return results
}
