import type { ImportMap, SanitizedConfig } from 'payload'

import { AsyncLocalStorage } from 'node:async_hooks'

import type { InitAdminContextFn } from './initAdminContext.js'

export type ServerFunctionContext = {
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  initAdminContext: InitAdminContextFn
}

/** Set by the handler for each server function call. Rendering gets the same values through props. */
export const serverFunctionContext = new AsyncLocalStorage<ServerFunctionContext>()
