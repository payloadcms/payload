import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { APIError } from '../errors/APIError.js'
import { Forbidden } from '../errors/Forbidden.js'
import { getHierarchyContents } from './getHierarchyContents.js'

const makeRequest = () => {
  const find = vi.fn().mockResolvedValue({ docs: [{ id: 'folder' }], hasNextPage: false, page: 1 })
  const folder = {
    admin: { useAsTitle: 'title' },
    flattenedFields: [{ name: 'parent', type: 'relationship' }],
    hierarchy: {
      allowHasMany: false,
      parentFieldName: 'parent',
      relatedCollections: { posts: { fieldName: 'folder', hasMany: false } },
    },
  }
  const post = {
    admin: { useAsTitle: 'title' },
    flattenedFields: [{ name: 'folder', type: 'relationship' }],
  }
  const req = {
    payload: { collections: { folders: { config: folder }, posts: { config: post } }, find },
    user: { id: 'editor', collection: 'users' },
  } as unknown as PayloadRequest

  return { find, folder, post, req }
}

describe('folder contents access boundaries', () => {
  it('should reject unauthenticated requests before looking up documents', async () => {
    const { find, req } = makeRequest()
    req.user = null

    await expect(getHierarchyContents({ collectionSlug: 'folders', req })).rejects.toBeInstanceOf(
      Forbidden,
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('should reject arbitrary source collections before reading any documents', async () => {
    const { find, req } = makeRequest()

    await expect(
      getHierarchyContents({ collectionSlug: 'folders', req, source: 'users' }),
    ).rejects.toBeInstanceOf(APIError)
    expect(find).not.toHaveBeenCalled()
  })

  it.each([0, 41, 1.5, Infinity, NaN])('should reject an unbounded limit of %s', async (limit) => {
    const { find, req } = makeRequest()

    await expect(
      getHierarchyContents({ collectionSlug: 'folders', limit, req }),
    ).rejects.toBeInstanceOf(APIError)
    expect(find).not.toHaveBeenCalled()
  })

  it('should omit guarded membership sources without querying or revealing their availability', async () => {
    const { find, post, req } = makeRequest()
    Object.assign(post.flattenedFields[0], { access: { read: () => true } })

    const result = await getHierarchyContents({ collectionSlug: 'folders', req, source: 'posts' })

    expect(result.sources).toEqual([])
    expect(find).toHaveBeenCalledTimes(1)
    expect(find).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'posts' }))
  })

  it('should omit forbidden sources but propagate operational failures', async () => {
    const { find, req } = makeRequest()
    find.mockResolvedValueOnce({ docs: [{ id: 'folder' }] }).mockRejectedValueOnce(new Forbidden())

    expect(await getHierarchyContents({ collectionSlug: 'folders', req, source: 'posts' })).toEqual(
      { parentID: null, sources: [] },
    )

    const failure = new Error('Database unavailable')
    find.mockResolvedValueOnce({ docs: [{ id: 'folder' }] }).mockRejectedValueOnce(failure)

    await expect(
      getHierarchyContents({ collectionSlug: 'folders', req, source: 'posts' }),
    ).rejects.toBe(failure)
  })
})
