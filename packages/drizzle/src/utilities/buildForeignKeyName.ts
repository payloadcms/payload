import type { DrizzleAdapter } from '../types.js'

import { maxGeneratedIdentifierLength } from './validateIdentifierLength.js'

export const buildForeignKeyName = ({
  name,
  adapter,
  number = 0,
}: {
  adapter: DrizzleAdapter
  name: string
  number?: number
}): string => {
  let foreignKeyName = `${name}${number ? `_${number}` : ''}_fk`

  if (foreignKeyName.length > maxGeneratedIdentifierLength) {
    const suffix = `${number ? `_${number}` : ''}_fk`
    foreignKeyName = `${name.slice(0, maxGeneratedIdentifierLength - suffix.length)}${suffix}`
  }

  if (!adapter.foreignKeys.has(foreignKeyName)) {
    adapter.foreignKeys.add(foreignKeyName)
    return foreignKeyName
  }

  return buildForeignKeyName({
    name,
    adapter,
    number: number + 1,
  })
}
