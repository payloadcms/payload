import type { UpdateJobs, Where } from 'payload'

import { and, eq, inArray, sql } from 'drizzle-orm'
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
  // Drizzle's Postgres and SQLite query builders expose the same methods used below, but their
  // union type does not expose a callable shared signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drizzle = db as any
  const table = this.tables[tableName]
  const { joins, where: parsedWhere } = buildQuery({
    adapter: this,
    fields: collection.flattenedFields,
    tableName,
    where: whereToUse,
  })

  const changedIDs: (number | string)[] = []

  // TODO: We need to batch this to reduce the amount of db calls. This can get very slow if we are updating a lot of rows.
  for (const job of jobs.docs) {
    const transformedData = transformForWrite({
      adapter: this,
      data,
      enableAtomicWrites: true,
      fields: collection.flattenedFields,
      tableName,
    })
    const row = transformedData.row

    if (typeof row.updatedAt === 'undefined' || row.updatedAt === null) {
      delete row.updatedAt
    }

    let conditionalWhere = and(eq(table.id, job.id), parsedWhere)

    if (joins.length) {
      let matchingJobsQuery = drizzle.select({ id: table.id }).from(table).$dynamic()

      if (parsedWhere) {
        matchingJobsQuery = matchingJobsQuery.where(parsedWhere)
      }
      for (const { type, condition, table: joinTable } of joins) {
        matchingJobsQuery = matchingJobsQuery[type ?? 'leftJoin'](joinTable, condition)
      }
      if (this.name === 'postgres') {
        matchingJobsQuery = matchingJobsQuery.for('update', { of: table, skipLocked: true })
      }

      conditionalWhere = and(eq(table.id, job.id), inArray(table.id, matchingJobsQuery))
    }

    const hasArrayRowsToPush = Object.values(transformedData.arraysToPush).some(
      (rows) => rows.length > 0,
    )

    if (!useOptimizedUpsertRow) {
      throw new Error('Atomic nested job updates only support appending to the job log')
    }

    let didInsertArrayRows = false

    if (hasArrayRowsToPush) {
      didInsertArrayRows = true

      for (const [arrayTableName, arrayRows] of Object.entries(transformedData.arraysToPush)) {
        const arrayTable = this.tables[arrayTableName]

        for (const arrayRow of arrayRows) {
          const insertRow = { ...arrayRow.row, _parentID: job.id }
          const entries = Object.entries(insertRow).filter(
            ([key, value]) => typeof value !== 'undefined' && arrayTable[key],
          )

          if (!entries.length) {
            throw new Error('Cannot append an empty job log entry')
          }

          const columns = sql.join(
            entries.map(([key]) => sql.identifier(arrayTable[key].name)),
            sql`, `,
          )
          const values = sql.join(
            entries.map(([key, value]) => sql.param(value, arrayTable[key])),
            sql`, `,
          )
          const lockClause = this.name === 'postgres' ? sql` FOR UPDATE SKIP LOCKED` : sql.empty()
          const insertResult = (await this.execute({
            db,
            sql: sql`
              WITH owned_job AS (
                SELECT ${table.id}
                FROM ${table}
                WHERE ${conditionalWhere}${lockClause}
              )
              INSERT INTO ${arrayTable} (${columns})
              SELECT ${values}
              FROM owned_job
              RETURNING ${sql.identifier(arrayTable._parentID.name)}
            `,
          })) as { rows?: unknown[] }

          if (!insertResult.rows?.length) {
            didInsertArrayRows = false
            break
          }
        }

        if (!didInsertArrayRows) {
          break
        }
      }
    }

    if (hasArrayRowsToPush && !didInsertArrayRows) {
      continue
    }

    let didUpdateRow = false
    if (Object.keys(row).length > 0) {
      const updatedRows = await drizzle
        .update(table)
        .set(row)
        .where(conditionalWhere)
        .returning({ id: table.id })

      didUpdateRow = updatedRows.length > 0
    }

    if (didInsertArrayRows || didUpdateRow) {
      markWrite(this)
    }

    if ((!hasArrayRowsToPush && !didUpdateRow) || (Object.keys(row).length && !didUpdateRow)) {
      continue
    }

    changedIDs.push(job.id)
  }

  if (returning === false) {
    return null
  }

  if (!changedIDs.length) {
    return []
  }

  return (
    await findMany({
      adapter: this,
      collectionSlug: 'payload-jobs',
      fields: collection.flattenedFields,
      limit: changedIDs.length,
      pagination: false,
      req,
      sort,
      tableName,
      where: { id: { in: changedIDs } },
    })
  ).docs
}
