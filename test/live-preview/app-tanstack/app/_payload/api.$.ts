import { createFileRoute } from '@tanstack/react-router'

const handler = async ({ request }: { request: Request }) => {
  const { handleAPIRoute } = await import('@payloadcms/tanstack-start/server')
  const config = (await import('@payload-config')).default
  return handleAPIRoute({ config, request })
}

export const Route = createFileRoute('/_payload/api/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
      OPTIONS: handler,
    },
  },
})
