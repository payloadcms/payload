import type { I18n, I18nClient } from '@payloadcms/translations'
import type { ImportMap, InitReqResult, SanitizedConfig, ServerAdapter } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { getRequest } from '@tanstack/react-start/server'
import {
  createLocalReq,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
} from 'payload'
import * as qs from 'qs-esm'

import { getRequestLocale } from './getRequestLocale.js'
import { tanstackServerAdapter } from './serverAdapter.server.js'

/**
 * Initializes a Payload request object from the current TanStack Start server context.
 * Uses `getRequest()` from `@tanstack/react-start/server` to access the incoming request.
 */
export async function initReq({
  configPromise,
  importMap,
  overrides,
  serverAdapter = tanstackServerAdapter,
}: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  overrides?: Parameters<typeof createLocalReq>[0]
  /**
   * `ServerAdapter` attached to `req.server`. Defaults to the native
   * `tanstackServerAdapter` (throws TanStack `redirect`/`notFound`). The admin
   * page render passes an error-contract adapter so navigation thrown mid-render
   * is caught at the loader boundary and re-thrown as native TanStack nav.
   */
  serverAdapter?: ServerAdapter
}): Promise<InitReqResult> {
  const webRequest = getRequest()
  const headers = new Headers(webRequest.headers)
  const cookies = parseCookies(headers)

  const config = await configPromise
  const payload = await getPayload({ config, importMap })

  const languageCode = getRequestLanguage({
    config,
    cookies,
    headers,
  })

  const i18n: I18nClient = await initI18n({
    config: config.i18n,
    context: 'client',
    language: languageCode,
  })

  const { responseHeaders, user } = await executeAuthStrategies({
    headers,
    payload,
  })

  const { req: reqOverrides, ...optionsOverrides } = overrides || {}

  // Parse the active URL's query string so that `req.query` (and thus
  // `getRequestLocale`, access checks, etc.) reflect things like `?locale=es`
  // even when the caller (e.g. the root layout loader) hasn't explicitly
  // forwarded `searchParams` via overrides. `createLocalReq` only defaults
  // `req.query` to `{}` and never reads the request URL itself.
  let queryFromUrl: Record<string, unknown> | undefined
  try {
    const urlObject = new URL(webRequest.url)
    if (urlObject.search) {
      queryFromUrl = qs.parse(urlObject.search, {
        depth: 10,
        ignoreQueryPrefix: true,
      }) as Record<string, unknown>
    }
  } catch {
    queryFromUrl = undefined
  }

  const req = await createLocalReq(
    {
      req: {
        headers,
        host: headers.get('host') ?? undefined,
        i18n: i18n as I18n,
        query: queryFromUrl,
        responseHeaders,
        // Expose the `ServerAdapter` so framework-agnostic server functions can
        // set cookies / redirect via `req.server` (mirrors the Next.js adapter,
        // which passes `nextServerAdapter`). Required by handlers like
        // `switch-language`. Defaults to the native adapter; the page render
        // overrides it with the error-contract adapter.
        server: serverAdapter,
        url: webRequest.url,
        user,
        ...(reqOverrides || {}),
      },
      ...(optionsOverrides || {}),
    },
    payload,
  )

  const locale = await getRequestLocale({ req })

  req.locale = locale?.code

  const permissions = await getAccessResults({ req })

  return {
    cookies,
    headers,
    languageCode,
    locale,
    permissions,
    req,
  }
}
