import type { HttpConfig } from '../types.js'
import type { D1HttpExecResult, D1HttpResult } from './d1-http-types.js'

import { D1HttpPreparedStatement } from './d1-http-prepared-statement.js'

type CloudflareD1QueryResponse<T> = {
  errors?: unknown
  messages?: unknown
  result: T
  success: boolean
}

function throwIfD1RowFailed(row: unknown, label: string): void {
  if (
    row &&
    typeof row === 'object' &&
    'success' in row &&
    (row as { success?: boolean }).success === false
  ) {
    const err =
      (row as { error?: unknown; errors?: unknown }).error ?? (row as { errors?: unknown }).errors

    throw new Error(`D1 HTTP ${label} failed${err !== undefined ? `: ${JSON.stringify(err)}` : ''}`)
  }
}

export class D1HttpBinding {
  private readonly config: {
    baseUrl: string
  } & Required<Pick<HttpConfig, 'accountId' | 'apiToken' | 'databaseId'>>

  constructor(config: HttpConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl ?? 'https://api.cloudflare.com/client/v4',
    }
  }

  private async request<T extends CloudflareD1QueryResponse<unknown>>(body: object): Promise<T> {
    const response = await fetch(this.endpoint, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const text = await response.text()
    let data: unknown

    try {
      data = JSON.parse(text) as { errors?: unknown; success?: boolean } & T
    } catch {
      throw new Error(`D1 HTTP API error: ${response.status} ${text}`)
    }

    if (!response.ok) {
      throw new Error(`D1 HTTP API error: ${response.status} ${text}`)
    }

    if (typeof data === 'object' && data !== null && 'success' in data && data.success === false) {
      throw new Error(`D1 query failed: ${JSON.stringify((data as { errors?: unknown }).errors)}`)
    }

    return data as T
  }

  async batch<T = unknown>(statements: readonly unknown[]): Promise<D1HttpResult<T>[]> {
    const batchPayload: { params: unknown[]; sql: string }[] = []

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]

      if (!(stmt instanceof D1HttpPreparedStatement)) {
        throw new Error(
          `D1HttpBinding.batch: expected statements from this binding.prepare() at index ${i}`,
        )
      }

      batchPayload.push({ params: stmt.params, sql: stmt.sql })
    }

    const response = await this.request<CloudflareD1QueryResponse<D1HttpResult<T>[]>>({
      batch: batchPayload,
    })

    const { result } = response

    if (result.length !== statements.length) {
      throw new Error(
        `D1 batch: expected ${String(statements.length)} result(s), got ${String(result.length)}`,
      )
    }

    for (let i = 0; i < result.length; i++) {
      throwIfD1RowFailed(result[i], `batch statement ${String(i)}`)
    }

    return result
  }

  dump(): Promise<ArrayBuffer> {
    return Promise.reject(
      new Error('D1 dump() is deprecated and not supported via the D1 HTTP API'),
    )
  }

  async exec(query: string): Promise<D1HttpExecResult> {
    const response = await this.request<CloudflareD1QueryResponse<D1HttpResult[]>>({ sql: query })

    const first = response.result[0]

    if (first) {
      throwIfD1RowFailed(first, 'exec')
    }

    const meta = first?.meta

    return {
      count: meta?.changes ?? 0,
      duration: meta?.duration ?? 0,
    }
  }

  prepare(query: string): D1HttpPreparedStatement {
    return new D1HttpPreparedStatement(this, query)
  }

  async query<T>(sql: string, params: unknown[]): Promise<D1HttpResult<T>> {
    const response = await this.request<CloudflareD1QueryResponse<D1HttpResult<T>[]>>({
      params,
      sql,
    })

    const first = response.result[0]

    if (!first) {
      throw new Error('D1 HTTP API returned an empty result array')
    }

    throwIfD1RowFailed(first, 'query')

    return first
  }

  withSession(): never {
    throw new Error('D1 withSession() is not supported via the HTTP API')
  }

  private get endpoint(): string {
    return `${this.config.baseUrl}/accounts/${this.config.accountId}/d1/database/${this.config.databaseId}/query`
  }
}
