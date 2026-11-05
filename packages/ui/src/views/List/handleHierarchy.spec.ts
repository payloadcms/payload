import type { PayloadRequest, SanitizedCollectionConfig, SanitizedPermissions } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { handleHierarchy } from './handleHierarchy.js'

const createFixtures = ({ hasRelatedCollection = false } = {}) => {
  const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 })
  const collectionConfig = {
    slug: 'folders',
    admin: { listSearchableFields: ['status'], useAsTitle: 'title' },
    fields: [
      { name: 'title', type: 'text' },
      {
        name: 'status',
        type: 'select',
        options: [{ label: { de: 'Aktiv', en: 'Active User' }, value: 'active' }],
      },
    ],
    hierarchy: {
      collectionSpecific: { fieldName: 'allowedTypes' },
      parentFieldName: 'parent',
      relatedCollections: hasRelatedCollection
        ? { posts: { fieldName: 'folder', hasMany: false } }
        : {},
    },
  } as unknown as SanitizedCollectionConfig
  const relatedBaseFilter = { visible: { equals: true } }
  const relatedCollectionConfig = {
    ...collectionConfig,
    slug: 'posts',
    admin: {
      ...collectionConfig.admin,
      baseFilter: () => relatedBaseFilter,
      listSearchableFields: ['kind'],
    },
    fields: [
      {
        name: 'kind',
        type: 'select',
        options: [{ label: 'Article Label', value: 'article' }],
      },
    ],
  }
  const user = { id: 'user', collection: 'users' }
  const req = {
    i18n: { language: 'en', fallbackLanguage: 'en', t: (key: string) => key },
    locale: 'en',
    payload: {
      collections: { posts: { config: relatedCollectionConfig } },
      find,
      logger: { warn: vi.fn() },
    },
    user,
  } as unknown as PayloadRequest

  return { collectionConfig, find, relatedBaseFilter, req, user: req.user }
}

const parentCondition = {
  or: [{ parent: { exists: false } }, { parent: { equals: null } }],
}

describe('handleHierarchy search', () => {
  it('should search child select labels while preserving parent, type, and base filters', async () => {
    const { collectionConfig, find, req, user } = createFixtures()
    const baseFilter = { visible: { equals: true } }

    await handleHierarchy({
      baseFilter,
      collectionConfig,
      collectionSlug: collectionConfig.slug,
      parentId: null,
      req,
      search: 'Active User',
      typeFilter: ['posts'],
      user,
    })

    expect(find).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        collection: 'folders',
        overrideAccess: false,
        req,
        user,
        where: {
          and: [
            parentCondition,
            {
              or: [{ allowedTypes: { in: ['posts'] } }, { allowedTypes: { exists: false } }],
            },
            { or: [{ status: { like: 'Active User' } }, { status: { in: ['active'] } }] },
            baseFilter,
          ],
        },
      }),
    )
  })

  it('should resolve related collection labels and retain relationship and base filters', async () => {
    const { collectionConfig, find, relatedBaseFilter, req, user } = createFixtures({
      hasRelatedCollection: true,
    })

    await handleHierarchy({
      collectionConfig,
      collectionSlug: collectionConfig.slug,
      parentId: null,
      permissions: { collections: { posts: { read: true } } } as unknown as SanitizedPermissions,
      req,
      search: 'Article Label',
      user,
    })

    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'posts',
        overrideAccess: false,
        req,
        user,
        where: {
          and: [
            { or: [{ folder: { exists: false } }, { folder: { equals: null } }] },
            { or: [{ kind: { like: 'Article Label' } }, { kind: { in: ['article'] } }] },
            relatedBaseFilter,
          ],
        },
      }),
    )
  })

  it('should preserve the unsearched hierarchy query', async () => {
    const { collectionConfig, find, req, user } = createFixtures()

    await handleHierarchy({
      collectionConfig,
      collectionSlug: collectionConfig.slug,
      parentId: null,
      req,
      user,
    })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { and: [parentCondition] } }),
    )
  })
})
