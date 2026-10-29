import type { Config, PayloadRequest, RelationshipField } from 'payload'

import { deepCopyObjectComplex } from 'payload/shared'
import { describe, expect, it, vi } from 'vitest'

import type { MultiTenantPluginConfig } from './types.js'

import { multiTenantPlugin } from './index.js'

const customComponent = '/components/Custom.js#Custom'

const createFixture = () => {
  const customHook = vi.fn(() => undefined)
  const customFilter = vi.fn(() => ({ published: { equals: true } }))
  const options: MultiTenantPluginConfig = {
    collections: { posts: {}, settings: { isGlobal: true } },
  }
  const config = {
    admin: {
      components: {
        actions: [customComponent],
        beforeNav: [customComponent],
        providers: [customComponent],
      },
    },
    baseAccess: { collections: { read: customFilter } },
    blocks: [
      {
        slug: 'shared',
        fields: [
          {
            name: 'related',
            type: 'relationship',
            relationTo: 'posts',
            filterOptions: customFilter,
          },
        ],
      },
    ],
    collections: [
      { slug: 'users', auth: true, admin: { baseFilter: customFilter }, fields: [] },
      {
        slug: 'tenants',
        admin: { baseFilter: customFilter },
        endpoints: [{ path: '/custom', method: 'get', handler: () => new Response() }],
        fields: [{ name: 'name', type: 'text' }],
        hooks: { afterDelete: [customHook] },
      },
      {
        slug: 'posts',
        admin: {
          baseFilter: customFilter,
          components: { edit: { editMenuItems: [customComponent] } },
        },
        fields: [{ name: 'content', type: 'blocks', blocks: ['shared'] }],
        hooks: { beforeValidate: [customHook] },
      },
      { slug: 'settings', fields: [] },
    ],
    i18n: { translations: { en: { custom: 'Custom translation' } } },
  } as unknown as Config

  return { config, customFilter, customHook, options }
}

const getRegistrations = ({ config }: { config: Config }) => ({
  actions: config.admin?.components?.actions?.length,
  beforeNav: config.admin?.components?.beforeNav?.length,
  providers: config.admin?.components?.providers?.length,
  collections: config.collections?.map((collection) => ({
    slug: collection.slug,
    fields: collection.fields.map((field) => ('name' in field ? field.name : field.type)),
    endpoints: collection.endpoints?.map(({ method, path }) => ({ method, path })),
    editMenuItems: collection.admin?.components?.edit?.editMenuItems?.length,
    afterDelete: collection.hooks?.afterDelete?.length,
    beforeValidate: collection.hooks?.beforeValidate?.length,
  })),
})

