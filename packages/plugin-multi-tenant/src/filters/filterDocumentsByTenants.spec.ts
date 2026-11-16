import type { PayloadRequest } from 'payload'

import { describe, expect, test } from 'vitest'

import { filterDocumentsByTenants } from './filterDocumentsByTenants.js'

const req = {
  headers: new Headers({ cookie: 'payload-tenant=document; payload-tenant-filter=browsing' }),
  payload: { collections: {}, db: { defaultIDType: 'text' } },
  user: { id: 'admin' },
} as unknown as PayloadRequest
const args = {
  filterFieldName: 'tenant',
  req,
  tenantsCollectionSlug: 'tenants',
  userHasAccessToAllTenants: () => true,
}

describe('document and browsing tenant filters', () => {
  test('should use the browsing selection for collection lists', () => {
    expect(filterDocumentsByTenants({ ...args, useTenantFilter: true })).toEqual({
      tenant: { in: ['browsing'] },
    })
  })

  test('should use document context for relationship pickers', () => {
    expect(filterDocumentsByTenants(args)).toEqual({ tenant: { in: ['document'] } })
  })

  test('should prefer explicit document tenant values for shared relationships', () => {
    expect(filterDocumentsByTenants({ ...args, docTenantID: ['a', 'b'] })).toEqual({
      tenant: { in: ['a', 'b'] },
    })
  })
})
