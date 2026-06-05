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
 *      page-render `ServerAdapter` records navigation intent and throws the
 *      framework-agnostic error contract.
 *   2. Pipes the resulting React server tree through `renderServerComponent`
 *      to produce a Flight payload the client consumes directly.
 *   3. Resolves page metadata via the same shared `generatePageMetadata`
 *      Next.js uses, returning plain serializable strings for `head()`.
 *
 * Navigation surfaces two ways and both become a `_notFound` / `_redirect`
 * sentinel the route loader re-throws as native TanStack nav:
 * - thrown during `renderRoot` orchestration (e.g. the login redirect) → caught
 *   by the try/catch below;
 * - thrown deep inside a streamed view component (e.g. `DocumentView` access
 *   denied, `LoginView` already-authenticated) → swallowed into the RSC stream,
 *   so it's read from the `nav` holder after `renderServerComponent` resolves.
 */
export const loadAdminPageRSC = createServerFn({ method: 'GET' })
  .inputValidator((data: LoadInput): LoadInput => data ?? {})
  .handler(async ({ data }) => {
    const { renderRoot } = await import('@payloadcms/ui/views/Root')
    const { defaultAdminViews } = await import('@payloadcms/ui/views/Root/adminViews')
    const { generatePageMetadata } = await import('@payloadcms/ui/views/Root/generatePageMetadata')
    const { createPageRenderServerAdapter, getRequestI18n, initReq } = await import(
      '@payloadcms/tanstack-start/server'
    )
    const config = await (await import('@payload-config')).default
    const { importMap } = await import('../importMap.js')

    const splatSegments = data._splat ? data._splat.split('/').filter(Boolean) : []
    // Match Next's optional-catch-all behavior: the admin root (`/admin`) has no
    // segments. Passing an empty array makes the shared `renderRoot` build
    // `currentRoute` as `/admin/` (trailing slash), which no longer equals
    // `adminRoute` and causes `handleAuthRedirect` to append `?redirect=/admin/`.
    // Passing `undefined` yields `currentRoute = /admin`, so the unauthenticated
    // redirect lands on a clean `/admin/login`.
    const segments = splatSegments.length > 0 ? splatSegments : undefined
    const searchParams = data.search ?? {}

    // Records navigation requested via `req.server.*` (including throws swallowed
    // by RSC streaming deep inside view components). Read after the render.
    const nav: { type?: 'notFound' | 'redirect'; url?: string } = {}
    const pageServerAdapter = createPageRenderServerAdapter(nav)

    // `renderRoot` calls `initReq` itself with its own overrides (query
    // re-nesting, `urlSuffix`, `fallbackLocale`). Forward them, injecting the
    // page-render `ServerAdapter` so `req.server.redirect()` / `.notFound()`
    // is recorded + thrown rather than escaping as raw TanStack nav.
    const boundInitReq: Parameters<typeof renderRoot>[0]['initReq'] = (args) =>
      initReq({
        configPromise: args.configPromise,
        importMap: args.importMap,
        overrides: args.overrides,
        serverAdapter: pageServerAdapter,
      })

    const notFound = (): never => {
      nav.type = 'notFound'
      throw new Error('not-found')
    }
    const redirect = (url: string): never => {
      nav.type = 'redirect'
      nav.url = url
      throw new Error(`redirect:${url}`)
    }

    try {
      const node = await renderRoot({
        adminViews: defaultAdminViews,
        config: Promise.resolve(config),
        importMap,
        initReq: boundInitReq,
        notFound,
        params: Promise.resolve({ segments: segments as string[] }),
        redirect,
        searchParams: Promise.resolve(searchParams),
      })

      const rscPayload = await renderServerComponent(node as React.ReactElement)

      // Navigation thrown deep inside a streamed view component (e.g. access
      // denied → notFound, already-authenticated → redirect) is swallowed into
      // the RSC stream and never rejects the render. Honor it from the holder,
      // discarding the (broken) payload from the aborted render.
      if (nav.type === 'redirect' && nav.url) {
        return { _redirect: nav.url } as LoadResult
      }
      if (nav.type === 'notFound') {
        // Render Payload's NotFound view (`.not-found`) rather than signalling
        // TanStack's generic `notFound()`, matching the Next adapter which
        // serves `renderNotFoundPage` for `req.server.notFound()`.
        const { renderNotFoundPage } = await import('@payloadcms/ui/views/NotFound/page')
        const notFoundNode = await renderNotFoundPage({
          config: Promise.resolve(config),
          importMap,
          initReq: boundInitReq,
          params: Promise.resolve({ segments: segments as string[] }),
          searchParams: Promise.resolve(searchParams),
        })
        const notFoundPayload = await renderServerComponent(notFoundNode as React.ReactElement)

        return {
          metadata: { title: 'Not Found' },
          rscPayload: notFoundPayload,
        } as unknown as LoadResult
      }

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
      if (nav.type === 'notFound' || message === 'not-found') {
        return { _notFound: true } as LoadResult
      }
      if (nav.type === 'redirect' || message.startsWith('redirect:')) {
        return { _redirect: nav.url ?? message.slice('redirect:'.length) } as LoadResult
      }
      throw err
    }
  })
