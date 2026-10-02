import type { PayloadRequest } from '../types/index.js'

import { describe, expect, test, vitest } from 'vitest'

import { Locked } from '../errors/index.js'
import { lockedDocumentsCollectionSlug } from '../locked-documents/config.js'
import { checkDocumentLockStatus, getLockedDocumentIds } from './checkDocumentLockStatus.js'

const lockedDocument = {
  document: { value: '1' },
  updatedAt: new Date().toISOString(),
  user: { value: 'another-user-id' },
}

const createReq = (dbName: string): PayloadRequest => {
  const req = {
    payload: {
      collections: {
        [lockedDocumentsCollectionSlug]: { config: {} },
        posts: { config: { lockDocuments: true } },
      },
      db: {
        deleteMany: vitest.fn().mockResolvedValue({ docs: [] }),
        find: vitest.fn().mockResolvedValue({ docs: [lockedDocument] }),
        name: dbName,
      },
    },
    user: { id: 'current-user-id' },
  }

  return req as unknown as PayloadRequest
}

const findArgs = (req: PayloadRequest): Record<string, unknown> =>
  (req.payload.db.find as ReturnType<typeof vitest.fn>).mock.calls[0]?.[0]

describe('checkDocumentLockStatus', () => {
  test('should pass req to the lock status find so it uses the transaction connection', async () => {
    const req = createReq('postgres')

    await expect(
      checkDocumentLockStatus({ collectionSlug: 'posts', id: '1', overrideLock: false, req }),
    ).rejects.toBeInstanceOf(Locked)

    expect(findArgs(req).req).toBe(req)
  })

  test('should not pass req to the lock status find for mongoose', async () => {
    const req = createReq('mongoose')

    await expect(
      checkDocumentLockStatus({ collectionSlug: 'posts', id: '1', overrideLock: false, req }),
    ).rejects.toBeInstanceOf(Locked)

    expect(findArgs(req).req).toBeUndefined()
  })
})

describe('getLockedDocumentIds', () => {
  test('should pass req to the bulk lock status find so it uses the transaction connection', async () => {
    const req = createReq('postgres')

    const lockedIds = await getLockedDocumentIds({
      collectionSlug: 'posts',
      ids: ['1'],
      overrideLock: false,
      req,
    })

    expect(lockedIds).toEqual(new Set(['1']))
    expect(findArgs(req).req).toBe(req)
  })
})
