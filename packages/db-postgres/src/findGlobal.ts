import type { FindGlobal } from 'payload/database'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { findMany } from './find/findMany'

export const findGlobal: FindGlobal = async function findGlobal(
  this: PostgresAdapter,
  { slug, locale, req, where },
) {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)

  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const {
    docs: [doc],
  } = await findMany({
    adapter: this,
    fields: globalConfig.fields,
    limit: 1,
    locale,
    pagination: false,
    req,
    tableName,
    where,
  })

  if (doc) {
    doc.globalType = slug
    return doc
  }

  return {}
}
