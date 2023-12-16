import type { FindGlobal } from 'payload/database'

import type { PostgresAdapter } from './types'

import { findMany } from './find/findMany'
import { getTableName } from './utilities/getTableName'

export const findGlobal: FindGlobal = async function findGlobal(
  this: PostgresAdapter,
  { locale, req, slug, where },
) {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = getTableName(globalConfig)

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
