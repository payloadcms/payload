import { createServerFn } from '@tanstack/react-start'

import { getToSerializable } from './getToSerializable.js'

export const loadDashboard = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAdminPageData } = await import('@payloadcms/tanstack-start/views/server')
  const config = (await import('@payload-config')).default
  const { importMap } = await import('../importMap.server.js')
  const toSerializable = await getToSerializable()

  const result = await getAdminPageData({
    configPromise: config,
    importMap,
    params: { segments: [] },
    searchParams: {},
  })

  if ('redirect' in result) {
    return { _redirect: result.redirect } as any
  }
  return toSerializable(result.data) as any
})

export const loadAdminPage = createServerFn({ method: 'GET' })
  .inputValidator((data: { _splat: string; search: Record<string, string | string[]> }) => data)
  .handler(async ({ data }) => {
    const { getAdminPageData } = await import('@payloadcms/tanstack-start/views/server')
    const config = (await import('@payload-config')).default
    const { importMap } = await import('../importMap.server.js')
    const toSerializable = await getToSerializable()

    const segments = data._splat ? data._splat.split('/').filter(Boolean) : []
    const result = await getAdminPageData({
      configPromise: config,
      importMap,
      params: { segments },
      searchParams: data.search ?? {},
    })

    if ('redirect' in result) {
      return { _redirect: result.redirect } as any
    }
    return toSerializable(result.data) as any
  })
