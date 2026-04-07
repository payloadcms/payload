import { createServerFn } from '@tanstack/react-start'

export const getLayoutDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getLayoutData } = await import('@payloadcms/tanstack-start/layouts')
  const config = (await import('@payload-config')).default
  const { importMap } = await import('../importMap.js')
  return getLayoutData({ configPromise: config, importMap })
})
