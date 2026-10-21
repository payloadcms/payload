import { drizzle } from 'drizzle-orm/node-postgres'
import { isDeepStrictEqual } from 'node:util'

import type { DrizzleTransaction } from '../types.js'

type QueryConfig = {
  rowMode?: string
  text: string
  types?: { getTypeParser: (oid: number, format?: string) => (value: string) => unknown }
}
type Result = {
  fields: { dataTypeID: number; name: string }[]
  rows: Record<string, unknown>[] | unknown[][]
}
type Client = { query: (config: QueryConfig, params?: unknown[]) => Promise<Result> }
type Entry = {
  config: QueryConfig
  expected: unknown[][]
  fields: Result['fields']
  params: unknown[]
  text: string
}

/**
 * Existing READ COMMITTED callers keep their transaction and read their own writes.
 * Before exposing raw content, every discovery read must recur at one statement
 * snapshot. Validation replays SQL, never access functions or application hooks.
 */
export const createPostgresReadTrace = ({
  db,
  schema,
}: {
  db: DrizzleTransaction
  schema: Record<string, unknown>
}) => {
  const client = (db as unknown as { session?: { client?: Client } }).session?.client

  if (!client || typeof client.query !== 'function') {
    throw unsupported()
  }

  const entries: Entry[] = []
  const pending: Promise<unknown>[] = []
  let isClosed = false
  let bytes = 0
  const encoder = new TextEncoder()
  const trackedClient = {
    query: (config: QueryConfig, params: unknown[] = []) => {
      const read = async () => {
        if (isClosed || typeof config?.text !== 'string') {
          throw unsupported()
        }
        const text = rewriteReadSQL({ offset: 0, text: config.text })

        bytes += encoder.encode(text).byteLength + encoder.encode(JSON.stringify(params)).byteLength
        if (entries.length >= 100 || params.length > 1_000 || bytes > 16 * 1024 * 1024) {
          throw unsupported()
        }
        const entry: Entry = {
          config,
          expected: [],
          fields: [],
          params: cloneReadValue({ value: params }),
          text,
        }

        entries.push(entry)
        const result = await client.query(config, params)

        if (
          !config.types ||
          (new Set(result.fields.map(({ name }) => name)).size !== result.fields.length &&
            config.rowMode !== 'array')
        ) {
          throw unsupported()
        }
        entry.fields = result.fields
        entry.expected = cloneReadValue({
          value:
            config.rowMode === 'array'
              ? (result.rows as unknown[][])
              : (result.rows as Record<string, unknown>[]).map((row) =>
                  result.fields.map(({ name }) => row[name]),
                ),
        })
        bytes += encoder.encode(JSON.stringify(entry.expected)).byteLength
        if (bytes > 16 * 1024 * 1024) {
          throw unsupported()
        }
        return result
      }
      const result = read()

      pending.push(result)
      return result
    },
  }

  return {
    close: () => {
      isClosed = true
    },
    db: drizzle(trackedClient as never, { schema }) as unknown as DrizzleTransaction,
    validate: async () => {
      isClosed = true
      await Promise.all(pending)
      if (!entries.length) {
        return
      }
      const params = entries.flatMap((entry) => entry.params)

      if (params.length > 10_000) {
        throw unsupported()
      }
      // A lateral subquery adds ordinality without changing positional columns.
      const selects = entries.map((entry, index) => {
        const previous = entries.slice(0, index).reduce((sum, item) => sum + item.params.length, 0)
        const text = rewriteReadSQL({ offset: previous, text: entry.text })
        const columns = entry.fields.map((_, column) => `"c${column}"`)
        const chunks: string[] = []

        for (let start = 0; start < columns.length; start += 50) {
          chunks.push(
            `jsonb_build_array(${columns
              .slice(start, start + 50)
              .map((column) => `q.${column}::text`)
              .join(', ')})`,
          )
        }
        const values = chunks.length ? `(${chunks.join(' || ')})` : 'jsonb_build_array()'

        return `(SELECT coalesce(json_agg(${values} ORDER BY q.__ordinal), '[]'::json) FROM (SELECT row_number() OVER () AS __ordinal, source.* FROM (${text}) source(${columns.join(', ')})) q) AS "r${index}"`
      })
      const validated = await client.query({ text: `SELECT ${selects.join(', ')}` }, params)
      const row = validated.rows[0] as Record<string, string[][]>

      for (const [index, entry] of entries.entries()) {
        const actual = row[`r${index}`].map((values) =>
          values.map((value, column) =>
            value === null
              ? null
              : entry.config.types!.getTypeParser(entry.fields[column].dataTypeID, 'text')(value),
          ),
        )

        if (!isDeepStrictEqual(entry.expected, actual)) {
          throw conflict()
        }
      }
    },
  }
}

/** Rewrite only unquoted positional parameters; refuse mutating statement tokens. */
const rewriteReadSQL = ({ offset, text }: { offset: number; text: string }): string => {
  const tokens: string[] =
    text.match(
      /\$\$[\s\S]*?\$\$|\$([a-z_]\w*)\$[\s\S]*?\$\1\$|'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\r\n]*|\/\*[\s\S]*?\*\/|\$\d+|[a-z_][\w$]*|;|[^a-z_'"$;/-]+|./gi,
    ) ?? []
  const keywords = tokens
    .filter((token) => /^[a-z_]/i.test(token))
    .map((token) => token.toLowerCase())
  const forbidden = new Set([
    'alter',
    'analyze',
    'begin',
    'call',
    'commit',
    'copy',
    'create',
    'delete',
    'do',
    'drop',
    'execute',
    'grant',
    'insert',
    'lock',
    'merge',
    'nextval',
    'refresh',
    'release',
    'reset',
    'revoke',
    'rollback',
    'savepoint',
    'set',
    'setval',
    'truncate',
    'update',
    'vacuum',
  ])

  if (
    !['select', 'with'].includes(keywords[0]) ||
    tokens.includes(';') ||
    keywords.some((word) => forbidden.has(word))
  ) {
    throw unsupported()
  }
  return tokens
    .map((token) => (/^\$\d+$/.test(token) ? `$${Number(token.slice(1)) + offset}` : token))
    .join('')
}

const unsupported = () =>
  Object.assign(new Error('The branch read exceeds the supported PostgreSQL snapshot trace.'), {
    code: 'branch-read-snapshot-unsupported',
  })
const conflict = () =>
  Object.assign(new Error('Related branch content changed while collecting the raw read graph.'), {
    code: 'branch-projection-conflict',
  })

/** Native PG values are detached without importing Node V8 into shared D1 bundles. */
const cloneReadValue = <T>({ value }: { value: T }): T => {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function' || typeof value === 'symbol') {
      throw unsupported()
    }
    return value
  }
  if (Buffer.isBuffer(value)) {
    return Buffer.from(value) as T
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => cloneReadValue({ value: item })) as T
  }
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    throw unsupported()
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, cloneReadValue({ value: item })]),
  ) as T
}
