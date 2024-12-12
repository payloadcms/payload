import type { Upsert } from 'payload'

import type { MongooseAdapter } from './index.js'

export const upsert: Upsert = async function upsert(
  this: MongooseAdapter,
  { collection, data, locale, req, select, where },
) {
  return this.updateOne({ collection, data, locale, options: { upsert: true }, req, select, where })
}
