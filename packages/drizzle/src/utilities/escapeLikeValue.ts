/**
 * Escapes the LIKE wildcards `%` and `_` and the escape character `\` in a search value, so that
 * `like` and `contains` match the value literally, as they do in the MongoDB adapter.
 *
 * Postgres uses `\` as the default LIKE escape character. SQLite has no default, so the SQLite
 * adapters add `ESCAPE '\'` to their `like` and `contains` operators.
 */
export const escapeLikeValue = (value: number | string): string =>
  String(value).replace(/[\\%_]/g, '\\$&')
