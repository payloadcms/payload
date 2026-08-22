import type { AccessArgs, CollectionConfig, Config } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import type { TenantAccessConfig } from './addCollectionAccess.js'

import { addCollectionAccess } from './addCollectionAccess.js'

const createScope = (
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
  it('adds tenant constraints through base access without replacing collection access', async () => {
    const documentRead = vi.fn(() => ({ published: { equals: true } }))
    const collection: CollectionConfig = {
      slug: 'posts',
      access: { read: documentRead },
      fields: [],
    }
    const config = {
      baseAccess: {
        collections: {
          read: () => ({ archived: { not_equals: true } }),
        },
      },
    } as Config

    addCollectionAccess({ config, scopes: [createScope(collection)] })

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
    const config = {} as Config

    addCollectionAccess({ config, scopes: [createScope(collection)] })

    await expect(config.baseAccess?.collections?.create?.(createArgs())).resolves.toBe(true)
  })

  it('falls back to update access for validate when accessResultCallback is configured', async () => {
    const documentUpdate = vi.fn(() => true)
    const accessResultCallback = vi.fn(({ accessResult }) => accessResult)
    const collection: CollectionConfig = {
      slug: 'posts',
      access: { update: documentUpdate },
      fields: [],
    }
    const config = {} as Config

    addCollectionAccess({
      config,
      scopes: [createScope(collection, accessResultCallback)],
    })

    await collection.access?.validate?.(createArgs())

    expect(documentUpdate).toHaveBeenCalled()
  })

  it('keeps callback wrapping when an access result override is configured', async () => {
    const documentResult = { published: { equals: true } }
    const documentRead = vi.fn(() => documentResult)
    const accessResultCallback = vi.fn(({ accessResult }) => accessResult)
    const collection: CollectionConfig = {
      slug: 'posts',
      access: { read: documentRead },
      fields: [],
    }
    const config = {} as Config

    addCollectionAccess({
      config,
      scopes: [createScope(collection, accessResultCallback)],
    })

    expect(config.baseAccess).toBeUndefined()
    await expect(collection.access?.read?.(createArgs())).resolves.toEqual({
      and: [documentResult, { tenant: { in: ['tenant-1'] } }],
    })
    expect(accessResultCallback).toHaveBeenCalledWith(
      expect.objectContaining({ accessKey: 'read' }),
    )
  })
})
