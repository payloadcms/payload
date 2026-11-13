import type { ArrayField, Config, CustomComponent } from 'payload'

import { describe, expect, it } from 'vitest'

import { multiTenantPlugin } from './index.js'

describe('multiTenantPlugin', () => {
  describe('assignment modal', () => {
    it('should preserve dependencies and register a custom assignment modal', async () => {
      const config = await multiTenantPlugin({
        components: {
          AssignTenantModal: {
            path: '/components/CustomAssignTenantModal/index.js#CustomAssignTenantModal',
            clientProps: { description: 'Custom assignment modal' },
          },
        },
        collections: {},
      })({
        admin: {
          dependencies: {
            existing: { path: '/components/Existing.js#Existing', type: 'component' },
          },
        },
        collections: [
          { slug: 'users', auth: true, fields: [] },
          { slug: 'tenants', fields: [] },
        ],
      } as Config)

      expect(config.admin?.dependencies).toEqual({
        existing: { path: '/components/Existing.js#Existing', type: 'component' },
        'plugin-multi-tenant-assign-tenant-modal': {
          path: '/components/CustomAssignTenantModal/index.js#CustomAssignTenantModal',
          type: 'component',
        },
      })
      expect(config.admin?.components?.providers).toContainEqual(
        expect.objectContaining({
          path: '@payloadcms/plugin-multi-tenant/rsc#TenantSelectionProvider',
          serverProps: expect.objectContaining({
            assignTenantModalComponent: {
              path: '/components/CustomAssignTenantModal/index.js#CustomAssignTenantModal',
              clientProps: { description: 'Custom assignment modal' },
            },
          }),
        }),
      )
    })

    it('should use the default assignment modal without registering a replacement', async () => {
      const config = await multiTenantPlugin({ collections: {} })({
        collections: [
          { slug: 'users', auth: true, fields: [] },
          { slug: 'tenants', fields: [] },
        ],
      } as Config)

      expect(
        config.admin?.dependencies?.['plugin-multi-tenant-assign-tenant-modal'],
      ).toBeUndefined()
    })
  })

  describe('tenant selector', () => {
    const customSelector: CustomComponent = {
      path: '/components/CustomTenantSelector/index.js#CustomTenantSelector',
      serverProps: { description: 'Custom selector' },
    }
    const existingComponent = '/components/BeforeNav/index.js#BeforeNav'

    it.each([
      {
        mode: 'default',
        tenantSelectorComponent: undefined,
        expectedSelector: {
          clientProps: { enabledSlugs: ['users', 'tenants'], label: undefined },
          path: '@payloadcms/plugin-multi-tenant/rsc#TenantSelector',
        },
      },
      { mode: 'custom', tenantSelectorComponent: customSelector, expectedSelector: customSelector },
      { mode: 'hidden', tenantSelectorComponent: null, expectedSelector: undefined },
    ])(
      'should preserve existing navigation with the $mode selector',
      async ({ expectedSelector, tenantSelectorComponent }) => {
        const config = await multiTenantPlugin({
          collections: {},
          components: { TenantSelector: tenantSelectorComponent },
        })({
          admin: { components: { beforeNav: [existingComponent] } },
          collections: [
            { slug: 'users', auth: true, fields: [] },
            { slug: 'tenants', fields: [] },
          ],
        } as Config)

        expect(config.admin?.components?.beforeNav).toEqual(
          expectedSelector ? [existingComponent, expectedSelector] : [existingComponent],
        )
      },
    )
  })

  it('should preserve custom menu items and add one tenant action on each rebuild', async () => {
    const customMenuItem = { path: '/components/CustomMenuItem.js#CustomMenuItem' }
    const plugin = multiTenantPlugin({ collections: { posts: {} } })
    const config = {
      collections: [
        { slug: 'users', auth: true, fields: [] },
        { slug: 'tenants', fields: [] },
        {
          slug: 'posts',
          admin: { components: { edit: { editMenuItems: [false, customMenuItem] } } },
          fields: [],
        },
      ],
    } as Config

    for (let rebuild = 0; rebuild < 3; rebuild++) {
      const builtConfig = await plugin(config)
      const posts = builtConfig.collections?.find(({ slug }) => slug === 'posts')

      expect(posts?.admin?.components?.edit?.editMenuItems).toEqual([
        false,
        customMenuItem,
        { path: '@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger' },
      ])
    }
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
