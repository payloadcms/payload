import type { AdminPageMetadata } from '@payloadcms/tanstack-start'
import type { MetaConfig } from 'payload'

import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'

type LoadInput = {
  _splat?: string
  search?: Record<string, string | string[]>
}

type LoadResult =
  | { _notFound: true }
  | { _redirect: string }
  | {
      metadata: AdminPageMetadata
      rscPayload: React.ReactNode
    }

const resolveTitle = (title: MetaConfig['title']): string | undefined => {
  if (!title) {
    return undefined
  }
  if (typeof title === 'string') {
    return title
  }
  if ('absolute' in title) {
    return title.absolute
  }
  return title.default
}

/**
 * Admin-page server function for TanStack Start.
 *
 *   1. Initializes the Payload request via the shared `renderRoot` orchestrator
 *      from `@payloadcms/ui`, passing a TanStack-bound `initReq`. The injected
 *      `errorContractServerAdapter` (plus the string-throwing `notFound` /
 *      `redirect` callbacks) makes navigation thrown mid-render surface as the
 *      framework-agnostic error contract.
 *   2. Pipes the resulting React server tree through `renderServerComponent`
 *      to produce a Flight payload the client consumes directly.
 *   3. Resolves page metadata via the same shared `generatePageMetadata`
 *      Next.js uses, returning plain serializable strings for `head()`.
 *
 * Catches the `not-found` / `redirect:<url>` contract and returns a sentinel;
 * the route loader re-throws TanStack's native `notFound()` / `redirect()` at
 * the loader boundary.
 */
export const loadAdminPageRSC = createServerFn({ method: 'GET' })
  .inputValidator((data: LoadInput): LoadInput => data ?? {})
  .handler(async ({ data }) => {
    const { renderRoot } = await import('@payloadcms/ui/views/Root')
    const { defaultAdminViews } = await import('@payloadcms/ui/views/Root/adminViews')
    const { generatePageMetadata } = await import('@payloadcms/ui/views/Root/generatePageMetadata')
    const { errorContractServerAdapter, getRequestI18n, initReq } = await import(
      '@payloadcms/tanstack-start/server'
    )
    const config = await (await import('@payload-config')).default
    const { importMap } = await import('../importMap.js')

    const segments = data._splat ? data._splat.split('/').filter(Boolean) : []
    const searchParams = data.search ?? {}

    // `renderRoot` calls `initReq` itself with its own overrides (query
    // re-nesting, `urlSuffix`, `fallbackLocale`). Forward them, injecting the
    // error-contract `ServerAdapter` so `req.server.redirect()` / `.notFound()`
    // thrown mid-render are caught below instead of escaping as raw TanStack nav.
    const boundInitReq: Parameters<typeof renderRoot>[0]['initReq'] = (args) =>
      initReq({
        configPromise: args.configPromise,
        importMap: args.importMap,
        overrides: args.overrides,
        serverAdapter: errorContractServerAdapter,
      })

    const notFound = (): never => {
      throw new Error('not-found')
    }
    const redirect = (url: string): never => {
      throw new Error(`redirect:${url}`)
    }

    try {
      const node = await renderRoot({
        adminViews: defaultAdminViews,
        config: Promise.resolve(config),
        importMap,
        initReq: boundInitReq,
        notFound,
        params: Promise.resolve({ segments }),
        redirect,
        searchParams: Promise.resolve(searchParams),
      })

      const rscPayload = await renderServerComponent(node as React.ReactElement)

      // Resolve metadata through the same shared generator Next.js uses. Only
      // plain strings cross the wire (the full `MetaConfig` carries a `URL`
      // `metadataBase` and icons that seroval cannot serialize).
      const i18n = await getRequestI18n({ config })
      const meta = await generatePageMetadata({
        adminViews: defaultAdminViews,
        config,
        i18n,
        params: { segments },
      })

      const metadata: AdminPageMetadata = {
        description: meta.description,
        title: resolveTitle(meta.title),
      }

      return {
        metadata,
        rscPayload,
      } as unknown as LoadResult
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message === 'not-found') {
        return { _notFound: true } as LoadResult
      }
      if (message.startsWith('redirect:')) {
        return { _redirect: message.slice('redirect:'.length) } as LoadResult
      }
      throw err
    }
  })
