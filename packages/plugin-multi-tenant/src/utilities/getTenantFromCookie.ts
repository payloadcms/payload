import { parseCookies } from 'payload'

export function getTenantFromCookie(
  headers: Headers,
  idType: 'number' | 'text',
): null | number | string {
  const cookies = parseCookies(headers)
  const selectedTenant = cookies.get('payload-tenant') || null
  return selectedTenant ? (idType === 'number' ? parseInt(selectedTenant) : selectedTenant) : null
}
