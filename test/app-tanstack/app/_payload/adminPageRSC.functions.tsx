import { createServerFn } from '@tanstack/react-start'

type LoadInput = {
  _splat?: string
  search?: Record<string, string | string[]>
}

/**
 * Thin TanStack Start binding for the admin-page render. All logic lives in
 * `loadAdminPage` from `@payloadcms/tanstack-start`; this shim only supplies the
 * app-owned `config` and generated `importMap`.
 */
export const loadAdminPageRSC = createServerFn({ method: 'GET' })
  .validator((data: LoadInput): LoadInput => data ?? {})
  .handler(async ({ data }) => {
    const { loadAdminPage } = await import('@payloadcms/tanstack-start/server')
    const config = await (await import('@payload-config')).default
    const { importMap } = await import('./importMap.js')

    return loadAdminPage({ config, importMap, search: data.search, splat: data._splat })
  })
