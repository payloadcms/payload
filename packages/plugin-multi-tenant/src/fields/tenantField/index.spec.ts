import { describe, expect, it, vi } from 'vitest'

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

describe('tenantField default value', () => {
  it('should assign the only available tenant when the field is hidden', async () => {
    const field = tenantField({
      ...baseArgs,
      overrides: { admin: { hidden: true } },
      userHasAccessToAllTenants: () => true,
    })
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 'blue-dog' }], totalDocs: 1 })
    const req = {
      headers: new Headers(),
      payload: { collections: { tenants: { customIDType: 'text' } }, db: {}, find },
      user: { collection: 'users' },
    }

    expect(typeof field.defaultValue).toBe('function')
    if (typeof field.defaultValue !== 'function') {
      return
    }

    expect(await field.defaultValue({ req } as never)).toBe('blue-dog')
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'tenants', overrideAccess: false, user: req.user }),
    )
  })

  it('should leave a hidden tenant field unassigned when multiple tenants are available', async () => {
    const field = tenantField({
      ...baseArgs,
      overrides: { admin: { hidden: true } },
      userHasAccessToAllTenants: () => true,
    })
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 'blue-dog' }, { id: 'red-cat' }] })
    const req = {
      headers: new Headers(),
      payload: { collections: { tenants: { customIDType: 'text' } }, db: {}, find },
      user: { collection: 'users' },
    }

    expect(typeof field.defaultValue).toBe('function')
    if (typeof field.defaultValue !== 'function') {
      return
    }

    expect(await field.defaultValue({ req } as never)).toBeNull()
  })
})
