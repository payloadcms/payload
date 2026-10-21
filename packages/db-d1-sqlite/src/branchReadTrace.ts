import type { AnyD1Database } from 'drizzle-orm/d1'

import { isDeepStrictEqual } from 'node:util'

import { isBranchReadSQL } from './isBranchReadSQL.js'

type Statement = ReturnType<AnyD1Database['prepare']>
type Row = Record<string, unknown>
type Entry = {
  columns?: string[]
  expected?: unknown
  params: unknown[]
  sql: string
}

/**
 * A bounded optimistic read snapshot. Discovery reads can span multiple native
 * snapshots; their full ordered results must all recur in one atomic read batch.
 * No callback, policy function or hook is replayed during validation.
 */
export const createBranchReadTrace = ({ binding }: { binding: AnyD1Database }) => {
  const entries: Entry[] = []
  const pending: Promise<unknown>[] = []
  let isClosed = false
  let sqlBytes = 0
  let resultBytes = 0
  const encoder = new TextEncoder()

  const prepare = ({ params = [], sql }: { params?: unknown[]; sql: string }): Statement => {
    const runRead = async ({ isRaw }: { isRaw: boolean }) => {
      if (isClosed || !isBranchReadSQL({ sql })) {
        throw unsupported()
      }
      const statementBytes = encoder.encode(sql).byteLength

      sqlBytes += statementBytes + encoder.encode(JSON.stringify(params)).byteLength
      if (
        entries.length >= 100 ||
        params.length > 100 ||
        statementBytes > 100_000 ||
        sqlBytes > 1_000_000
      ) {
        throw unsupported()
      }

      const entry: Entry = { params: structuredClone(params), sql }

      entries.push(entry)
      const statement = binding.prepare(sql).bind(...(params as Parameters<Statement['bind']>))
      let returned: unknown

      if (isRaw) {
        const nativeRows = await (
          statement as unknown as {
            raw: (options: { columnNames: boolean }) => Promise<unknown[][]>
          }
        ).raw({ columnNames: true })
        const columns = nativeRows[0]

        // Native batch results are objects; duplicate aliases cannot be compared
        // losslessly with raw positional rows, so they are explicitly unsupported.
        if (
          !columns ||
          !columns.every((name) => typeof name === 'string') ||
          new Set(columns).size !== columns.length
        ) {
          throw unsupported()
        }
        entry.columns = columns as string[]
        entry.expected = structuredClone(nativeRows.slice(1))
        returned = nativeRows
      } else {
        const nativeResult = await statement.all()

        entry.expected = structuredClone(nativeResult.results ?? [])
        returned = nativeResult
      }

      resultBytes += encoder.encode(JSON.stringify(entry.expected)).byteLength
      if (resultBytes > 16 * 1024 * 1024) {
        throw unsupported()
      }
      return returned
    }

    const tracked = ({ isRaw }: { isRaw: boolean }): Promise<unknown> => {
      const result = runRead({ isRaw })

      pending.push(result)
      return result
    }

    return {
      all: () => tracked({ isRaw: false }),
      bind: (...values: unknown[]) => prepare({ params: values, sql }),
      first: async (column?: string) => {
        const result = (await tracked({ isRaw: false })) as { results: Row[] }
        const row = result.results?.[0]

        return row ? (column === undefined ? row : row[column]) : null
      },
      raw: async (options?: { columnNames?: boolean }) => {
        const result = (await tracked({ isRaw: true })) as unknown[][]

        return options?.columnNames ? result : result.slice(1)
      },
      run: () => Promise.reject(unsupported()),
    } as unknown as Statement
  }

  return {
    binding: {
      batch: () => Promise.reject(unsupported()),
      exec: () => Promise.reject(unsupported()),
      prepare: (sql: string) => prepare({ sql }),
    } as unknown as AnyD1Database,
    close: () => {
      isClosed = true
    },
    validate: async (): Promise<void> => {
      isClosed = true
      await Promise.all(pending)
      if (!entries.length) {
        return
      }

      const results = await binding.batch(
        entries.map(({ params, sql }) =>
          binding.prepare(sql).bind(...(params as Parameters<Statement['bind']>)),
        ),
      )

      if (results.length !== entries.length) {
        throw conflict()
      }

      for (const [index, entry] of entries.entries()) {
        const rows = results[index]?.results ?? []
        const actual = entry.columns
          ? rows.map((row) => entry.columns!.map((column) => (row as Row)[column]))
          : rows

        if (!isDeepStrictEqual(entry.expected, actual)) {
          throw conflict()
        }
      }
    },
  }
}

const unsupported = (): Error =>
  Object.assign(new Error('The branch raw read exceeds the supported atomic snapshot trace.'), {
    code: 'branch-read-snapshot-unsupported',
  })

const conflict = (): Error =>
  Object.assign(new Error('Related branch content changed while collecting the raw read graph.'), {
    code: 'branch-projection-conflict',
  })
