import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { Locked } from '../errors/index.js'
import { lockedDocumentsCollectionSlug } from '../locked-documents/config.js'
import { checkDocumentLockStatus } from './checkDocumentLockStatus.js'

describe('document lock transaction context', () => {
  it.each(['postgres', 'mongoose'])(
    'should preserve %s transaction handling for a document lock read',
    async (name) => {
      const { find, req } = createRequest({ name })

      await checkDocumentLockStatus({
        id: 1,
        collectionSlug: 'posts',
        overrideLock: false,
        req,
      })

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({ req: name === 'mongoose' ? undefined : req }),
      )
    },
  )

  it('should still reject an update locked by another user', async () => {
    const { deleteMany, find, req } = createRequest({ name: 'postgres' })

    find.mockResolvedValue({
      docs: [{ updatedAt: new Date().toISOString(), user: { value: 2 } }],
    })

    await expect(
      checkDocumentLockStatus({ id: 1, collectionSlug: 'posts', overrideLock: false, req }),
    ).rejects.toBeInstanceOf(Locked)
    expect(deleteMany).not.toHaveBeenCalled()
  })
})

function createRequest({ name }: { name: string }) {
  const find = vi
    .fn<(...args: unknown[]) => Promise<{ docs: Record<string, unknown>[] }>>()
    .mockResolvedValue({ docs: [] })
  const deleteMany = vi.fn().mockResolvedValue(undefined)
  const req = {
    payload: {
      collections: {
        [lockedDocumentsCollectionSlug]: {},
        posts: { config: { lockDocuments: true } },
      },
      db: { name, deleteMany, find },
    },
    transactionID: 'existing-transaction',
    user: { id: 1 },
  } as unknown as PayloadRequest

  return { deleteMany, find, req }
}
