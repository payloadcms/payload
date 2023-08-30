/* eslint-disable no-param-reassign */
import type { SanitizedConfig } from 'payload/config'
import type { Field } from 'payload/types'
import type { TypeWithID } from 'payload/types'

import { createBlocksMap } from '../../utilities/createBlocksMap.js'
import { createRelationshipMap } from '../../utilities/createRelationshipMap.js'
import { mergeLocales } from './mergeLocales.js'
import { traverseFields } from './traverseFields.js'

type TransformArgs = {
  config: SanitizedConfig
  data: Record<string, unknown>
  fallbackLocale?: false | string
  fields: Field[]
  locale?: string
}

// This is the entry point to transform Drizzle output data
// into the shape Payload expects based on field schema
export const transform = <T extends TypeWithID>({
  config,
  data,
  fallbackLocale,
  fields,
  locale,
}: TransformArgs): T => {
  let relationships: Record<string, Record<string, unknown>[]> = {}

  if ('_relationships' in data) {
    relationships = createRelationshipMap(data._relationships)
    delete data._relationships
  }

  const blocks = createBlocksMap(data)

  const dataWithLocales = mergeLocales({ data, fallbackLocale, locale })

  return traverseFields<T>({
    blocks,
    config,
    data,
    fields,
    locale,
    path: '',
    relationships,
    siblingData: dataWithLocales,
    table: dataWithLocales,
  })
}
