import { APIError } from 'payload'

/** Postgres max identifier length (NAMEDATALEN - 1). */
export const maxIdentifierLength = 63

/**
 * Throws if a table or enum identifier exceeds the Postgres 63-char limit.
 * Covers companion table names (_locales, _rels, _texts, _numbers) that are built by
 * concatenation outside createTableName and would otherwise be silently truncated by Postgres.
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
