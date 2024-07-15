import { flatten } from 'flatley'

import type { MongooseAdapter } from '../'

type Args = {
  adapter: MongooseAdapter
  data: Record<string, unknown>
} & ({ collectionSlug: string } | { global: true })

export const flattenIfNecessary = (args: Args) => {
  const { adapter, data } = args

  let result = data

  let shouldFlatten = adapter.schemaOptions?.strict === false

  if ('collectionSlug' in args) {
    const strictCollection = adapter.collectionOptions[args.collectionSlug]?.schemaOptions?.strict
    if (typeof strictCollection === 'boolean') shouldFlatten = !strictCollection
  }

  if ('global' in args) {
    const strictGlobals = adapter.globalsOptions?.schemaOptions?.strict
    if (typeof strictGlobals === 'boolean') shouldFlatten = !strictGlobals
  }

  if (shouldFlatten) {
    result = flatten(data)
  }

  return result
}
