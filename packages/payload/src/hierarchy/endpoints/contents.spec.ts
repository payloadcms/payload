import type { CollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'

import { describe, expect, it, vi } from 'vitest'

import { sanitizeHierarchyCollection } from '../sanitizeHierarchyCollection.js'
import { hierarchyContentsEndpoint } from './contents.js'

describe('folder contents route registration', () => {
  const makeCollection = (): CollectionConfig => ({
    slug: 'folders',
    admin: { useAsTitle: 'title' },
    fields: [{ name: 'title', type: 'text' }],
    hierarchy: { allowHasMany: false, parentFieldName: 'parent' },
  })

  it('should register before the dynamic document route and remain idempotent', () => {
    const collection = makeCollection()
    const documentEndpoint = {
      handler: vi.fn(async () => Response.json({})),
      method: 'get' as const,
      path: '/:id',
    }
    collection.endpoints = [documentEndpoint]

    sanitizeHierarchyCollection(collection, {} as Config)
    sanitizeHierarchyCollection(collection, {} as Config)

    expect(collection.endpoints).toEqual([hierarchyContentsEndpoint, documentEndpoint])
  })

  it('should preserve an explicitly disabled REST API', () => {
    const collection = makeCollection()
    collection.endpoints = false

    sanitizeHierarchyCollection(collection, {} as Config)

    expect(collection.endpoints).toBe(false)
  })

  it('should reject collisions with user endpoints rather than override their handler', () => {
    const collection = makeCollection()
    collection.endpoints = [
      { handler: vi.fn(async () => Response.json({})), method: 'get', path: '/hierarchy-contents' },
    ]

    expect(() => sanitizeHierarchyCollection(collection, {} as Config)).toThrow('reserved')
  })
})
