import type { Config, PayloadRequest, RelationshipField } from 'payload'

import { deepCopyObjectComplex } from 'payload/shared'
import { describe, expect, it } from 'vitest'

import type { MultiTenantPluginConfig } from './types.js'

import { multiTenantPlugin } from './index.js'

const createFixture = () => {
  const customFilter = () => ({ published: { equals: true } })
  const relationship: RelationshipField = {
    name: 'related',
    type: 'relationship',
    relationTo: 'posts',
    filterOptions: customFilter,
  }
  const options: MultiTenantPluginConfig = {
    collections: { posts: {}, settings: { isGlobal: true } },
  }
  const config = {
    admin: {
      components: { actions: [], beforeNav: [], providers: [] },
    },
    baseAccess: { collections: { read: customFilter } },
    blocks: [
      {
        slug: 'shared',
        fields: [relationship, { name: 'nested', type: 'blocks', blocks: ['child'] }],
      },
      { slug: 'child', fields: [relationship] },
    ],
    collections: [
      { slug: 'users', auth: true, fields: [] },
      { slug: 'tenants', fields: [] },
      {
        slug: 'posts',
        admin: { baseFilter: customFilter },
        fields: [{ name: 'content', type: 'blocks', blocks: ['shared'] }],
      },
      { slug: 'settings', fields: [] },
    ],
    i18n: { translations: { en: { custom: 'Custom translation' } } },
  } as unknown as Config

  return { config, options }
}

describe('multi-tenant config isolation', () => {
  it('should leave shared source config and plugin options unchanged across rebuilds', async () => {
    const { config, options } = createFixture()
    const sourceSnapshot = deepCopyObjectComplex(config)
    const optionsSnapshot = deepCopyObjectComplex(options)
    const plugin = multiTenantPlugin(options)

    await plugin(config)
    await plugin({ ...config })

    expect(config).toEqual(sourceSnapshot)
    expect(options).toEqual(optionsSnapshot)
  })

  it('should avoid stacking tenant constraints on access and filters across rebuilds', async () => {
    const { config, options } = createFixture()
    const plugin = multiTenantPlugin(options)
    const req = {
      headers: new Headers(),
      payload: { collections: {}, db: { defaultIDType: 'text' } },
      user: { id: 'user-1', collection: 'users', tenants: [{ tenant: 'tenant-1' }] },
    } as unknown as PayloadRequest
    const expected = {
      and: [{ published: { equals: true } }, { tenant: { in: ['tenant-1'] } }],
    }

    for (let rebuild = 0; rebuild < 2; rebuild++) {
      const built = await plugin({ ...config })
      const posts = built.collections?.find(({ slug }) => slug === 'posts')

      await expect(built.baseAccess?.collections?.read?.({ req, slug: 'posts' })).resolves.toEqual(
        expected,
      )
      await expect(posts?.admin?.baseFilter?.({ req } as never)).resolves.toEqual(expected)

      for (const block of built.blocks || []) {
        const relationship = block.fields[0] as RelationshipField
        const filterOptions = relationship.filterOptions

        expect(typeof filterOptions).toBe('function')
        if (typeof filterOptions === 'function') {
          expect(await filterOptions({ req, relationTo: 'posts', data: {} } as never)).toEqual(
            expected,
          )
        }
      }
    }
  })

  it('should use updated plugin options without changing the previous build', async () => {
    const { config, options } = createFixture()
    const first = await multiTenantPlugin(options)(config)
    const second = await multiTenantPlugin({ ...options, tenantField: { name: 'site' } })(config)
    const firstPosts = first.collections?.find(({ slug }) => slug === 'posts')
    const secondPosts = second.collections?.find(({ slug }) => slug === 'posts')

    expect(firstPosts?.fields[0]).toMatchObject({ name: 'tenant' })
    expect(secondPosts?.fields[0]).toMatchObject({ name: 'site' })
  })
})
