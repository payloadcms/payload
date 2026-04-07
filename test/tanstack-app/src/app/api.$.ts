import { handleEndpoints } from 'payload'
import { createFileRoute } from '@tanstack/react-router'
import config from '@payload-config'

const handler = async ({ request }: { request: Request }) => {
  const url = new URL(request.url)
  const slugParts = url.pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean)
  const path = slugParts.length ? `/api/${slugParts.join('/')}` : '/api'

  return handleEndpoints({
    config,
    path,
    request,
  })
}

export const Route = createFileRoute('/api/$')({
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
