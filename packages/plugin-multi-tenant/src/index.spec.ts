import type { ArrayField, Config } from 'payload'

import { describe, expect, it } from 'vitest'

import { multiTenantPlugin } from './index.js'

describe('multiTenantPlugin', () => {
  it('applies tenant assignment access defaults', async () => {
    let hasAllTenantAccess = false
    const plugin = multiTenantPlugin({
      collections: {},
      userHasAccessToAllTenants: () => hasAllTenantAccess,
    })
    const config = await plugin({
      collections: [
        { slug: 'users', auth: true, fields: [] },
        { slug: 'tenants', fields: [] },
      ],
    } as Config)
    const usersCollection = config.collections?.find(({ slug }) => slug === 'users')
    const tenantsField = usersCollection?.fields.find(
      (field): field is ArrayField => 'name' in field && field.name === 'tenants',
    )
    const accessArgs = { req: { user: { id: 'test-user' } } } as never

    expect(await tenantsField?.access?.create?.(accessArgs)).toBe(false)
    expect(await tenantsField?.access?.update?.(accessArgs)).toBe(false)

    hasAllTenantAccess = true

    expect(await tenantsField?.access?.create?.(accessArgs)).toBe(true)
    expect(await tenantsField?.access?.update?.(accessArgs)).toBe(true)
  })

  it('retains configured tenant assignment access callbacks', async () => {
    const createAccess = () => false
    const updateAccess = () => true
    const plugin = multiTenantPlugin({
      collections: {},
      tenantsArrayField: {
        arrayFieldAccess: {
          create: createAccess,
          update: updateAccess,
        },
      },
    })
    const config = await plugin({
      collections: [
        { slug: 'users', auth: true, fields: [] },
        { slug: 'tenants', fields: [] },
      ],
    } as Config)
    const usersCollection = config.collections?.find(({ slug }) => slug === 'users')
    const tenantsField = usersCollection?.fields.find(
      (field): field is ArrayField => 'name' in field && field.name === 'tenants',
    )

    expect(tenantsField?.access?.create).toBe(createAccess)
    expect(tenantsField?.access?.update).toBe(updateAccess)
  })
})
