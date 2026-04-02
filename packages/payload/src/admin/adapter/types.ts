import type React from 'react'

import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { Payload } from '../../types/index.js'
import type { InitReqResult, ServerFunctionHandler } from '../functions/index.js'

export type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: 'lax' | 'none' | 'strict'
  secure?: boolean
}

export type RouteHandler = (request: Request) => Promise<Response> | Response

export type RouteHandlers = {
  DELETE?: RouteHandler
  GET?: RouteHandler
  PATCH?: RouteHandler
  POST?: RouteHandler
  PUT?: RouteHandler
}

export type BaseAdminAdapter = {
  /** Create route handlers for REST + GraphQL endpoints */
  createRouteHandlers: (config: SanitizedConfig) => RouteHandlers
  /** Delete a cookie */
  deleteCookie: (name: string) => void
  /** Destroy the adapter (cleanup) */
  destroy?: () => Promise<void> | void
  /** Generate metadata for the admin panel */
  generateMetadata?: (args: { config: SanitizedConfig }) => Promise<Record<string, unknown>>
  /** Get a cookie value by name */
  getCookie: (name: string) => string | undefined
  /** Handle server function dispatching */
  handleServerFunctions: ServerFunctionHandler
  /** Initialize the request context, returning a PayloadRequest and related data */
  initReq: (args: { config: SanitizedConfig; importMap: ImportMap }) => Promise<InitReqResult>
  /** Adapter name for identification */
  name: string
  /** Server-side not found navigation — throws framework-specific error */
  notFound: () => never
  /** The Payload instance, set after init */
  payload: Payload
  /** Server-side redirect navigation — throws framework-specific error */
  redirect: (url: string) => never
  /** Client-side router provider wrapping framework navigation hooks */
  RouterProvider: React.ComponentType<{ children: React.ReactNode }>
  /** Set a cookie */
  setCookie: (name: string, value: string, options?: CookieOptions) => void
}

export type AdminAdapterResult<T extends BaseAdminAdapter = BaseAdminAdapter> = {
  /** Initialize the adapter, binding it to the Payload instance */
  init: (args: { payload: Payload }) => T
  /** Adapter name for identification */
  name: string
}
