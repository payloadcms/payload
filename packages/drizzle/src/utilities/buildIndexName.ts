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
  const indexName = `${name}_idx${number ? `_${number}` : ''}`

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
