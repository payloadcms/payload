import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { updateDocument } from '../collections/operations/utilities/update.js'
import { promoteHierarchyChildren } from './promoteHierarchyChildren.js'

vi.mock('../collections/operations/utilities/update.js', () => ({ updateDocument: vi.fn() }))

describe('hierarchy structural promotion', () => {
  it('should retain native request headers while isolating the structural locale', async () => {
    const find = vi.fn(async ({ req }: { req: PayloadRequest }) => {
      expect(req.headers.get('x-test')).toBe('preserved')
      expect(req.locale).toBe('all')
      return { docs: [] }
    })
    const req = Object.assign(
      new Request('http://localhost', { headers: { 'x-test': 'preserved' } }),
      {
        context: {},
        locale: 'en',
        payload: { db: { find } },
      },
    ) as unknown as PayloadRequest

    await promoteHierarchyChildren({
      id: 0,
      collection: { slug: 'pages', versions: false } as SanitizedCollectionConfig,
      parentFieldName: 'parent',
      req,
    })
    expect(req.locale).toBe('en')
  })

  it('should reject localized publication status before modifying any child', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 1 }] })
    const findOne = vi.fn()
    const update = vi.fn()
    const req = {
      context: {},
      payload: { db: { find, findOne, queryDrafts: find }, update },
    } as unknown as PayloadRequest

    await expect(
      promoteHierarchyChildren({
        id: 0,
        collection: {
          slug: 'pages',
          versions: { drafts: { localizeStatus: true } },
        } as SanitizedCollectionConfig,
        parentFieldName: 'parent',
        req,
      }),
    ).rejects.toThrow('localized draft status')
    expect(update).not.toHaveBeenCalled()
    expect(findOne).not.toHaveBeenCalled()
  })

  it('should allow removal of a leaf with localized publication status', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const req = {
      context: {},
      payload: { db: { find, queryDrafts: find } },
    } as unknown as PayloadRequest

    const ids = await promoteHierarchyChildren({
      id: 0,
      collection: {
        slug: 'pages',
        versions: { drafts: { localizeStatus: true } },
      } as SanitizedCollectionConfig,
      parentFieldName: 'parent',
      req,
    })

    expect(ids.size).toBe(0)
  })

  it('should clear only latest version IDs observed before each snapshot repair', async () => {
    const latestVersionIDs = new Set(['original-version'])
    const updateVersion = vi.fn(async ({ id }: { id: string; versionData: unknown }) => {
      latestVersionIDs.delete(id)
    })
    const findVersions = vi.fn(async ({ select, where }) => {
      if (select) {
        return { docs: [...latestVersionIDs].map((id) => ({ id })) }
      }
      const id = where.and[0].parent?.equals

      return {
        docs: [
          {
            version:
              id === 'parent'
                ? { id, parent: 'root' }
                : { id: 'child', parent: 'parent', title: 'Pending', _status: 'draft' },
          },
        ],
      }
    })
    const findOne = vi.fn(async ({ where }) => {
      const id = where.id.equals

      return id === 'parent'
        ? { id, parent: 'root' }
        : { id, parent: 'parent', title: 'Published', _status: 'published' }
    })
    const req = {
      context: {},
      payload: {
        config: {},
        db: {
          find: vi.fn().mockResolvedValue({ docs: [{ id: 'child' }] }),
          findOne,
          findVersions,
          queryDrafts: vi.fn().mockResolvedValue({ docs: [{ id: 'child' }] }),
          updateVersion,
        },
      },
    } as unknown as PayloadRequest

    vi.mocked(updateDocument).mockImplementation(async ({ draftArg }) => {
      latestVersionIDs.add(draftArg ? 'final-draft-version' : 'stored-repair-version')
      return {} as never
    })

    await promoteHierarchyChildren({
      id: 'parent',
      collection: { slug: 'pages', versions: { drafts: true } } as SanitizedCollectionConfig,
      parentFieldName: 'parent',
      req,
    })

    expect(updateVersion.mock.calls.map(([{ id }]) => id)).toEqual([
      'original-version',
      'stored-repair-version',
    ])
    expect(latestVersionIDs).toEqual(new Set(['final-draft-version']))
    for (const [{ versionData }] of updateVersion.mock.calls) {
      expect(versionData).toEqual({ latest: false, updatedAt: null })
    }
  })
})
