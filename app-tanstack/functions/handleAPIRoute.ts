import { handleEndpoints } from 'payload'

export async function handleAPIRoute(request: Request): Promise<Response> {
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
