import { parseCookies } from 'payload'

export function getTenantFromCookie(headers: Headers) {
  const cookies = parseCookies(headers)
  const selectedTenant = cookies.get('payload-tenant') || null
  return selectedTenant
}
