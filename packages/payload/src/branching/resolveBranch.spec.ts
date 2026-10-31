import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import { isolateBranchState, loadBranchManifest } from './resolveBranch.js'

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

test('should preserve native Request properties when isolating a branch', async () => {
  const req = Object.assign(
    new Request('https://example.com/api/posts?branch=campaign', {
      headers: { 'x-test': 'preserved' },
      method: 'POST',
      body: 'payload',
    }),
    { branch: 'campaign', context: {} },
  ) as unknown as PayloadRequest
  const isolated = isolateBranchState(req)

  expect(isolated.url).toBe(req.url)
  expect(isolated.method).toBe('POST')
  expect(isolated.headers.get('x-test')).toBe('preserved')
  expect(await isolated.text()).toBe('payload')
  isolated.branch = 'other'
  expect(req.branch).toBe('campaign')
})