describe('multi-tenant config isolation', () => {
  it.each(['same config', 'shallow copy', 'new plugin instance'] as const)(
    'should preserve all registrations when rebuilding from %s',
    async (mode) => {
      const { config, customHook, options } = createFixture()
      const sourceSnapshot = deepCopyObjectComplex(config)
      const optionsSnapshot = deepCopyObjectComplex(options)
      const plugin = multiTenantPlugin(options)
      const first = await plugin(config)
      const firstRegistrations = getRegistrations({ config: first })

      for (let rebuild = 0; rebuild < 3; rebuild++) {
        const nextPlugin = mode === 'new plugin instance' ? multiTenantPlugin(options) : plugin
        const next = await nextPlugin(mode === 'shallow copy' ? { ...config } : config)

        expect(getRegistrations({ config: next })).toEqual(firstRegistrations)
        expect(getRegistrations({ config: first })).toEqual(firstRegistrations)
        expect(next.admin?.components?.providers?.[0]).toBe(customComponent)
        expect(next.collections?.[1]?.hooks?.afterDelete?.[0]).toBe(customHook)
        expect(next.collections?.[2]?.hooks?.beforeValidate?.[0]).toBe(customHook)
      }

      expect(config).toEqual(sourceSnapshot)
      expect(options).toEqual(optionsSnapshot)
      expect(firstRegistrations).toMatchObject({
        actions: 2,
        beforeNav: 2,
        providers: 2,
        collections: [
          { slug: 'users', fields: ['tenants'] },
          {
            slug: 'tenants',
            fields: ['name', '_watchTenant'],
            endpoints: [
              { method: 'get', path: '/custom' },
              { method: 'get', path: '/populate-tenant-options' },
            ],
            afterDelete: 2,
          },
          { slug: 'posts', fields: ['tenant', 'content'], editMenuItems: 2, beforeValidate: 2 },
          { slug: 'settings', fields: ['tenant'], beforeValidate: 1 },
        ],
      })
    },
  )

  it('should apply tenant constraints once to access and filters across rebuilds', async () => {
    const { config, customFilter, options } = createFixture()
    const plugin = multiTenantPlugin(options)
    const req = {
      headers: new Headers(),
      payload: { collections: {}, db: { defaultIDType: 'text' } },
      user: { id: 'user-1', collection: 'users', tenants: [{ tenant: 'tenant-1' }] },
    } as unknown as PayloadRequest

    for (let rebuild = 0; rebuild < 3; rebuild++) {
      const built = await plugin({ ...config })
      const posts = built.collections?.find(({ slug }) => slug === 'posts')
      const expected = {
        and: [{ published: { equals: true } }, { tenant: { in: ['tenant-1'] } }],
      }

      customFilter.mockClear()
      await expect(built.baseAccess?.collections?.read?.({ req, slug: 'posts' })).resolves.toEqual(
        expected,
      )
      expect(customFilter).toHaveBeenCalledTimes(1)

      customFilter.mockClear()
      await expect(posts?.admin?.baseFilter?.({ req } as never)).resolves.toEqual(expected)
      expect(customFilter).toHaveBeenCalledTimes(1)

      const relationship = built.blocks?.[0]?.fields[0] as RelationshipField
      const filterOptions = relationship.filterOptions

      expect(typeof filterOptions).toBe('function')
      if (typeof filterOptions === 'function') {
        customFilter.mockClear()
        expect(await filterOptions({ req, relationTo: 'posts', data: {} } as never)).toEqual(
          expected,
        )
        expect(customFilter).toHaveBeenCalledTimes(1)
      }
    }
  })

  it('should use updated plugin options on the next build', async () => {
    const { config, options } = createFixture()
    const first = await multiTenantPlugin(options)(config)
    const second = await multiTenantPlugin({ ...options, tenantField: { name: 'site' } })(config)
    const firstPosts = first.collections?.find(({ slug }) => slug === 'posts')
    const secondPosts = second.collections?.find(({ slug }) => slug === 'posts')

    expect(firstPosts?.fields[0]).toMatchObject({ name: 'tenant' })
    expect(secondPosts?.fields[0]).toMatchObject({ name: 'site' })
  })

  it('should preserve runtime adapter references outside the modified config branches', async () => {
    const { config, options } = createFixture()
    const db = { name: 'custom-adapter' } as Config['db']
    const editor = {} as Config['editor']
    const source = { ...config, db, editor }
    const built = await multiTenantPlugin(options)(source)

    expect(built).not.toBe(source)
    expect(built.db).toBe(db)
    expect(built.editor).toBe(editor)
  })

  it('should preserve opaque custom values and component props', async () => {
    const { config, options } = createFixture()
    const custom = { url: new URL('https://example.com/path'), bytes: new Uint8Array([1, 2]) }
    const clientProps = { custom }
    const posts = config.collections?.find(({ slug }) => slug === 'posts')!

    posts.custom = custom
    config.admin!.components!.providers = [{ path: customComponent, clientProps }]

    const built = await multiTenantPlugin(options)(config)
    const builtPosts = built.collections?.find(({ slug }) => slug === 'posts')
    const provider = built.admin?.components?.providers?.[0]

    expect(builtPosts?.custom).toBe(custom)
    expect(custom.url.toString()).toBe('https://example.com/path')
    expect(custom.bytes.slice()).toEqual(new Uint8Array([1, 2]))
    expect(provider).toMatchObject({ clientProps })
    expect(typeof provider === 'object' && provider.clientProps).toBe(clientProps)
  })

  it('should call a collection access override once per operation after rebuilding', async () => {
    const { config, options } = createFixture()
    const accessResultOverride = vi.fn(({ accessResult }) => accessResult)
    const plugin = multiTenantPlugin({
      ...options,
      collections: { ...options.collections, posts: { accessResultOverride } },
    })
    const req = {
      user: { id: 'user-1', collection: 'users', tenants: [{ tenant: 'tenant-1' }] },
    } as unknown as PayloadRequest

    for (let rebuild = 0; rebuild < 3; rebuild++) {
      const built = await plugin(config)
      const posts = built.collections?.find(({ slug }) => slug === 'posts')

      accessResultOverride.mockClear()
      await expect(posts?.access?.read?.({ req })).resolves.toEqual({
        tenant: { in: ['tenant-1'] },
      })
      expect(accessResultOverride).toHaveBeenCalledTimes(1)
    }
  })
})
