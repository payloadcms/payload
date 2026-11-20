import type { PayloadRequest, SanitizedCollectionConfig } from '../index.js'

import { describe, expect, it, vi } from 'vitest'

import { getNestedDocsBranch } from './getNestedDocsBranch.js'
import { canReadNestedDocsTree } from './canReadNestedDocsTree.js'

const collectionConfig = {
  slug: 'pages',
  admin: {},
  defaultSort: 'title',
  flattenedFields: [],
  hierarchy: { parentFieldName: 'ancestor' },
  nestedDocs: true,
} as unknown as SanitizedCollectionConfig

describe('nested document branches', () => {
  it('should preserve multi-field default sorting in branch queries', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const defaultSort = ['title', '-createdAt']

    await getNestedDocsBranch({
      collectionConfig: { ...collectionConfig, defaultSort },
      parentID: null,
      req: { payload: { find } } as unknown as PayloadRequest,
    })

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ sort: defaultSort }))
  })

  it('should expose tree eligibility without evaluating per-document access rules', () => {
    const read = vi.fn(() => true)

    expect(canReadNestedDocsTree({ collectionConfig })).toBe(true)
    expect(
      canReadNestedDocsTree({ collectionConfig: { ...collectionConfig, nestedDocs: false } }),
    ).toBe(false)
    expect(
      canReadNestedDocsTree({ collectionConfig: { ...collectionConfig, hierarchy: undefined } }),
    ).toBe(false)
    expect(
      canReadNestedDocsTree({
        collectionConfig: {
          ...collectionConfig,
          flattenedFields: [
            { name: 'ancestor', type: 'relationship', relationTo: 'pages', access: { read } },
          ],
        } as SanitizedCollectionConfig,
      }),
    ).toBe(false)
    expect(read).not.toHaveBeenCalled()
  })

  it('should reject parent fields with read access rules before querying', async () => {
    const find = vi.fn()
    const restrictedCollection = {
      ...collectionConfig,
      flattenedFields: [
        {
          name: 'ancestor',
          type: 'relationship',
          relationTo: 'pages',
          access: { read: () => true },
        },
      ],
    } as SanitizedCollectionConfig

    await expect(
      getNestedDocsBranch({
        collectionConfig: restrictedCollection,
        parentID: 'root',
        req: { payload: { find } } as unknown as PayloadRequest,
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(find).not.toHaveBeenCalled()
  })

  it('should apply visibility constraints to branches and child probes independently', async () => {
    const baseFilter = vi.fn(() => ({ visible: { equals: true } }))
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [{ id: 0 }] })
      .mockResolvedValueOnce({ docs: [{ id: 1 }] })
    const user = { id: 'editor', collection: 'users' }
    const req = { locale: 'fr', payload: { find }, user } as unknown as PayloadRequest
    const query = { limit: 2, page: 3, where: { title: { contains: 'Guide' } } }

    const result = await getNestedDocsBranch({
      collectionConfig: { ...collectionConfig, admin: { baseFilter } },
      parentID: 'root',
      query,
      req,
    })

    expect(baseFilter).toHaveBeenCalledWith({ limit: 2, locale: 'fr', page: 3, req, sort: 'title' })
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'pages',
        draft: true,
        fallbackLocale: false,
        limit: 2,
        locale: 'fr',
        overrideAccess: false,
        page: 3,
        req,
        user,
        where: {
          and: [{ visible: { equals: true } }, query.where, { ancestor: { equals: 'root' } }],
        },
      }),
    )
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: 1,
        overrideAccess: false,
        pagination: false,
        req,
        user,
        where: { and: [{ visible: { equals: true } }, query.where, { ancestor: { equals: 0 } }] },
      }),
    )
    expect(result.rows['0']?.hasChildren).toBe(true)
  })

  it.each([
    [1000, -5, 100, 1],
    [-2, 2.8, 1, 2],
    [0, 0, 10, 1],
  ])(
    'should normalize limit %s and page %s',
    async (requestedLimit, requestedPage, limit, page) => {
      const find = vi.fn().mockResolvedValue({ docs: [] })

      await getNestedDocsBranch({
        collectionConfig,
        parentID: null,
        query: { limit: requestedLimit, page: requestedPage },
        req: { payload: { find } } as unknown as PayloadRequest,
      })

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          limit,
          page,
          where: {
            and: [{ or: [{ ancestor: { equals: null } }, { ancestor: { exists: false } }] }],
          },
        }),
      )
    },
  )

  it.each([Infinity, NaN, {}, []])(
    'should reject invalid parent %s before querying',
    async (parentID) => {
      const find = vi.fn()

      await expect(
        getNestedDocsBranch({
          collectionConfig,
          parentID: parentID as number,
          req: { payload: { find } } as unknown as PayloadRequest,
        }),
      ).rejects.toThrow('Invalid branch query')
      expect(find).not.toHaveBeenCalled()
    },
  )

  it('should reject non-finite pages before querying', async () => {
    const find = vi.fn()

    await expect(
      getNestedDocsBranch({
        collectionConfig,
        parentID: null,
        query: { page: Infinity },
        req: { payload: { find } } as unknown as PayloadRequest,
      }),
    ).rejects.toThrow('Invalid branch query')
    expect(find).not.toHaveBeenCalled()
  })

  it('should reject collections without nested documents', async () => {
    await expect(
      getNestedDocsBranch({
        collectionConfig: { ...collectionConfig, nestedDocs: false },
        parentID: null,
        req: {} as PayloadRequest,
      }),
    ).rejects.toThrow('Collection does not support nested documents')
  })
})
