import { payloadApiRoute } from '@payloadcms/tanstack-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_payload/api/$')(
  payloadApiRoute({ getConfig: async () => (await import('@payload-config')).default }),
)
