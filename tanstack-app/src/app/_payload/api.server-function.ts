import { createFileRoute } from '@tanstack/react-router'

const handler = async ({ request }: { request: Request }) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await request.json()
    const { handleServerFunctionRequest } = await import('../../functions/serverFunction.api.js')
    const result = await handleServerFunctionRequest(body, request.headers)

    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    console.error('[payload server-function error]', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    })
  }
}

export const Route = createFileRoute('/_payload/api/server-function')({
  server: {
    handlers: {
      POST: handler,
    },
  },
})
