/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. MODIFY AT YOUR OWN RISK. */
import { payloadApiHandlers } from '@payloadcms/tanstack-start/rest'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_payload/api/$')({
  server: {
    handlers: payloadApiHandlers({
      getConfig: async () => (await import('@payload-config')).default,
    }),
  },
})
