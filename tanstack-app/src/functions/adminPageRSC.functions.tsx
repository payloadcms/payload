import type { AdminPageMetadata } from '@payloadcms/tanstack-start'
import type { MetaConfig } from 'payload'

import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'

type LoadInput = {
  _splat?: string
  search?: Record<string, string | string[]>
}

type LoadResult =
  | { _notFound: true; routeKey?: string; rscPayload?: React.ReactNode }
  | { _redirect: string }
  | {
      metadata: AdminPageMetadata
      /**
       * Stable identity for this rendered route (the splat, i.e. the path
       * after `/admin/`). The client keys the rendered subtree by this so the
       * view remounts exactly when a new payload arrives. Keying by
       * `location.pathname` instead races: the pathname updates before
       * `useLoaderData()` during a transition, so the subtree would remount
       * with the *previous* payload and then reconcile the fresh payload in
       * place — leaving client providers (DocumentInfo, etc.) holding stale
       * `useState` values from the prior document. Search params are excluded
       * so search-only changes (e.g. list-view filtering) reconcile in place.
       */
      routeKey: string
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
 * Flattens the framework-agnostic `MetaConfig` (Next.js `Metadata` shape) into
 * the plain, serializable `AdminPageMetadata` the route loader ships to the
 * client. The full `MetaConfig` carries a `URL` `metadataBase`, functions and
 * other non-serializable values that seroval cannot cross the wire, so only the
 * fields `getAdminMeta` renders are extracted.
 */
const toAdminPageMetadata = (meta: MetaConfig): AdminPageMetadata => {
  const og = meta.openGraph as
    | {
        description?: unknown
        images?: unknown
        siteName?: unknown
        title?: unknown
      }
    | undefined

  const rawImages = og?.images
  const imagesArray = rawImages ? (Array.isArray(rawImages) ? rawImages : [rawImages]) : []
  const images = imagesArray
    .map((image: any) =>
      typeof image === 'string'
        ? { url: image }
        : image?.url
          ? { alt: image.alt, height: image.height, url: String(image.url), width: image.width }
          : undefined,
    )
    .filter(Boolean) as AdminPageMetadata['openGraph']['images']

  const rawIcons = meta.icons as any
  const iconList = Array.isArray(rawIcons)
    ? rawIcons
    : rawIcons && typeof rawIcons === 'object' && Array.isArray(rawIcons.icon)
      ? rawIcons.icon
      : []
  const icons = iconList
    .map((icon: any) =>
      typeof icon === 'string'
        ? { rel: 'icon', url: icon }
        : icon?.url
          ? {
              type: icon.type,
              media: icon.media,
              rel: icon.rel ?? 'icon',
              sizes: icon.sizes,
              url: String(icon.url),
            }
          : undefined,
    )
    .filter(Boolean) as AdminPageMetadata['icons']

  const keywords = meta.keywords

  return {
    description: typeof meta.description === 'string' ? meta.description : undefined,
    icons: icons?.length ? icons : undefined,
    keywords:
      typeof keywords === 'string'
        ? keywords
        : Array.isArray(keywords)
          ? keywords.join(', ')
          : undefined,
    openGraph: og
      ? {
          description: typeof og.description === 'string' ? og.description : undefined,
          images: images?.length ? images : undefined,
          siteName: typeof og.siteName === 'string' ? og.siteName : undefined,
          title: typeof og.title === 'string' ? og.title : undefined,
        }
      : undefined,
    robots: typeof meta.robots === 'string' ? meta.robots : undefined,
    title: resolveTitle(meta.title),
  }
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

    // Build the 404 result the route loader re-throws as TanStack `notFound()`.
    //
    // Throwing `notFound()` is the only way to set the SSR document status to 404
    // (it's read from `router.stores.statusCode`, set by a not-found match — NOT
    // from `setResponseStatus`, which only affects the RSC RPC response). But the
    // matching `notFoundComponent` is a client component with no access to the
    // Payload `req`, so it can't build the admin chrome on its own. To match Next
    // (whose not-found route renders the full admin layout — nav sidebar, etc. —
    // around the NotFound body, see `renderNotFoundPage`), we render that same
    // shared `renderNotFoundPage` tree here, server-side, and ship its Flight
    // payload through the `notFound()` error so the client renders it verbatim.
    // For users without admin access `renderNotFoundPage` returns the bare
    // `NotFoundClient`, preserving the access-denied behavior.
    const renderNotFound = async (): Promise<LoadResult> => {
      const { renderNotFoundPage } = await import('@payloadcms/ui/views/NotFound/page')

      const notFoundNode = await renderNotFoundPage({
        config: Promise.resolve(config),
        importMap,
        initReq: (args) =>
          initReq({
            configPromise: args.configPromise,
            importMap: args.importMap,
            overrides: args.overrides,
          }),
        params: Promise.resolve({ segments: splatSegments }),
        searchParams: Promise.resolve(searchParams),
      })

      const rscPayload = await renderServerComponent(notFoundNode as React.ReactElement)

      return { _notFound: true, routeKey: data._splat ?? '', rscPayload }
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

      // Navigation thrown deep inside a streamed view component (e.g. access
      // denied → notFound, already-authenticated → redirect) is swallowed into
      // the RSC stream and never rejects the render. Honor it from the holder,
      // discarding the (broken) payload from the aborted render.
      if (nav.type === 'redirect' && nav.url) {
        return { _redirect: nav.url } as LoadResult
      }
      if (nav.type === 'notFound') {
        return await renderNotFound()
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

      return {
        metadata: toAdminPageMetadata(meta),
        routeKey: data._splat ?? '',
        rscPayload,
      } as unknown as LoadResult
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (nav.type === 'notFound' || message === 'not-found') {
        return await renderNotFound()
      }
      if (nav.type === 'redirect' || message.startsWith('redirect:')) {
        return { _redirect: nav.url ?? message.slice('redirect:'.length) } as LoadResult
      }
      throw err
    }
  })
