import type { Payload, PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import { resolveEffectiveOperations } from './effectiveOperations.js'

test('should resolve a group of unversioned changes with one shadow-row query', async () => {
  const changes = Array.from({ length: 25 }, (_, index) => ({
    branch: 'benchmark',
    collectionSlug: 'posts',
    doc: `post-${index}`,
    id: `change-${index}`,
    operation: 'create',
  }))
  const shadows = changes.map((change, index) => ({
    _branch: 'benchmark',
    id: change.doc,
    title: `Post ${index}`,
  }))
  const find = vi.fn().mockResolvedValue({ docs: shadows })
  const findOne = vi.fn()
  const payload = {
    collections: {
      posts: { config: { fields: [], versions: false } },
    },
    db: { find, findOne },
  } as unknown as Payload

  const resolved = await resolveEffectiveOperations({
    branch: 'benchmark',
    changes,
    payload,
    req: {} as PayloadRequest,
  })

  expect(resolved.map(({ docID }) => docID)).toEqual(changes.map(({ doc }) => doc))
  expect(find).toHaveBeenCalledOnce()
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        and: [{ _branch: { equals: 'benchmark' } }, { id: { in: changes.map(({ doc }) => doc) } }],
      },
    }),
  )
  expect(findOne).not.toHaveBeenCalled()
})

test('should split large shadow-row reads into adapter-safe groups', async () => {
  const changes = Array.from({ length: 401 }, (_, index) => ({
    branch: 'benchmark',
    collectionSlug: 'posts',
    doc: `post-${index}`,
    id: `change-${index}`,
    operation: 'create',
  }))
  const find = vi.fn().mockResolvedValue({
    docs: changes.map((change) => ({ _branch: 'benchmark', id: change.doc })),
  })
  const payload = {
    collections: {
      posts: { config: { fields: [], versions: false } },
    },
    db: { find, findOne: vi.fn() },
  } as unknown as Payload

  const resolved = await resolveEffectiveOperations({
    branch: 'benchmark',
    changes,
    payload,
    req: {} as PayloadRequest,
  })

  expect(resolved).toHaveLength(401)
  expect(find).toHaveBeenCalledTimes(2)
})
