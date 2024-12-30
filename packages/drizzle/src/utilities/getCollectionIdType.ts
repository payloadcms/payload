import type { Collection } from 'payload'

import type { DrizzleAdapter } from '../types.js'

const typeMap: Record<string, 'number' | 'text'> = {
  number: 'number',
  serial: 'number',
  text: 'text',
  uuid: 'text',
}

export const getCollectionIdType = ({
  adapter,
  collection,
}: {
  adapter: DrizzleAdapter
  collection: Collection
}) => {
  return collection.customIDType ?? typeMap[adapter.idType]
}
