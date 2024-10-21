import type { TransactionPg } from '@payloadcms/drizzle/types'
import type { Field, Payload, PayloadRequest } from 'payload'

import { sql } from 'drizzle-orm'

import type { PostgresAdapter } from '../../types.js'
import type { DocsToResave, PathsToQuery } from './types.js'

import { fetchAndResave } from './fetchAndResave/index.js'

type Args = {
  adapter: PostgresAdapter
  collectionSlug?: string
  db: TransactionPg
  debug: boolean
  fields: Field[]
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

  const where = Array.from(pathsToQuery).reduce((statement, path, i) => {
    return (statement += `
"${tableName}${adapter.relationshipsSuffix}"."path" LIKE '${path}'${pathsToQuery.size !== i + 1 ? ' OR' : ''}
`)
  }, '')

  while (typeof paginationResult === 'undefined' || paginationResult.rows.length > 0) {
    const paginationStatement = `SELECT DISTINCT parent_id FROM ${tableName}${adapter.relationshipsSuffix} WHERE
    ${where} ORDER BY parent_id LIMIT 500 OFFSET ${offset * 500};
  `

    paginationResult = await adapter.drizzle.execute(sql.raw(`${paginationStatement}`))

    if (paginationResult.rows.length === 0) {
      return
    }

    offset += 1

    const parentIds = paginationResult.rows.map(({ parent_id }) =>
      typeof parent_id === 'string' ? `'${parent_id}'` : parent_id,
    )

    const statement = `SELECT * FROM ${tableName}${adapter.relationshipsSuffix} WHERE
    (${where}) AND parent_id IN (${parentIds.join(', ')});
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
      req: req as unknown as PayloadRequest,
      tableName,
    })
  }

  const deleteStatement = `DELETE FROM ${tableName}${adapter.relationshipsSuffix} WHERE ${where}`
  if (debug) {
    payload.logger.info('DELETING ROWS')
    payload.logger.info(deleteStatement)
  }
  await db.execute(sql.raw(`${deleteStatement}`))
}
