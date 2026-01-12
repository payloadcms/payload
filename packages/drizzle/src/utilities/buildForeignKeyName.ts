import type { DrizzleAdapter } from '../types.js'

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

  if (foreignKeyName.length > 60) {
    const suffix = `${number ? `_${number}` : ''}_fk`
    foreignKeyName = `${name.slice(0, 60 - suffix.length)}${suffix}`
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
