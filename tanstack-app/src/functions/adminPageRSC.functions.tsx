import type { AdminPageMetadata } from '@payloadcms/ui/views/Root/renderAdminPage'

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

/**
 * Admin-page server function for TanStack Start.
 *
 *   1. Initializes the Payload request (TanStack-side `initReq`).
 *   2. Calls the shared `renderAdminPage` helper from `@payloadcms/ui`
 *      to produce a React server tree (template chrome + view RSC).
 *   3. Pipes that tree through TanStack's `renderServerComponent` to
 *      produce a Flight payload that the client can consume directly.
 *
 * Returns a sidecar `metadata` object the route loader uses to build
 * `head()` / `<meta>` entries.
 */
export const loadAdminPageRSC = createServerFn({ method: 'GET' })
  .inputValidator((data: LoadInput): LoadInput => data ?? {})
  .handler(async ({ data }) => {
    const { renderAdminPage } = await import('@payloadcms/ui/views/Root/renderAdminPage')
    const { initReq, toSerializable } = await import('@payloadcms/tanstack-start/server')
    const config = await (await import('@payload-config')).default
    const { importMap } = await import('../importMap.js')

    const segments = data._splat ? data._splat.split('/').filter(Boolean) : []
    const searchParams = data.search ?? {}

    try {
      const initResult = await initReq({
        configPromise: config,
        importMap,
        overrides: {
          fallbackLocale: false,
          req: { query: searchParams as Record<string, unknown> },
        },
      })

      const metadata: AdminPageMetadata = {}

      const node = await renderAdminPage({
        config,
        importMap,
        initResult,
        metadata,
        params: { segments },
        searchParams,
      })

      const rscPayload = await renderServerComponent(node as React.ReactElement)

      // `metadata.clientConfig` is populated by `renderAdminPage` and can
      // include compiled custom React elements (e.g. `clientConfig.admin.
      // components.*` returned by `RenderServerComponent`). Those carry
      // `$$typeof: Symbol(react.transitional.element)` which seroval refuses
      // to serialize ("The value [object Symbol] of type 'symbol' cannot be
      // parsed/serialized."). Strip them — and any function / RegExp /
      // Symbol references — before crossing the wire. `rscPayload` is the
      // renderable RSC stub from `renderServerComponent`; TanStack Start's
      // `$RSC` serialization adapter handles that one separately so we keep
      // it untouched.
      return {
        metadata: toSerializable(metadata),
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
