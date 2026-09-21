import { describe, expect, it } from 'vitest'

import { tenantField } from './index.js'

const baseArgs = {
  adminUsersSlug: 'users',
  name: 'tenant',
  tenantsArrayFieldName: 'tenants',
  tenantsArrayTenantFieldName: 'tenant',
  tenantsCollectionSlug: 'tenants',
  unique: false,
}

describe('tenantField access', () => {
  it('should let the admin users collection write the tenant field', () => {
    const field = tenantField(baseArgs)
    const req = { user: { collection: 'users' } }

    expect(field.access!.create!({ req } as never)).toBe(true)
    expect(field.access!.update!({ req } as never)).toBe(true)
  })

  it('should block other auth collections from writing the tenant field', () => {
    const field = tenantField(baseArgs)
    const req = { user: { collection: 'customers' } }

    expect(field.access!.create!({ req } as never)).toBe(false)
    expect(field.access!.update!({ req } as never)).toBe(false)
  })

  it('should block an unauthenticated request from writing the tenant field', () => {
    const field = tenantField(baseArgs)
    const req = { user: null }

    expect(field.access!.create!({ req } as never)).toBe(false)
    expect(field.access!.update!({ req } as never)).toBe(false)
  })
})
