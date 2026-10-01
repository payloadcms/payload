import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import { getInitialTreeData } from './getInitialTreeData.js'

test('should preserve the request branch when loading initial hierarchy data', async () => {
  const req = { branch: 'feature' } as PayloadRequest
  const find = vi.fn().mockResolvedValue({
    docs: [{ id: 'feature-folder', name: 'Feature folder' }],
    hasNextPage: false,
    totalDocs: 1,
  })
  const payload = {
    collections: {
      folders: {
        config: {
          admin: { useAsTitle: 'name' },
          hierarchy: {
            admin: {},
            parentFieldName: 'parent',
          },
        },
      },
    },
    find,
  } as unknown as PayloadRequest['payload']

  const result = await getInitialTreeData({
    collectionSlug: 'folders',
    payload,
    req,
    user: null,
  })

  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({
      overrideAccess: false,
      req,
      user: null,
    }),
  )
  expect(result.branch).toBe('feature')
})
