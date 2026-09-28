import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { authorizeClientOverwrite } from './authorizeFileOverwrite.js'

const owner = (id: number) => ({ filename: 'image.png', id, prefix: 'shared' })
const collectionSources = [
  { collectionPrefix: '', collectionSlug: 'media', useCompositePrefixes: false },
  { collectionPrefix: '', collectionSlug: 'protected', useCompositePrefixes: false },
]

const createRequest = ({
  mediaOwner = true,
  protectedOwner = false,
}: {
  mediaOwner?: boolean
  protectedOwner?: boolean
} = {}) =>
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
        docs:
          collection === 'media'
            ? mediaOwner
              ? [owner(1)]
              : []
            : protectedOwner
              ? [owner(2)]
              : [],
      })),
    },
    t: vi.fn(),
  }) as unknown as PayloadRequest

describe('authorizeClientOverwrite', () => {
  it('allows an update when the requested collection is the only owner', async () => {
    await expect(
      authorizeClientOverwrite({
        collectionSources,
        requestedStorageFilePath: 'shared/image.png',
        requestedFilename: 'image.png',
        req: createRequest(),
        requestedCollectionSlug: 'media',
        collectionPrefix: '',
      }),
    ).resolves.toBe(true)
  })

  it('rejects an update when another collection owns the same key', async () => {
    await expect(
      authorizeClientOverwrite({
        collectionSources,
        requestedStorageFilePath: 'shared/image.png',
        requestedFilename: 'image.png',
        req: createRequest({ mediaOwner: false, protectedOwner: true }),
        requestedCollectionSlug: 'media',
        collectionPrefix: '',
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rejects an update when multiple collections own the same key', async () => {
    await expect(
      authorizeClientOverwrite({
        collectionSources,
        requestedStorageFilePath: 'shared/image.png',
        requestedFilename: 'image.png',
        req: createRequest({ protectedOwner: true }),
        requestedCollectionSlug: 'media',
        collectionPrefix: '',
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
