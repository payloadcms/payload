import { createServerFn } from '@tanstack/react-start'

export const switchLanguageFn = createServerFn({ method: 'POST' })
  .validator((data: string) => data)
  .handler(async ({ data: language }) => {
    const { switchLanguage } = await import('@payloadcms/tanstack-start/server')
    const config = (await import('@payload-config')).default
    await switchLanguage({ config, language })
  })
