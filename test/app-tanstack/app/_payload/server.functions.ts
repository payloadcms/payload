import type { ServerFunctionClientArgs } from 'payload'

import { createServerFunctionClient } from '@payloadcms/tanstack-start'
import { createServerFn } from '@tanstack/react-start'

type LoadInput = {
  _splat?: string
  search?: Record<string, string | string[]>
}

// Single injection point for the app-owned config + generated importMap, shared
// by all three server functions below.
const getConfig = async () => (await import('@payload-config')).default
const getImportMap = async () => (await import('./importMap.js')).importMap

export const loadAdminPageRSC = createServerFn({ method: 'GET' })
  .validator((data: LoadInput): LoadInput => data ?? {})
  .handler(async ({ data }) => {
    const { loadAdminPage } = await import('@payloadcms/tanstack-start/server')
    return loadAdminPage({
      config: await getConfig(),
      importMap: await getImportMap(),
      search: data.search,
      splat: data._splat,
    })
  })

export const getLayoutDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadLayoutData } = await import('@payloadcms/tanstack-start/layouts')
  return loadLayoutData({ config: await getConfig(), importMap: await getImportMap() })
})

const runPayloadServerFn = createServerFn({ method: 'POST' })
  .validator((args: ServerFunctionClientArgs): ServerFunctionClientArgs => args)
  .handler(async ({ data }) => {
    const { handleServerFunctions } = await import('@payloadcms/tanstack-start/server')
    return (await handleServerFunctions({
      args: data.args,
      config: await getConfig(),
      importMap: await getImportMap(),
      name: data.name,
    })) as any
  })

// `createServerFunctionClient` sanitizes args for TanStack Start's seroval wire
// format before dispatching through `runPayloadServerFn`.
export const serverFunctionHandler = createServerFunctionClient({
  runServerFn: runPayloadServerFn,
})
