import { payloadApiHandlers } from '@payloadcms/tanstack-start/server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_payload/custom-api/$')({
  server: {
    handlers: payloadApiHandlers({
      getConfig: async () => {
        const config = await (await import('@payload-config')).default

        return {
          ...config,
          routes: {
            ...config.routes,
            api: '/custom-api',
          },
        }
      },
    }),
  },
})
