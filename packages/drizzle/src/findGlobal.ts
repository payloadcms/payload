import type { FindGlobal } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getGlobal } from './utilities/getEntity.js'

export const findGlobal: FindGlobal = async function findGlobal(
  this: DrizzleAdapter,
  { slug: globalSlug, locale, req, select, where },
) {
  const { globalConfig, tableName } = getGlobal({ adapter: this, globalSlug })

  const {
    docs: [doc],
  } = await findMany({
    adapter: this,
    fields: globalConfig.flattenedFields,
    limit: 1,
    locale,
    pagination: false,
    req,
    select,
    tableName,
    where,
  })

  if (doc) {
    doc.globalType = globalSlug
    return doc
  }

  return {}
}
