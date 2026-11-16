import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { getNestedDocsTreeMetadata } from './getNestedDocsTreeMetadata.js'

describe('nested document list', () => {
  it('should avoid probing membership through a parent field with read access rules', async () => {
    const find = vi.fn()
    const req = {
      payload: {
        find,
        collections: {
          pages: {
            config: {
              nestedDocs: true,
              hierarchy: { parentFieldName: 'parent' },
              flattenedFields: [{ name: 'parent', access: { read: () => false } }],
            },
          },
        },
      },
    } as unknown as PayloadRequest

    await expect(
      getNestedDocsTreeMetadata({
        data: { docs: [{ id: 'root' }] } as never,
        findArgs: { collection: 'pages' },
        parentFieldName: 'parent',
        req,
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(find).not.toHaveBeenCalled()
  })

  it('should bound concurrent existence probes and avoid counting collapsed children', async () => {
    let active = 0
    let peak = 0
    const find = vi.fn(async (_args: Record<string, unknown>) => {
      active++
      peak = Math.max(peak, active)
      await Promise.resolve()
      active--
      return { docs: [], hasNextPage: false }
    })
    const docs = Array.from({ length: 9 }, (_, id) => ({ id }))

    await getNestedDocsTreeMetadata({
      data: { docs } as never,
      findArgs: { collection: 'pages' },
      parentFieldName: 'parent',
      req: { payload: { find } } as unknown as PayloadRequest,
    })

    expect(peak).toBe(4)
    expect(find).toHaveBeenCalledTimes(9)
    for (const [args] of find.mock.calls) {
      expect(args).toMatchObject({ limit: 1, overrideAccess: false, pagination: false })
    }
  })
  it('should report child availability without fetching descendants or changing root pagination', async () => {
    const roots = { docs: [{ id: 'about' }, { id: 'contact' }], totalDocs: 20, totalPages: 10 }
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [{ id: 'team' }] })
      .mockResolvedValue({ docs: [] })

    const result = await getNestedDocsTreeMetadata({
      data: roots,
      findArgs: { collection: 'pages', limit: 2 },
      parentFieldName: 'parent',
      req: { payload: { find } } as unknown as PayloadRequest,
    })

    expect(result.data).toBe(roots)
    expect(find).toHaveBeenCalledTimes(2)
    expect(result.rows.about).toEqual({
      depth: 0,
      hasChildren: true,
      hasMore: false,
      isExpanded: false,
      limit: 2,
      parentID: null,
    })
    expect(result.rows.contact.hasChildren).toBe(false)
    expect(result.rows.team).toBeUndefined()
  })

  it('should retain access, locale and filter constraints when checking a custom parent field', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const user = { id: 'editor', collection: 'users' }
    const where = { visibility: { equals: 'public' } }
    const req = { payload: { find }, user } as unknown as PayloadRequest

    await getNestedDocsTreeMetadata({
      data: { docs: [{ id: 0 }] } as never,
      findArgs: { collection: 'pages', locale: 'fr', overrideAccess: true, where },
      parentFieldName: 'ancestor',
      req,
    })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'fr',
        overrideAccess: false,
        pagination: false,
        req,
        select: { id: true },
        user,
        where: { and: [where, { ancestor: { equals: 0 } }] },
      }),
    )
  })
})
