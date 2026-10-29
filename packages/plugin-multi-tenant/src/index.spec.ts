import type { ArrayField, Config, PayloadComponent } from 'payload'

import { describe, expect, it } from 'vitest'

import { multiTenantPlugin } from './index.js'

describe('multiTenantPlugin', () => {
  it.each([
    undefined,
    '@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger',
    { path: '@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger' },
    {
      path: '@payloadcms/plugin-multi-tenant/client',
      exportName: 'AssignTenantFieldTrigger',
    },
  ])(
    'should register the tenant assignment menu item once when reapplied with %j',
    async (trigger) => {
      const customMenuItem = { path: '/components/CustomMenuItem.js#CustomMenuItem' }
      const customMenuItems: PayloadComponent[] = [false, customMenuItem]
      const editMenuItems = [...customMenuItems]

      if (trigger) {
        editMenuItems.push(trigger)
      }

      const plugin = multiTenantPlugin({ collections: { posts: {} } })
      const config = {
        collections: [
          { slug: 'users', auth: true, fields: [] },
          { slug: 'tenants', fields: [] },
          {
            slug: 'posts',
            admin: { components: { edit: { editMenuItems } } },
            fields: [],
          },
        ],
      } as Config

      const builtConfig = await plugin(config)
      await plugin(config)
      await plugin(config)

      const posts = builtConfig.collections?.find(({ slug }) => slug === 'posts')

      expect(posts?.admin?.components?.edit?.editMenuItems).toEqual([
        ...customMenuItems,
        trigger ?? { path: '@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger' },
      ])
    },
  )

  it.each([
    '@payloadcms/plugin-multi-tenant/client',
    '@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger',
  ])('should preserve a different export from %s and add the tenant action', async (path) => {
    const customMenuItem = { path, exportName: 'OtherComponent' }
    const plugin = multiTenantPlugin({ collections: { posts: {} } })
    const config = await plugin({
      collections: [
        { slug: 'users', auth: true, fields: [] },
        { slug: 'tenants', fields: [] },
        {
          slug: 'posts',
          admin: { components: { edit: { editMenuItems: [customMenuItem] } } },
          fields: [],
        },
      ],
    } as Config)
    const posts = config.collections?.find(({ slug }) => slug === 'posts')

    expect(posts?.admin?.components?.edit?.editMenuItems).toEqual([
      customMenuItem,
      { path: '@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger' },
    ])
  })

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
