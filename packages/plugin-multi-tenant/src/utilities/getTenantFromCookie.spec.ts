import { describe, expect, test } from 'vitest'

import { getTenantFromCookie } from './getTenantFromCookie.js'

describe('tenant filter and document cookies', () => {
  test('should retain document context while browsing all tenants', () => {
    const headers = new Headers({ cookie: 'payload-tenant=document; payload-tenant-filter=' })

    expect(getTenantFromCookie(headers, 'text')).toBe('document')
    expect(getTenantFromCookie(headers, 'text', { useTenantFilter: true })).toBeNull()
  })

  test('should use the persistent browsing selection independently of document context', () => {
    const headers = new Headers({ cookie: 'payload-tenant=2; payload-tenant-filter=1' })

    expect(getTenantFromCookie(headers, 'number')).toBe(2)
    expect(getTenantFromCookie(headers, 'number', { useTenantFilter: true })).toBe(1)
  })

  test('should preserve legacy selections before the filter cookie is initialized', () => {
    const headers = new Headers({ cookie: 'payload-tenant=existing' })

    expect(getTenantFromCookie(headers, 'text', { useTenantFilter: true })).toBe('existing')
  })
})
