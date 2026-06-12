import { createServerFn } from '@tanstack/react-start'

export const getLayoutDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getLayoutData } = await import('@payloadcms/tanstack-start/layouts')
    const { toSerializable } = await import('@payloadcms/tanstack-start/server')
    const { renderServerComponent } = await import('@tanstack/react-start/rsc')
    const config = (await import('@payload-config')).default
    const { importMap } = await import('../importMap.js')

    const { providers, ...data } = await getLayoutData({ configPromise: config, importMap })

    // `toSerializable` strips React elements, so render the custom-providers
    // element tree to an RSC payload separately and attach it to the result.
    return {
      ...(toSerializable(data) as any),
      providers: providers ? await renderServerComponent(providers as any) : undefined,
    }
  } catch (err: any) {
    console.error('[getLayoutDataFn] Error:', err?.message, err?.stack)
    throw err
  }
})
