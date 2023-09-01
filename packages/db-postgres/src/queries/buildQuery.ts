import type { SQL } from 'drizzle-orm'
import type { Where } from 'payload/types'
import type { Field } from 'payload/types'

import { QueryError } from 'payload/errors'

import type { PostgresAdapter } from '../types'

import { parseParams } from './parseParams'

type BuildQueryArgs = {
  adapter: PostgresAdapter
  collectionSlug?: string
  globalSlug?: string
  locale?: string
  versionsFields?: Field[]
  where: Where
}

const buildQuery = async function buildQuery({
  adapter,
  collectionSlug,
  globalSlug,
  locale,
  versionsFields,
  where,
}: BuildQueryArgs): Promise<SQL> {
  let fields = versionsFields
  if (!fields) {
    if (globalSlug) {
      const globalConfig = adapter.payload.globals.config.find(({ slug }) => slug === globalSlug)
      fields = globalConfig.fields
    }
    if (collectionSlug) {
      const collectionConfig = adapter.payload.collections[collectionSlug].config
      fields = collectionConfig.fields
    }
  }
  const errors = []
  const result = await parseParams({
    adapter,
    collectionSlug,
    fields,
    globalSlug,
    locale,
    where,
  })

  if (errors.length > 0) {
    throw new QueryError(errors)
  }

  return result
}

export default buildQuery
