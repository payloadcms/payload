import { createServerFn } from '@tanstack/react-start'

import { getToSerializable } from './getToSerializable.js'

export const getLayoutDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getLayoutData } = await import('@payloadcms/tanstack-start/layouts')
  const config = (await import('@payload-config')).default
  const { importMap } = await import('../importMap.server.js')
  const toSerializable = await getToSerializable()
  return toSerializable(await getLayoutData({ configPromise: config, importMap })) as any
})
