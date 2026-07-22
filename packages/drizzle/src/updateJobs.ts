import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { UpdateJobs, Where } from 'payload'

import { and, inArray, isNull } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { transformForWrite } from './transform/write/index.js'
import { upsertRow } from './upsertRow/index.js'
import { shouldUseOptimizedUpsertRow } from './upsertRow/shouldUseOptimizedUpsertRow.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'
import { markWrite } from './utilities/readAfterWrite.js'

const isInitialJobClaim = (data: Record<string, unknown>): boolean =>
  typeof data.processingToken === 'string' &&
  typeof data.processingUntil === 'string' &&
  Object.keys(data).every(
    (field) => field === 'processingToken' || field === 'processingUntil' || field === 'updatedAt',
  )

export const updateJobs: UpdateJobs = async function updateMany(
  this: DrizzleAdapter,
  { id, data, limit: limitArg, req, returning, sort: sortArg, where: whereArg },
) {
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

  if (useOptimizedUpsertRow && id) {
    const db = getPrimaryDb(this, await getTransaction(this, req))

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

    return returning === false ? null : [result]
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
  if (!jobs.docs.length) {
    return []
  }

  const db = getPrimaryDb(this, await getTransaction(this, req))

  if (typeof limit === 'number' && isInitialJobClaim(data)) {
    const _db = db as LibSQLDatabase
    const table = this.tables[tableName]
    const { row } = transformForWrite({
      adapter: this,
      data,
      enableAtomicWrites: true,
      fields: collection.flattenedFields,
      tableName,
    })

    if (typeof row.updatedAt === 'undefined' || row.updatedAt === null) {
      delete row.updatedAt
    }

    const jobIDs = jobs.docs.map((job) => job.id)
    const claimedRows = await _db
      .update(table)
      .set(row)
      .where(and(inArray(table.id, jobIDs), isNull(table.processingUntil)))
      .returning({ id: table.id })

    if (claimedRows.length) {
      markWrite(this)
    }

    if (returning === false) {
      return null
    }

    const claimedIDs = new Set(claimedRows.map(({ id }) => id))
    return jobs.docs.filter((job) => claimedIDs.has(job.id)).map((job) => ({ ...job, ...data }))
  }

  const results = []

  // TODO: We need to batch this to reduce the amount of db calls. This can get very slow if we are updating a lot of rows.
  for (const job of jobs.docs) {
    const updateData = useOptimizedUpsertRow
      ? data
      : {
          ...job,
          ...data,
        }

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

    results.push(result)
  }

  if (returning === false) {
    return null
  }

  return results
}
