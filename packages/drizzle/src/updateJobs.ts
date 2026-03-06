import type { UpdateJobs, Where } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { upsertRow } from './upsertRow/index.js'
import { shouldUseOptimizedUpsertRow } from './upsertRow/shouldUseOptimizedUpsertRow.js'
import { getTransaction } from './utilities/getTransaction.js'

export const updateJobs: UpdateJobs = async function updateMany(
  this: DrizzleAdapter,
  { id, data, debugID, limit: limitArg, req, returning, sort: sortArg, where: whereArg },
) {
  const prefix = debugID ? `[${debugID}] drizzle.updateJobs` : null
  const t0 = prefix ? Date.now() : 0

  if (prefix) {
    console.log(`${prefix} - enter`, { id, limit: limitArg, returning, sort: sortArg })
  }

  if (
    !(data?.log as object[])?.length &&
    !(data.log && typeof data.log === 'object' && '$push' in data.log)
  ) {
    delete data.log
  }

  const whereToUse: Where = id ? { id: { equals: id } } : whereArg
  const limit = id ? 1 : limitArg

  const collection = this.payload.collections['payload-jobs'].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collection.defaultSort

  const useOptimizedUpsertRow = shouldUseOptimizedUpsertRow({
    data,
    fields: collection.flattenedFields,
  })

  if (prefix) {
    console.log(
      `${prefix} - useOptimizedUpsertRow: ${useOptimizedUpsertRow}, tableName: ${tableName}`,
    )
  }

  if (useOptimizedUpsertRow && id) {
    let ts = Date.now()
    const db = await getTransaction(this, req)
    if (prefix) {
      console.log(`${prefix} - getTransaction (optimized path) took ${Date.now() - ts}ms`)
    }

    ts = Date.now()
    const result = await upsertRow({
      id,
      adapter: this,
      collectionSlug: 'payload-jobs',
      data,
      db,
      fields: collection.flattenedFields,
      ignoreResult: returning === false,
      operation: 'update',
      req,
      tableName,
    })
    if (prefix) {
      console.log(
        `${prefix} - upsertRow (optimized, single) took ${Date.now() - ts}ms, total ${Date.now() - t0}ms`,
      )
    }

    return returning === false ? null : [result]
  }

  let ts = prefix ? Date.now() : 0
  if (prefix) {
    console.log(`${prefix} - calling findMany`, { limit: id ? 1 : limit, sort, where: whereToUse })
  }
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
  if (prefix) {
    console.log(`${prefix} - findMany took ${Date.now() - ts}ms, found ${jobs.docs.length} docs`)
  }
  if (!jobs.docs.length) {
    if (prefix) {
      console.log(`${prefix} - no docs found, returning [], total ${Date.now() - t0}ms`)
    }
    return []
  }

  ts = prefix ? Date.now() : 0
  const db = await getTransaction(this, req)
  if (prefix) {
    console.log(`${prefix} - getTransaction took ${Date.now() - ts}ms`)
  }

  const results = []

  for (let i = 0; i < jobs.docs.length; i++) {
    const job = jobs.docs[i]
    const updateData = useOptimizedUpsertRow
      ? data
      : {
          ...job,
          ...data,
        }

    ts = prefix ? Date.now() : 0
    const result = await upsertRow({
      id: job.id,
      adapter: this,
      collectionSlug: 'payload-jobs',
      data: updateData,
      db,
      fields: collection.flattenedFields,
      ignoreResult: returning === false,
      operation: 'update',
      req,
      tableName,
    })
    if (prefix) {
      console.log(
        `${prefix} - upsertRow [${i + 1}/${jobs.docs.length}] id=${job.id} took ${Date.now() - ts}ms`,
      )
    }

    results.push(result)
  }

  if (prefix) {
    console.log(`${prefix} - all upserts done, total ${Date.now() - t0}ms`)
  }

  if (returning === false) {
    return null
  }

  return results
}
