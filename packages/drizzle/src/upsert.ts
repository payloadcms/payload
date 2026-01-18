import type { Upsert } from '@ruya.sa/payload'

import type { DrizzleAdapter } from './types.js'

export const upsert: Upsert = async function upsert(
  this: DrizzleAdapter,
  { collection, data, joins, locale, req, returning, select, where },
) {
  return this.updateOne({
    collection,
    data,
    joins,
    locale,
    options: { upsert: true },
    req,
    returning,
    select,
    where,
  })
}
