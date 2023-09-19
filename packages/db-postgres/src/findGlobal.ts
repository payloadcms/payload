import type { FindGlobal } from 'payload/database'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { buildFindManyArgs } from './find/buildFindManyArgs'
import buildQuery from './queries/buildQuery'
import { transform } from './transform/read'

export const findGlobal: FindGlobal = async function findGlobal(
  this: PostgresAdapter,
  { locale, req, slug, where },
) {
  const db = req.transactionID ? this.sessions[req.transactionID] : this.db
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = toSnakeCase(slug)

  const query = await buildQuery({
    adapter: this,
    fields: globalConfig.fields,
    locale,
    tableName,
    where,
  })

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: globalConfig.fields,
    tableName,
  })

  findManyArgs.where = query

  const doc = await db.query[tableName].findFirst(findManyArgs)

  if (doc) {
    const result = transform({
      config: this.payload.config,
      data: doc,
      fields: globalConfig.fields,
    })

    return result
  }

  return null
}
