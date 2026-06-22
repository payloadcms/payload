import { createFileRoute } from '@tanstack/react-router'

const handler = async ({ request }: { request: Request }) => {
  const { handleAPIRoute } = await import('~/functions/handleAPIRoute.js')
  return handleAPIRoute(request)
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
