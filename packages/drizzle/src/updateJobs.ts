import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { BaseJob, UpdateJobs, Where } from 'payload'

import { inArray } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { ChainedMethods, DrizzleAdapter } from './types.js'

import { chainMethods } from './find/chainMethods.js'
import { findMany } from './find/findMany.js'
import buildQuery from './queries/buildQuery.js'
import { transform } from './transform/read/index.js'
import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export const updateJobs: UpdateJobs = async function updateMany(
  this: DrizzleAdapter,
  { id, data, limit: limitArg, req, returning, sort: sortArg, where: whereArg },
) {
  const whereToUse: Where = id ? { id: { equals: id } } : whereArg
  const limit = id ? 1 : limitArg

  const db = await getTransaction(this, req)
  const collection = this.payload.collections['payload-jobs'].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collection.defaultSort

  const dataKeys = Object.keys(data)
  // The initial update is when all jobs are being updated to processing and fetched
  const isInitialUpdate = dataKeys.length === 1 && dataKeys[0] === 'processing'

  if (isInitialUpdate) {
    // Performance optimization for the initial update - this needs to happen as quickly as possible
    const _db = db as LibSQLDatabase

    const rowToInsert: {
      id?: number | string
      processing: boolean
    } = data as { processing: boolean }

    const { orderBy, where } = buildQuery({
      adapter: this,
      fields: collection.flattenedFields,
      sort,
      tableName,
      where: whereToUse,
    })

    const table = this.tables[tableName]
    const jobsLogTable = this.tables['payload_jobs_log']

    let idsToUpdate: (number | string)[] = []
    let docsToUpdate: BaseJob[] = []

    // Fetch all jobs that should be updated. This can't be done in the update query, as
    // 1) we need to join the logs table to get the logs for each job
    // 2) postgres doesn't support limit on update queries
    const jobsQuery = _db
      .select({
        id: table.id,
      })
      .from(table)
      .where(where)

    const chainedMethods: ChainedMethods = []

    if (typeof limit === 'number' && limit > 0) {
      chainedMethods.push({
        args: [limit],
        method: 'limit',
      })
    }

    if (orderBy) {
      chainedMethods.push({
        args: [() => orderBy.map(({ column, order }) => order(column))],
        method: 'orderBy',
      })
    }

    docsToUpdate = (await chainMethods({
      methods: chainedMethods,
      query: jobsQuery,
    })) as BaseJob[]

    idsToUpdate = docsToUpdate?.map((job) => job.id)

    // Now fetch all log entries for these jobs
    if (idsToUpdate.length) {
      const logsQuery = _db
        .select({
          id: jobsLogTable.id,
          completedAt: jobsLogTable.completedAt,
          error: jobsLogTable.error,
          executedAt: jobsLogTable.executedAt,
          input: jobsLogTable.input,
          output: jobsLogTable.output,
          parentID: jobsLogTable._parentID,
          state: jobsLogTable.state,
          taskID: jobsLogTable.taskID,
          taskSlug: jobsLogTable.taskSlug,
        })
        .from(jobsLogTable)
        .where(inArray(jobsLogTable._parentID, idsToUpdate))

      const logs = await logsQuery

      // Group logs by parent ID
      const logsByParentId = logs.reduce(
        (acc, log) => {
          const parentId = log.parentID
          if (!acc[parentId]) {
            acc[parentId] = []
          }
          acc[parentId].push(log)
          return acc
        },
        {} as Record<number | string, any[]>,
      )

      // Attach logs to their respective jobs
      for (const job of docsToUpdate) {
        job.log = logsByParentId[job.id] || []
      }
    }

    // Perform the actual update
    const query = _db
      .update(table)
      .set(rowToInsert)
      .where(inArray(table.id, idsToUpdate))
      .returning()

    const updatedJobs = (await query) as BaseJob[]

    return updatedJobs.map((row) => {
      // Attach logs to the updated job
      row.log = docsToUpdate.find((job) => job.id === row.id)?.log || []

      return transform<BaseJob>({
        adapter: this,
        config: this.payload.config,
        data: row,
        fields: collection.flattenedFields,
        joinQuery: false,
      })
    })
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

  const results: BaseJob[] = []

  // TODO: We need to batch this to reduce the amount of db calls. This can get very slow if we are updating a lot of rows.
  for (const job of jobs.docs) {
    const updateData = {
      ...job,
      ...data,
    }

    const result = await upsertRow<BaseJob>({
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
