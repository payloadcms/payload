import { APIError } from 'payload'

/** Postgres max identifier length (NAMEDATALEN - 1). */
export const maxIdentifierLength = 63

/**
 * Cap for builder-generated identifiers (`buildIndexName`/`buildForeignKeyName`). Sits
 * below `maxIdentifierLength` to leave headroom for the appended `_idx`/`_fk`/`_N` suffixes.
 */
export const maxGeneratedIdentifierLength = maxIdentifierLength - 3

/**
 * Throws if a table or enum identifier exceeds the Postgres 63-char limit.
 */
export const validateIdentifierLength = (name: string): string => {
  if (name.length > maxIdentifierLength) {
    throw new APIError(
      `Exceeded max identifier length for table or enum name of ${maxIdentifierLength} characters. Invalid name: ${name}.
Tip: You can use the dbName property to reduce the table name length.
      `,
    )
  }

  return name
}
