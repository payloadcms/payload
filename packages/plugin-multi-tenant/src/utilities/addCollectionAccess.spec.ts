import type { AccessArgs, CollectionConfig, Config } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import type { TenantAccessConfig } from './addCollectionAccess.js'

import { addCollectionAccess } from './addCollectionAccess.js'

const createAccessConfig = (
  collection: CollectionConfig,
  accessResultCallback?: TenantAccessConfig['accessResultCallback'],
): TenantAccessConfig => ({
  accessResultCallback,
  adminUsersSlug: 'users',
  collection,
  fieldName: 'tenant',
  userHasAccessToAllTenants: () => false,
})

const createArgs = (slug = 'posts'): AccessArgs => ({
  req: {
    user: {
      collection: 'users',
      id: 'user-1',
      tenants: [{ tenant: 'tenant-1' }],
    },
  } as unknown as AccessArgs['req'],
  slug,
})

describe('addCollectionAccess', () => {
  it('should keep collection overrides separate from shared tenant access rules', async () => {
    const readPosts = vi.fn(() => ({ published: { equals: true } }))
    const readPages = vi.fn(() => true)
    const override: NonNullable<TenantAccessConfig['accessResultCallback']> = ({ accessResult }) =>
      accessResult
    const posts: CollectionConfig = { slug: 'posts', access: { read: readPosts }, fields: [] }
    const pages: CollectionConfig = { slug: 'pages', access: { read: readPages }, fields: [] }
    const source = { collections: [posts, pages] } as Config
    const result = addCollectionAccess({
      collectionAccessConfigs: [createAccessConfig(posts, override), createAccessConfig(pages)],
      config: source,
    })

    await expect(result.collections?.[0]?.access?.read?.(createArgs())).resolves.toEqual({
      and: [{ published: { equals: true } }, { tenant: { in: ['tenant-1'] } }],
    })
    await expect(result.baseAccess?.collections?.read?.(createArgs())).resolves.toBe(true)
    await expect(result.baseAccess?.collections?.read?.(createArgs('pages'))).resolves.toEqual({
      tenant: { in: ['tenant-1'] },
    })
    expect(result.collections?.[1]?.access?.read).toBe(readPages)
    expect(posts.access?.read).toBe(readPosts)
    expect(source.baseAccess).toBeUndefined()
  })

  it('adds tenant constraints through base access without replacing collection access', async () => {
    const documentRead = vi.fn(() => ({ published: { equals: true } }))
    const collection: CollectionConfig = {
      slug: 'posts',
      access: { read: documentRead },
      fields: [],
    }
    let config = {
      baseAccess: {
        collections: {
          read: () => ({ archived: { not_equals: true } }),
        },
      },
    } as Config

    config = addCollectionAccess({
      config,
      collectionAccessConfigs: [createAccessConfig(collection)],
    })

    expect(collection.access?.read).toBe(documentRead)
    await expect(config.baseAccess?.collections?.read?.(createArgs())).resolves.toEqual({
      and: [{ archived: { not_equals: true } }, { tenant: { in: ['tenant-1'] } }],
    })
    await expect(config.baseAccess?.collections?.read?.(createArgs('pages'))).resolves.toEqual({
      archived: { not_equals: true },
    })
    expect(documentRead).not.toHaveBeenCalled()
  })

  it('returns a boolean tenant result for collection create access', async () => {
    const collection: CollectionConfig = { slug: 'posts', fields: [] }
    let config = {} as Config

    config = addCollectionAccess({
      config,
      collectionAccessConfigs: [createAccessConfig(collection)],
    })

    await expect(config.baseAccess?.collections?.create?.(createArgs())).resolves.toBe(true)
  })

  it('uses explicit base validate access and otherwise falls back to update access', async () => {
    const collection: CollectionConfig = { slug: 'posts', fields: [] }
    let fallbackUpdateCalls = 0
    let fallbackConfig = {
      baseAccess: {
        collections: {
          update: () => {
            fallbackUpdateCalls += 1
            return false
          },
        },
      },
    } as Config

    fallbackConfig = addCollectionAccess({
      config: fallbackConfig,
      collectionAccessConfigs: [createAccessConfig(collection)],
    })

    await expect(fallbackConfig.baseAccess?.collections?.validate?.(createArgs())).resolves.toBe(
      false,
    )
    expect(fallbackUpdateCalls).toBe(1)

    let explicitUpdateCalls = 0
    let explicitValidateCalls = 0
    let explicitConfig = {
      baseAccess: {
        collections: {
          update: () => {
            explicitUpdateCalls += 1
            return false
          },
          validate: () => {
            explicitValidateCalls += 1
            return true
          },
        },
      },
    } as Config

    explicitConfig = addCollectionAccess({
      config: explicitConfig,
      collectionAccessConfigs: [createAccessConfig(collection)],
    })

    await expect(explicitConfig.baseAccess?.collections?.validate?.(createArgs())).resolves.toEqual(
      {
        tenant: { in: ['tenant-1'] },
      },
    )
    expect(explicitUpdateCalls).toBe(0)
    expect(explicitValidateCalls).toBe(1)
  })
})
