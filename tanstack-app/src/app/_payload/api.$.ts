import { createFileRoute } from '@tanstack/react-router'

const handler = async ({ request }: { request: Request }) => {
  const { handleEndpoints } = await import('payload')
  const config = (await import('@payload-config')).default

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
