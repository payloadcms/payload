import type { Field, Payload, PayloadRequestWithData } from 'payload/types'

import { sql } from 'drizzle-orm'

import type { PostgresAdapter } from '../../types.js'
import type { DocsToResave, PathsToQuery } from './types.js'

import { fetchAndResave } from './fetchAndResave/index.js'

type Args = {
  collectionSlug?: string
  db: PostgresAdapter
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
"${tableName}${db.relationshipsSuffix}"."path" LIKE '${path}'${pathsToQuery.size !== i + 1 ? ' OR' : ''}
`)
  }, '')

  const statement = `SELECT * FROM ${tableName}${db.relationshipsSuffix} WHERE
    ${where}
`
  if (debug) {
    payload.logger.info('FINDING ROWS TO MIGRATE')
    payload.logger.info(statement)
  }

  const result = await db.drizzle.execute(sql.raw(`${statement}`))

  result.rows.forEach((row) => {
    const parentID = row.parent_id

    if (typeof parentID === 'string' || typeof parentID === 'number') {
      if (!docsToResave[parentID]) docsToResave[parentID] = []
      docsToResave[parentID].push(row)
    }
  })

  await fetchAndResave({
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

  // TODO:
  // DELETE ALL MATCHED ROWS FROM `RESULT` ABOVE
}
