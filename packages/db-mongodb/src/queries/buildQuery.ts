import type { FlattenedField, PayloadRequest, Where } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { parseParams } from './parseParams.js'

export const buildQuery = async ({
  adapter,
  branch,
  collectionSlug,
  fields,
  globalSlug,
  locale,
  req,
  where,
}: {
  adapter: MongooseAdapter
  branch?: false | string
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  locale?: string
  req?: Partial<PayloadRequest>
  where: Where
}) => {
  const result = await parseParams({
    branch,
    collectionSlug,
    fields,
    globalSlug,
    locale,
    parentIsLocalized: false,
    payload: adapter.payload,
    req,
    where,
  })

  return result
}
