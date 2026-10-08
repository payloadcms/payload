import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { authorizeClientOverwrite } from './authorizeFileOverwrite.js'

const owner = (id: number) => ({ filename: 'image.png', id, prefix: 'shared' })

const createRequest = ({ protectedOwner = false }: { protectedOwner?: boolean } = {}) =>
  ({
    payload: {
      collections: {
        media: {
          config: { access: { update: async () => true }, upload: true },
        },
        protected: {
          config: { access: { update: async () => false }, upload: true },
        },
      },
      find: vi.fn(async ({ collection }: { collection: string }) => ({
        docs: collection === 'media' ? [owner(1)] : protectedOwner ? [owner(2)] : [],
      })),
    },
    t: vi.fn(),
  }) as unknown as PayloadRequest

describe('authorizeClientOverwrite', () => {
  it('should reject a new key outside the requested collection prefix', async () => {
    await expect(
      authorizeClientOverwrite({
        collections: { media: { prefix: 'media' } },
        requestedFilename: 'image.png',
        requestedStorageFilePath: 'media-archive/image.png',
        req: createRequest(),
        requestedCollectionSlug: 'media',
        collectionPrefix: 'media',
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('allows an update when the requested collection is the only owner', async () => {
    await expect(
      authorizeClientOverwrite({
        collections: { media: true, protected: true },
        requestedFilename: 'image.png',
        requestedStorageFilePath: 'shared/image.png',
        req: createRequest(),
        requestedCollectionSlug: 'media',
        collectionPrefix: '',
      }),
    ).resolves.toBe(true)
  })

  it('rejects an update when another collection owns the same key', async () => {
    await expect(
      authorizeClientOverwrite({
        collections: { media: true, protected: true },
        requestedFilename: 'image.png',
        requestedStorageFilePath: 'shared/image.png',
        req: createRequest({ protectedOwner: true }),
        requestedCollectionSlug: 'media',
        collectionPrefix: '',
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
