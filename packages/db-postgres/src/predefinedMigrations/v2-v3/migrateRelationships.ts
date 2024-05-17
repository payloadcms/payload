import type { Field, Payload } from 'payload/types'

import { sql } from 'drizzle-orm'

import type { PostgresAdapter } from '../../types.js'
import type { DocsToResave, WhereConditionMap } from './types.js'

import { fetchAndResave } from './fetchAndResave/index.js'

type Args = {
  collectionSlug?: string
  db: PostgresAdapter
  debug: boolean
  dryRun: boolean
  fields: Field[]
  globalSlug?: string
  isVersions: boolean
  payload: Payload
  whereConditionMap: WhereConditionMap
}

export const migrateRelationships = async ({
  collectionSlug,
  db,
  debug,
  dryRun,
  fields,
  globalSlug,
  isVersions,
  payload,
  whereConditionMap,
}: Args) => {
  const docsToResave: DocsToResave = {}

  for (const [tableName, paths] of whereConditionMap) {
    const where = paths.reduce((statement, path, i) => {
      return (statement += `
"${tableName}"."path" LIKE '${path}'${paths.length !== i + 1 ? ' OR' : ''}
`)
    }, '')

    const statement = `SELECT * FROM ${tableName} WHERE
    ${where}
`
    if (debug) {
      payload.logger.info('FINDING ROWS TO MIGRATE')
      payload.logger.info(statement)
    }

    if (!dryRun) {
      const result = await db.drizzle.execute(sql.raw(`${statement}`))

      if (debug) {
        payload.logger.info(result.rows)
      }

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
        docsToResave,
        fields,
        globalSlug,
        isVersions,
        payload,
      })
    }
  }
}
