import type { PgSchema } from 'drizzle-orm/pg-core'
import type { FlattenedField, Payload, PayloadRequest } from 'payload'

import { sql } from 'drizzle-orm'

import type { BasePostgresAdapter, PostgresDB } from '../../types.js'
import type { DocsToResave, PathsToQuery } from './types.js'

import { fetchAndResave } from './fetchAndResave/index.js'

type Args = {
  adapter: BasePostgresAdapter
  collectionSlug?: string
  db: PostgresDB
  debug: boolean
  fields: FlattenedField[]
  globalSlug?: string
  isVersions: boolean
  pathsToQuery: PathsToQuery
  payload: Payload
  req?: Partial<PayloadRequest>
  tableName: string
}

export const migrateRelationships = async ({
  adapter,
  collectionSlug,
  db,
  debug,
  fields,
  globalSlug,
  isVersions,
  pathsToQuery,
  payload,
  req,
  tableName,
}: Args) => {
  if (pathsToQuery.size === 0) {
    return
  }

  let offset = 0

  let paginationResult

  const schemaName = (adapter.pgSchema as PgSchema).schemaName ?? 'public'

  const where = Array.from(pathsToQuery).reduce((statement, path, i) => {
    return (statement += `
"${schemaName}"."${tableName}${adapter.relationshipsSuffix}"."path" LIKE '${path}'${pathsToQuery.size !== i + 1 ? ' OR' : ''}
`)
  }, '')

  while (typeof paginationResult === 'undefined' || paginationResult.rows.length > 0) {
    const paginationStatement = `SELECT DISTINCT parent_id FROM "${schemaName}"."${tableName}${adapter.relationshipsSuffix}" WHERE
    ${where} ORDER BY parent_id LIMIT 500 OFFSET ${offset * 500};
  `

    paginationResult = await adapter.drizzle.execute(sql.raw(`${paginationStatement}`))

    if (paginationResult.rows.length === 0) {
      return
    }

    offset += 1

    const statement = `SELECT * FROM "${schemaName}"."${tableName}${adapter.relationshipsSuffix}" WHERE
    (${where}) AND parent_id IN (${paginationResult.rows.map((row) => `'${row.parent_id}'`).join(', ')});
`
    if (debug) {
      payload.logger.info('FINDING ROWS TO MIGRATE')
      payload.logger.info(statement)
    }

    const result = await adapter.drizzle.execute(sql.raw(`${statement}`))

    const docsToResave: DocsToResave = {}

    result.rows.forEach((row) => {
      const parentID = row.parent_id

      if (typeof parentID === 'string' || typeof parentID === 'number') {
        if (!docsToResave[parentID]) {
          docsToResave[parentID] = []
        }
        docsToResave[parentID].push(row)
      }
    })

    await fetchAndResave({
      adapter,
      collectionSlug,
      db,
      debug,
      docsToResave,
      fields,
      globalSlug,
      isVersions,
      payload,
      req,
      tableName,
    })
  }

  const deleteStatement = `DELETE FROM "${schemaName}"."${tableName}${adapter.relationshipsSuffix}" WHERE ${where}`
  if (debug) {
    payload.logger.info('DELETING ROWS')
    payload.logger.info(deleteStatement)
  }
  await db.execute(sql.raw(`${deleteStatement}`))
}
