import type { Field, Payload, PayloadRequestWithData } from 'payload/types'

import { sql } from 'drizzle-orm'

import type { DrizzleTransaction, PostgresAdapter } from '../../types.js'
import type { DocsToResave, PathsToQuery } from './types.js'

import { fetchAndResave } from './fetchAndResave/index.js'

type Args = {
  adapter: PostgresAdapter
  collectionSlug?: string
  db: DrizzleTransaction
  debug: boolean
  dryRun: boolean
  fields: Field[]
  globalSlug?: string
  isVersions: boolean
  pathsToQuery: PathsToQuery
  payload: Payload
  req: PayloadRequestWithData
  tableName: string
}

export const migrateRelationships = async ({
  adapter,
  collectionSlug,
  db,
  debug,
  dryRun,
  fields,
  globalSlug,
  isVersions,
  pathsToQuery,
  payload,
  req,
  tableName,
}: Args) => {
  if (pathsToQuery.size === 0) return

  const docsToResave: DocsToResave = {}

  const where = Array.from(pathsToQuery).reduce((statement, path, i) => {
    return (statement += `
"${tableName}${adapter.relationshipsSuffix}"."path" LIKE '${path}'${pathsToQuery.size !== i + 1 ? ' OR' : ''}
`)
  }, '')

  const statement = `SELECT * FROM ${tableName}${adapter.relationshipsSuffix} WHERE
    ${where}
`
  if (debug) {
    payload.logger.info('FINDING ROWS TO MIGRATE')
    payload.logger.info(statement)
  }

  const result = await adapter.drizzle.execute(sql.raw(`${statement}`))

  result.rows.forEach((row) => {
    const parentID = row.parent_id

    if (typeof parentID === 'string' || typeof parentID === 'number') {
      if (!docsToResave[parentID]) docsToResave[parentID] = []
      docsToResave[parentID].push(row)
    }
  })

  await fetchAndResave({
    adapter,
    collectionSlug,
    db,
    debug,
    docsToResave,
    dryRun,
    fields,
    globalSlug,
    isVersions,
    payload,
    req,
    tableName,
  })

  const deleteStatement = `DELETE FROM ${tableName}${adapter.relationshipsSuffix} WHERE ${where}`
  if (debug) {
    payload.logger.info('DELETING ROWS')
    payload.logger.info(deleteStatement)
  }
  if (!dryRun) await db.execute(sql.raw(`${deleteStatement}`))
}
