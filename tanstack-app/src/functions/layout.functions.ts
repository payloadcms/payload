import { createServerFn } from '@tanstack/react-start'

export const getLayoutDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getLayoutData } = await import('@payloadcms/tanstack-start/layouts')
    const { toSerializable } = await import('@payloadcms/tanstack-start/server')
    const config = (await import('@payload-config')).default
    const { importMap } = await import('../importMap.js')
    return toSerializable(await getLayoutData({ configPromise: config, importMap })) as any
  } catch (err: any) {
    console.error('[getLayoutDataFn] Error:', err?.message, err?.stack)
    throw err
  }
})
