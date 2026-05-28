import type { ImportMap, SanitizedConfig } from 'payload'

import { renderAdminPage } from '@payloadcms/ui/views/Root/renderAdminPage'
import { notFound, redirect } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import { initReq } from '../utilities/initReq.js'

export type { GenerateViewMetadata } from './generatePageMetadata.js'

/**
 * Next.js RootPage — single entry-point for the entire admin panel.
 *
 * Thin wrapper around the framework-agnostic `renderAdminPage` helper in
 * `@payloadcms/ui`. Responsibilities:
 *
 *  1. Await Next's `Promise<...>` route segment params.
 *  2. Call Next's `initReq` (which uses `next/headers`).
 *  3. Delegate to `renderAdminPage` for all view/template rendering.
 *  4. Translate the shared error contract (`Error('not-found')`,
 *     `Error('redirect:<url>')`) into Next's native `notFound()` / `redirect()`.
 */
export const RootPage = async ({
  config: configPromise,
  importMap,
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly params: Promise<{
    segments: string[]
  }>
  readonly searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) => {
  const config = await configPromise
  const params = await paramsPromise
  const searchParams = await searchParamsPromise

  const {
    routes: { admin: adminRoute },
  } = config

  const segments = Array.isArray(params.segments) ? params.segments : []
  const currentRoute = formatAdminURL({
    adminRoute,
    path: segments.length ? `/${segments.join('/')}` : null,
  })
  const queryString = qs.stringify(searchParams ?? {}, { addQueryPrefix: true })

  const initResult = await initReq({
    configPromise: config,
    importMap,
    key: 'initPage',
    overrides: {
      fallbackLocale: false,
      req: {
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true,
        }),
      },
      urlSuffix: `${currentRoute}${searchParams ? queryString : ''}`,
    },
  })

  try {
    return await renderAdminPage({
      config,
      importMap,
      initResult,
      params,
      searchParams,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'not-found') {
      return notFound()
    }
    if (message.startsWith('redirect:')) {
      redirect(message.slice('redirect:'.length))
    }
    throw error
  }
}
