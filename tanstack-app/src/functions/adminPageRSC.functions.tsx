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
 * Server function that:
 *   1. Initializes the Payload request (TanStack-side `initReq`).
 *   2. Calls the shared `renderAdminPage` helper from `@payloadcms/ui`
 *      to produce a React server tree (template chrome + view RSC).
 *   3. Pipes that tree through TanStack's `renderServerComponent` to
 *      produce a Flight payload that the client can consume directly.
 *
 * Replaces the legacy `loadAdminPage` data-only pipeline that returned a
 * giant serialized blob the client had to rebuild into a React tree.
 *
 * Returns a sidecar `metadata` object the route loader uses to build
 * `head()` / `<meta>` entries.
 */
export const loadAdminPageRSC = createServerFn({ method: 'GET' })
  .inputValidator((data: LoadInput): LoadInput => data ?? {})
  .handler(async ({ data }): Promise<LoadResult> => {
    const { renderAdminPage } = await import('@payloadcms/ui/views/Root/renderAdminPage')
    const { initReq } = await import('@payloadcms/tanstack-start/server')
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

      return { metadata, rscPayload }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message === 'not-found') {
        return { _notFound: true }
      }
      if (message.startsWith('redirect:')) {
        return { _redirect: message.slice('redirect:'.length) }
      }
      throw err
    }
  })
