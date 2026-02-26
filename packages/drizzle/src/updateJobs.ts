import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { UpdateJobs, Where } from 'payload'

import { and, eq, inArray } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { upsertRow } from './upsertRow/index.js'
import { shouldUseOptimizedUpsertRow } from './upsertRow/shouldUseOptimizedUpsertRow.js'
import { getTransaction } from './utilities/getTransaction.js'

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
    const db = await getTransaction(this, req)

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

  const db = await getTransaction(this, req)

  const results = []

  // TODO: We need to batch this to reduce the amount of db calls. This can get very slow if we are updating a lot of rows.
  // PostgreSQL MVCC fix: prevent multiple workers from claiming the same jobs
  // Uses atomic UPDATE ... WHERE processing = false to ensure exclusivity
  if (this.name === 'postgres' && data.processing === true && !id && jobs.docs.length > 0) {
    const jobIds = jobs.docs.map((job: any) => job.id)
    const table = this.tables[tableName]
    const pgDb = db as NodePgDatabase

    try {
      // Atomic update with WHERE clause ensures only unclaimed jobs are updated
      const atomicResults = await pgDb
        .update(table)
        .set(data)
        .where(and(inArray(table.id, jobIds), eq(table.processing, false)))
        .returning()

      if (atomicResults && atomicResults.length > 0) {
        // Preserve original ordering
        const resultMap = new Map(atomicResults.map((r: any) => [r.id, r]))
        const orderedResults = jobIds.map((id: any) => resultMap.get(id)).filter(Boolean)
        return orderedResults
      }
      return []
    } catch (_error) {
      // Fall back to original logic
    }
  }

  // Original logic for non-PostgreSQL or non-processing updates
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
