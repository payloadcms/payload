import { createServerFn } from '@tanstack/react-start'

/**
 * Thin TanStack Start binding for the admin layout data. All logic lives in
 * `loadLayoutData` from `@payloadcms/tanstack-start`; this shim only supplies
 * the app-owned `config` and generated `importMap`.
 */
export const getLayoutDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadLayoutData } = await import('@payloadcms/tanstack-start/layouts')
  const config = (await import('@payload-config')).default
  const { importMap } = await import('./importMap.js')

  return loadLayoutData({ config, importMap })
})
