import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SQLiteSelect } from 'drizzle-orm/sqlite-core'
import type { UpdateJobs, Where } from 'payload'

import { and, eq, exists, sql } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { buildQuery } from './queries/buildQuery.js'
import { transformForWrite } from './transform/write/index.js'
import { upsertRow } from './upsertRow/index.js'
import { shouldUseOptimizedUpsertRow } from './upsertRow/shouldUseOptimizedUpsertRow.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'
import { markWrite } from './utilities/readAfterWrite.js'

/**
 * A job claim only sets `processing: true` (and the `updatedAt` timestamp). Claims are written with a
 * single conditional `UPDATE ... WHERE processing = false RETURNING id`, so when multiple runners select
 * the same candidate jobs, only the runner whose update actually changed a row receives that job.
 */
const isJobClaim = (data: Record<string, unknown>): boolean =>
  data.processing === true &&
  Object.keys(data).every((field) => field === 'processing' || field === 'updatedAt')

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

  // Candidate reads and winner reads belong to this write, even with read replicas.
  const db = getPrimaryDb(this, await getTransaction(this, req))
  const jobAdapter = { ...this, drizzle: db } as DrizzleAdapter
  const jobs = await findMany({
    adapter: jobAdapter,
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

  if (isJobClaim(data)) {
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
    // Use the adapter's validated ID predicate builder, which also handles D1's
    // bound-parameter limit for large batches.
    const { where: candidateWhere } = buildQuery({
      adapter: this,
      fields: collection.flattenedFields,
      tableName,
      where: { id: { in: jobIDs } },
    })
    const { joins, where: claimWhere } = buildQuery({
      adapter: this,
      fields: collection.flattenedFields,
      tableName,
      where: whereToUse,
    })
    let claimCondition = claimWhere
    if (joins.length) {
      // Do not select the jobs table again inside this subquery: that would read
      // its old statement snapshot after a PostgreSQL row-lock wait. Base-field
      // references must stay correlated to the UPDATE's current tuple. Keeping
      // all joins together also preserves conditions on the same related row.
      let joinedClaimQuery: SQLiteSelect = _db
        .select({ value: sql<number>`1` })
        .from(sql`(select 1) as ${sql.identifier('job_claim')}`)
        .$dynamic()

      for (const join of joins) {
        joinedClaimQuery = joinedClaimQuery[join.type ?? 'leftJoin'](join.table, join.condition)
      }
      claimCondition = exists(joinedClaimQuery.where(claimWhere))
    }
    const claimedRows = await _db
      .update(table)
      .set(row)
      .where(and(candidateWhere, eq(table.processing, false), claimCondition))
      .returning({ id: table.id })

    if (claimedRows.length) {
      markWrite(this)
    }

    if (returning === false) {
      return null
    }

    if (!claimedRows.length) {
      return []
    }

    // Return the current job and related data, rather than the candidate snapshot.
    let claimedJobs: Awaited<ReturnType<typeof findMany>>
    try {
      claimedJobs = await findMany({
        adapter: jobAdapter,
        collectionSlug: 'payload-jobs',
        fields: collection.flattenedFields,
        limit: claimedRows.length,
        pagination: false,
        req,
        tableName,
        where: { id: { in: claimedRows.map(({ id }) => id) } },
      })
    } catch (error) {
      // Transactional callers roll back the claim. SQLite/D1 may run without
      // transactions, so release known winners that were never returned to a runner.
      if (!req?.transactionID) {
        try {
          await _db
            .update(table)
            .set({ processing: false })
            .where(
              and(
                buildQuery({
                  adapter: this,
                  fields: collection.flattenedFields,
                  tableName,
                  where: { id: { in: claimedRows.map(({ id }) => id) } },
                }).where,
                eq(table.processing, true),
              ),
            )
          markWrite(this)
        } catch (releaseError) {
          this.payload.logger.error({
            err: releaseError,
            msg: 'Failed to release unread job claims',
          })
        }
      }
      throw error
    }
    const claimOrder = new Map<number | string, number>(jobIDs.map((id, index) => [id, index]))
    return claimedJobs.docs.sort(
      (a, b) => (claimOrder.get(a.id) ?? 0) - (claimOrder.get(b.id) ?? 0),
    )
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
