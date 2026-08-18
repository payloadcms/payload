/**
 * Subset of Cloudflare D1 result types used by the HTTP shim. Kept local to avoid a
 * dependency on `@cloudflare/workers-types` for consumers who only use HTTP mode.
 */
export type D1HttpMeta = {
  [key: string]: unknown
  changes?: number
  duration: number
}

export type D1HttpResult<T = unknown> = {
  meta: D1HttpMeta
  results: T[]
  success: true
}

export type D1HttpExecResult = {
  count: number
  duration: number
}
