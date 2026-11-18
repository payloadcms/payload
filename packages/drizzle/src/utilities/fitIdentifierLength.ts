import type { DrizzleAdapter } from '../types.js'

import { maxIdentifierLength } from './validateIdentifierLength.js'

/**
 * Returns `<name><suffix>` for a generated index or foreign key name, shortened only when
 * Postgres would otherwise truncate it.
 *
 * Postgres keeps at most 63 characters of an identifier, so a longer name never matches what
 * push reads back from the database and the constraint is dropped and re-added on every run.
 *
 * - Other adapters (SQLite, D1) have no such limit and always get the name unchanged.
 * - Names that already fit are unchanged, so existing databases keep their current names.
 * - Longer names are cut and end with a hash of the full name. The result depends only on
 *   `name` and `suffix`, never on which other names exist in the config, so adding or
 *   reordering fields doesn't rename constraints on other tables.
 */
export const fitIdentifierLength = ({
  name,
  adapter,
  suffix,
}: {
  adapter: Pick<DrizzleAdapter, 'name'>
  name: string
  suffix: string
}): string => {
  const identifier = `${name}${suffix}`

  if (!exceedsIdentifierLength({ adapter, identifier })) {
    return identifier
  }

  const tail = `_${hashIdentifier(identifier)}${suffix}`

  return `${name.slice(0, maxIdentifierLength - tail.length)}${tail}`
}

/** Whether Postgres would truncate `identifier`. Always `false` for non-Postgres adapters. */
export const exceedsIdentifierLength = ({
  adapter,
  identifier,
}: {
  adapter: Pick<DrizzleAdapter, 'name'>
  identifier: string
}): boolean => adapter.name === 'postgres' && identifier.length > maxIdentifierLength

/** 32-bit FNV-1a hash as 8 hex characters. Avoids `crypto` so it also runs on edge runtimes. */
const hashIdentifier = (value: string): string => {
  let hash = 0x811c9dc5

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}
