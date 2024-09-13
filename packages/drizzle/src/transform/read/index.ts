import type { Field, JoinQuery, SanitizedConfig, TypeWithID } from 'payload'

import type { DrizzleAdapter } from '../../types.js'

import { createBlocksMap } from '../../utilities/createBlocksMap.js'
import { createPathMap } from '../../utilities/createRelationshipMap.js'
import { traverseFields } from './traverseFields.js'

type TransformArgs = {
  adapter: DrizzleAdapter
  config: SanitizedConfig
  data: Record<string, unknown>
  fallbackLocale?: false | string
  fields: Field[]
  joinQuery?: JoinQuery
  locale?: string
}

// This is the entry point to transform Drizzle output data
// into the shape Payload expects based on field schema
export const transform = <T extends Record<string, unknown> | TypeWithID>({
  adapter,
  config,
  data,
  fields,
  joinQuery,
}: TransformArgs): T => {
  let relationships: Record<string, Record<string, unknown>[]> = {}
  let texts: Record<string, Record<string, unknown>[]> = {}
  let numbers: Record<string, Record<string, unknown>[]> = {}

  if ('_rels' in data) {
    relationships = createPathMap(data._rels)
    delete data._rels
  }

  if ('_texts' in data) {
    texts = createPathMap(data._texts)
    delete data._texts
  }

  if ('_numbers' in data) {
    numbers = createPathMap(data._numbers)
    delete data._numbers
  }

  const blocks = createBlocksMap(data)
  const deletions = []

  const result = traverseFields<T>({
    adapter,
    blocks,
    config,
    dataRef: {
      id: data.id,
    },
    deletions,
    fieldPrefix: '',
    fields,
    joinQuery,
    numbers,
    path: '',
    relationships,
    table: data,
    texts,
  })

  deletions.forEach((deletion) => deletion())

  return result
}
