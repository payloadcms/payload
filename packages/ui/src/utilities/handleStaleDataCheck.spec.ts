import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { handleStaleDataCheck } from './handleStaleDataCheck.js'

const createRequest = (currentUpdatedAt: string) =>
  ({
    payload: {
      config: {
        collections: [{ slug: 'posts', versions: { drafts: true } }],
        globals: [],
      },
      findByID: vi.fn().mockResolvedValue({ updatedAt: currentUpdatedAt }),
      logger: {
        error: vi.fn(),
      },
    },
  }) as unknown as PayloadRequest

describe('handleStaleDataCheck', () => {
  it.each([
    {
      currentUpdatedAt: '2026-08-27T12:00:00.000Z',
      expectedIsStale: false,
      name: 'same timestamp',
      originalUpdatedAt: '2026-08-27T12:00:00.000Z',
    },
    {
      currentUpdatedAt: '2026-08-27T11:00:00.000Z',
      expectedIsStale: true,
      name: 'older but different timestamp',
      originalUpdatedAt: '2026-08-27T12:00:00.000Z',
    },
    {
      currentUpdatedAt: '2026-08-27T13:00:00.000Z',
      expectedIsStale: true,
      name: 'newer timestamp',
      originalUpdatedAt: '2026-08-27T12:00:00.000Z',
    },
  ])(
    'should treat a $name according to snapshot identity',
    async ({ currentUpdatedAt, expectedIsStale, originalUpdatedAt }) => {
      await expect(
        handleStaleDataCheck({
          id: 'post-id',
          collectionSlug: 'posts',
          originalUpdatedAt,
          req: createRequest(currentUpdatedAt),
        }),
      ).resolves.toEqual({
        currentUpdatedAt,
        isStale: expectedIsStale,
      })
    },
  )
})
