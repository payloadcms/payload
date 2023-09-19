/* eslint-disable no-param-reassign */
import type { SanitizedConfig } from 'payload/config'
import type { Field, TypeWithID } from 'payload/types'

import { createBlocksMap } from '../../utilities/createBlocksMap'
import { createRelationshipMap } from '../../utilities/createRelationshipMap'
import { traverseFields } from './traverseFields'

type TransformArgs = {
  config: SanitizedConfig
  data: Record<string, unknown>
  fallbackLocale?: false | string
  fields: Field[]
  locale?: string
}

// This is the entry point to transform Drizzle output data
// into the shape Payload expects based on field schema
export const transform = <T extends TypeWithID>({ config, data, fields }: TransformArgs): T => {
  let relationships: Record<string, Record<string, unknown>[]> = {}

  if ('_relationships' in data) {
    relationships = createRelationshipMap(data._relationships)
    delete data._relationships
  }

  const blocks = createBlocksMap(data)

  const result = traverseFields<T>({
    blocks,
    config,
    dataRef: {
      id: data.id,
    },
    fieldPrefix: '',
    fields,
    path: '',
    relationships,
    table: data,
  })

  return result
}
