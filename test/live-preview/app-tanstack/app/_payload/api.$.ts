import { payloadApiHandlers } from '@payloadcms/tanstack-start/server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_payload/api/$')({
  server: {
    handlers: payloadApiHandlers({
      getConfig: async () => (await import('@payload-config')).default,
    }),
  },
})
