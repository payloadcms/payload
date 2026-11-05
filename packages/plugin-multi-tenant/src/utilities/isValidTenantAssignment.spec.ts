import type { PayloadRequest } from 'payload'

import { describe, expect, it } from 'vitest'

import { isValidTenantAssignment } from './isValidTenantAssignment.js'

const tenantsArrayFieldName = 'tenants'
const tenantsArrayTenantFieldName = 'tenant'

const memberOfTenantA = {
  id: 'user-1',
  collection: 'users',
  tenants: [{ tenant: 'tenant-a' }],
}

type CheckArgs = {
  payloadAPI?: string
  previousValue?: unknown
  user?: unknown
  userHasAccessToAllTenants?: (user: unknown) => boolean
  value: unknown
}

const check = ({
  payloadAPI = 'REST',
  previousValue,
  user = memberOfTenantA,
  userHasAccessToAllTenants,
  value,
}: CheckArgs): boolean =>
  isValidTenantAssignment({
    previousValue,
    req: { payloadAPI, user } as unknown as PayloadRequest,
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    userHasAccessToAllTenants,
    value,
  })

describe('isValidTenantAssignment', () => {
  it('should allow a tenant the user is assigned to', () => {
    expect(check({ value: 'tenant-a' })).toBe(true)
  })

  it('should reject a tenant the user is not assigned to', () => {
    expect(check({ value: 'tenant-b' })).toBe(false)
  })

  it('should allow an unchanged tenant even when it is outside the user list', () => {
    expect(check({ previousValue: 'tenant-b', value: 'tenant-b' })).toBe(true)
  })

  it('should reject clearing an existing tenant', () => {
    expect(check({ previousValue: 'tenant-a', value: null })).toBe(false)
  })

  it('should allow a userless Local API write', () => {
    expect(check({ payloadAPI: 'local', user: null, value: 'tenant-b' })).toBe(true)
  })

  it('should reject a userless request that names a tenant', () => {
    expect(check({ user: null, value: 'tenant-b' })).toBe(false)
  })

  it('should allow any tenant for a user with access to all tenants', () => {
    expect(check({ userHasAccessToAllTenants: () => true, value: 'tenant-b' })).toBe(true)
  })

  it('should not call userHasAccessToAllTenants with a null user', () => {
    const predicate = (user: unknown): boolean => (user as { roles: string[] }).roles.includes('a')

    expect(() =>
      check({ payloadAPI: 'local', user: null, userHasAccessToAllTenants: predicate, value: null }),
    ).not.toThrow()
  })

  it('should reject a hasMany value that mixes assigned and unassigned tenants', () => {
    expect(check({ value: ['tenant-a', 'tenant-b'] })).toBe(false)
  })

  it('should treat a numeric ID and its string form as the same tenant', () => {
    const user = { id: 1, collection: 'users', tenants: [{ tenant: 1 }] }

    expect(check({ user, value: '1' })).toBe(true)
    expect(check({ user, value: 1 })).toBe(true)
    expect(check({ user, value: '2' })).toBe(false)
  })

  it('should reject a tenant value it cannot read rather than throw', () => {
    expect(check({ value: [null] })).toBe(false)
  })
})
