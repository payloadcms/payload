import type { PayloadRequest } from 'payload'

export const isPayloadAdminPanel = (req: PayloadRequest) => {
  return (
    req.headers.has('referer') &&
    req.headers
      .get('referer')
      ?.startsWith(`${process.env.NEXT_PUBLIC_SERVER_URL}${req.payload.config.routes.admin}`)
  )
}
