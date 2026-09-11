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

  it('awaits async validate override and preserves required check on empty value', async () => {
    let customValidatorCalled = false
    const plugin = multiTenantPlugin({
      collections: {
        pages: {},
      },
      tenantField: {
        validate: async (value) => {
          customValidatorCalled = true
          await Promise.resolve()
          return true
        },
      },
    })
    const config = await plugin({
      collections: [
        { slug: 'users', auth: true, fields: [] },
        { slug: 'tenants', fields: [] },
        { slug: 'pages', fields: [] },
      ],
    } as Config)

    const pagesCollection = config.collections?.find(({ slug }) => slug === 'pages')
    const tenantField = pagesCollection?.fields.find(
      (field) => 'name' in field && field.name === 'tenant',
    ) as { validate?: (value: unknown, options: unknown) => Promise<string | true> | string | true }

    expect(tenantField).toBeDefined()
    expect(tenantField.validate).toBeDefined()

    const mockOptions = {
      hasMany: false,
      req: {
        t: (key: string) => `translated:${key}`,
      },
    }

    // 1. When value is missing (null / undefined), required check must fail even though async validate resolved true
    customValidatorCalled = false
    const missingValueResult = await tenantField.validate?.(null, mockOptions)
    expect(customValidatorCalled).toBe(true)
    expect(missingValueResult).toBe('translated:validation:required')

    // 2. When value is present, async validate resolves true and check passes
    customValidatorCalled = false
    const validValueResult = await tenantField.validate?.('tenant-1', mockOptions)
    expect(customValidatorCalled).toBe(true)
    expect(validValueResult).toBe(true)

    // 3. When custom async validate returns an error string, that error is returned
    const pluginWithError = multiTenantPlugin({
      collections: { pages: {} },
      tenantField: {
        validate: async () => {
          await Promise.resolve()
          return 'custom-validation-failed'
        },
      },
    })
    const configWithError = await pluginWithError({
      collections: [
        { slug: 'users', auth: true, fields: [] },
        { slug: 'tenants', fields: [] },
        { slug: 'pages', fields: [] },
      ],
    } as Config)
    const pagesWithError = configWithError.collections?.find(({ slug }) => slug === 'pages')
    const tenantFieldWithError = pagesWithError?.fields.find(
      (field) => 'name' in field && field.name === 'tenant',
    ) as { validate?: (value: unknown, options: unknown) => Promise<string | true> | string | true }

    const errorResult = await tenantFieldWithError.validate?.('tenant-1', mockOptions)
    expect(errorResult).toBe('custom-validation-failed')
  })
})
