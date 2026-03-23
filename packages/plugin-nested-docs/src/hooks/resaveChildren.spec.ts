import type { CollectionAfterChangeHook, JsonObject, SanitizedCollectionConfig } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../utilities/populateBreadcrumbs.js', () => ({
  populateBreadcrumbs: vi.fn(),
}))

import type { NestedDocsPluginConfig } from '../types.js'

import { populateBreadcrumbs } from '../utilities/populateBreadcrumbs.js'
import { resaveChildren } from './resaveChildren.js'

const mockPopulateBreadcrumbs = vi.mocked(populateBreadcrumbs)

describe('resaveChildren', () => {
  const mockUpdate = vi.fn()
  const mockFind = vi.fn()
  const mockLogger = { error: vi.fn() }

  const collection = {
    slug: 'pages',
    versions: { drafts: true },
  } as unknown as SanitizedCollectionConfig

  const pluginConfig: NestedDocsPluginConfig = {
    collections: ['pages'],
    generateLabel: (_, doc) => doc.title as string,
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should await populateBreadcrumbs before passing data to payload.update', async () => {
    const resolvedData = {
      id: 'child-1',
      title: 'Child',
      slug: 'child',
      parent: 'parent-1',
      _status: 'published',
      breadcrumbs: [
        { doc: 'parent-1', label: 'Parent', url: '/parent' },
        { doc: 'child-1', label: 'Child', url: '/parent/child' },
      ],
    }

    mockPopulateBreadcrumbs.mockResolvedValue(resolvedData)

    const child: JsonObject = {
      id: 'child-1',
      title: 'Child',
      slug: 'child',
      parent: 'parent-1',
      _status: 'published',
      updatedAt: '2026-01-01',
    }

    mockFind
      .mockResolvedValueOnce({ docs: [] }) // draft children query
      .mockResolvedValueOnce({ docs: [child] }) // published children query

    const hook = resaveChildren(pluginConfig) as CollectionAfterChangeHook

    await hook({
      collection,
      context: {},
      doc: { id: 'parent-1', _status: 'published' },
      operation: 'update',
      previousDoc: {},
      req: {
        locale: 'en',
        payload: {
          find: mockFind,
          logger: mockLogger,
          update: mockUpdate,
        },
      } as any,
    })

    expect(mockUpdate).toHaveBeenCalledTimes(1)

    const updateArgs = mockUpdate.mock.calls[0][0]

    // The critical assertion: data must be the resolved object, not a Promise
    expect(updateArgs.data).toBe(resolvedData)
    expect(updateArgs.data).not.toBeInstanceOf(Promise)
    expect(updateArgs.data.breadcrumbs).toHaveLength(2)
    expect(updateArgs.data.breadcrumbs[0].label).toBe('Parent')
  })
})
