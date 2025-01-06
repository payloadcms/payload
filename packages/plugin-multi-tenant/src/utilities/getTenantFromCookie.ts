import type { PayloadRequest } from 'payload'

import { parseCookies } from 'payload'

export function getTenantFromCookie(req: PayloadRequest) {
  const cookies = parseCookies(req.headers)
  const selectedTenant = cookies.get('payload-tenant') || null
  return selectedTenant
}
