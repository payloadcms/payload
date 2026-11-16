import type { DrizzleAdapter } from '../types.js'

import { maxGeneratedIdentifierLength } from './validateIdentifierLength.js'

export const buildIndexName = ({
  name,
  adapter,
  appendSuffix = true,
  number = 0,
}: {
  adapter: DrizzleAdapter
  appendSuffix?: boolean
  name: string
  number?: number
}): string => {
  let indexName = `${name}${number ? `_${number}` : ''}${appendSuffix ? '_idx' : ''}`

  if (indexName.length > maxGeneratedIdentifierLength) {
    const suffix = `${number ? `_${number}` : ''}${appendSuffix ? '_idx' : ''}`
    indexName = `${name.slice(0, maxGeneratedIdentifierLength - suffix.length)}${suffix}`
  }

  if (!adapter.indexes.has(indexName) && !(indexName in adapter.rawTables)) {
    adapter.indexes.add(indexName)
    return indexName
  }

  return buildIndexName({
    name,
    adapter,
    appendSuffix,
    number: number + 1,
  })
}
