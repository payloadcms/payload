import type { SyncDocArgs } from '../types.js'

import { describe, expect, it, vi } from 'vitest'

import { syncDocAsSearchIndex } from './syncDocAsSearchIndex.js'

describe('syncDocAsSearchIndex', () => {
  it.each(['create', 'update'] as const)(
    'propagates a failed %s search write when it shares the parent transaction',
    async (operation) => {
      const writeError = new Error('search write failed')
      const onSyncError = vi.fn()
      const payload = {
        config: {},
        create: vi.fn().mockRejectedValue(writeError),
        find: vi.fn().mockResolvedValue({ docs: [] }),
        logger: { error: vi.fn() },
      }
      const req = {
        context: {},
        payload,
        transactionID: 'parent-transaction',
      }

      await expect(
        syncDocAsSearchIndex({
          collection: 'posts',
          doc: { id: 'post-1', title: 'Published' },
          onSyncError,
          operation,
          pluginConfig: { reindexBatchSize: 50, syncDrafts: false },
          req,
        } as unknown as SyncDocArgs),
      ).rejects.toBe(writeError)

      expect(payload.create).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'search', req }),
      )
      expect(onSyncError).toHaveBeenCalledOnce()
    },
  )
})
