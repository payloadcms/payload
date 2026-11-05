import type { D1HttpBinding } from './d1-http-binding.js'
import type { D1HttpResult } from './d1-http-types.js'

export class D1HttpPreparedStatement {
  private readonly binding: D1HttpBinding
  public params: unknown[] = []
  public readonly sql: string

  constructor(binding: D1HttpBinding, sql: string) {
    this.binding = binding
    this.sql = sql
  }

  async all<T = Record<string, unknown>>(): Promise<D1HttpResult<T>> {
    return this.binding.query<T>(this.sql, this.params)
  }

  bind(...values: unknown[]): D1HttpPreparedStatement {
    const stmt = new D1HttpPreparedStatement(this.binding, this.sql)

    stmt.params = values

    return stmt
  }

  async first<T = unknown>(colName?: string): Promise<null | T> {
    const result = await this.binding.query<Record<string, unknown>>(this.sql, this.params)
    const row = result.results[0]

    if (!row) {
      return null
    }

    if (colName !== undefined) {
      return (row[colName] as T) ?? null
    }

    return row as T
  }

  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<[string[], ...T[]] | T[]> {
    const result = await this.binding.query<Record<string, unknown>>(this.sql, this.params)

    if (result.results.length === 0) {
      return options?.columnNames ? ([[]] as [string[], ...T[]]) : ([] as T[])
    }

    const firstRow = result.results[0]

    if (!firstRow) {
      return options?.columnNames ? ([[]] as [string[], ...T[]]) : ([] as T[])
    }

    const columns = Object.keys(firstRow)
    const rows = result.results.map((row) => columns.map((col) => row[col])) as T[]

    if (options?.columnNames) {
      return [columns, ...rows] as [string[], ...T[]]
    }

    return rows
  }

  async run<T = Record<string, unknown>>(): Promise<D1HttpResult<T>> {
    return this.binding.query<T>(this.sql, this.params)
  }
}
