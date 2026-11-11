import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import { loadBranchManifest } from './resolveBranch.js'

test('should share the pending manifest read and wait for its populated result', async () => {
  let complete!: (value: { docs: object[] }) => void
  const find = vi.fn(
    () =>
      new Promise((resolve) => {
        complete = resolve
      }),
  )
  const req = {
    branch: 'campaign',
    context: {},
    payload: { config: { branching: { enabled: true } }, db: { find } },
  } as unknown as PayloadRequest
  const first = loadBranchManifest(req)
  const second = loadBranchManifest(req)

  complete({ docs: [{ collectionSlug: 'posts', doc: { value: 'id' }, operation: 'update' }] })

  expect((await first).get('posts')).toEqual(['id'])
  expect((await second).get('posts')).toEqual(['id'])
  expect(find).toHaveBeenCalledOnce()
})

test('should retry a manifest read after a rejected query', async () => {
  const find = vi
    .fn()
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValueOnce({
      docs: [{ collectionSlug: 'posts', doc: { value: 'id' }, operation: 'delete' }],
    })
  const req = {
    branch: 'campaign',
    context: {},
    payload: { config: { branching: { enabled: true } }, db: { find } },
  } as unknown as PayloadRequest

  await expect(loadBranchManifest(req)).rejects.toThrow('Unavailable')
  expect((await loadBranchManifest(req)).get('posts')).toEqual(['id'])
  expect(find).toHaveBeenCalledTimes(2)
})
