import { describe, it, expect } from 'vitest'

describe('Multi-Tenant Single-Tenant Auto-Select Protection (#17833)', () => {
  it('preserves undefined initialValue for users with global access (userHasAccessToAllTenants)', () => {
    const tenantOptions = [{ label: 'Tenant 1', value: 'tenant-1' }]
    const user = { id: 'admin-1', role: 'super-admin' }
    const userHasAccessToAllTenants = (u: any) => u.role === 'super-admin'

    const hasGlobalAccess =
      typeof userHasAccessToAllTenants === 'function' ? userHasAccessToAllTenants(user) : false

    const initialValue = hasGlobalAccess
      ? undefined
      : tenantOptions.length > 1
        ? undefined
        : tenantOptions[0]?.value

    expect(initialValue).toBeUndefined()
  })

  it('auto-selects the single tenant when the user does not have global access', () => {
    const tenantOptions = [{ label: 'Tenant 1', value: 'tenant-1' }]
    const user = { id: 'user-1', role: 'member' }
    const userHasAccessToAllTenants = (u: any) => u.role === 'super-admin'

    const hasGlobalAccess =
      typeof userHasAccessToAllTenants === 'function' ? userHasAccessToAllTenants(user) : false

    const initialValue = hasGlobalAccess
      ? undefined
      : tenantOptions.length > 1
        ? undefined
        : tenantOptions[0]?.value

    expect(initialValue).toBe('tenant-1')
  })

  it('preserves undefined initialValue when multiple tenants exist', () => {
    const tenantOptions = [
      { label: 'Tenant 1', value: 'tenant-1' },
      { label: 'Tenant 2', value: 'tenant-2' },
    ]
    const user = { id: 'user-1', role: 'member' }
    const userHasAccessToAllTenants = () => false

    const hasGlobalAccess = userHasAccessToAllTenants()

    const initialValue = hasGlobalAccess
      ? undefined
      : tenantOptions.length > 1
        ? undefined
        : tenantOptions[0]?.value

    expect(initialValue).toBeUndefined()
  })
})
