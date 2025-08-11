import type { DrizzleAdapter } from '../types.js'

export const buildIndexName = ({
  name,
  adapter,
  number = 0,
}: {
  adapter: DrizzleAdapter
  name: string
  number?: number
}): string => {
  let indexName = `${name}${number ? `_${number}` : ''}_idx`

  if (indexName.length > 60) {
    // Trim to 60 chars, but keep the "_idx" suffix
    indexName = `${indexName.slice(0, 60 - 4)}_idx`
  }

  if (!adapter.indexes.has(indexName)) {
    adapter.indexes.add(indexName)
    return indexName
  }

  return buildIndexName({
    name,
    adapter,
    number: number + 1,
  })
}
