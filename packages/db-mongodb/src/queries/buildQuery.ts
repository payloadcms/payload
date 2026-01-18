import type { FlattenedField, Where } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { parseParams } from './parseParams.js'

export const buildQuery = async ({
  adapter,
  collectionSlug,
  fields,
  globalSlug,
  locale,
  where,
}: {
  adapter: MongooseAdapter
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  locale?: string
  where: Where
}) => {
  const result = await parseParams({
    collectionSlug,
    fields,
    globalSlug,
    locale,
    parentIsLocalized: false,
    payload: adapter.payload,
    where,
  })

  return result
}
