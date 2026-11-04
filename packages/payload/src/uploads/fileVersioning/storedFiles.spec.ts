import { expect, it } from 'vitest'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { collectStoredFiles } from './storedFiles.js'

it('should leave out a file entry that has no stored object', () => {
  const collection = {
    slug: 'media',
    upload: {
      fileOperations: {
        resolveStorageKey: ({ _objectKey, filename }: { _objectKey?: string; filename: string }) =>
          _objectKey ? `${_objectKey}/${filename}` : filename,
      },
    },
  } as unknown as SanitizedCollectionConfig

  const files = collectStoredFiles({
    collection,
    doc: {
      _stored: false,
      filename: 'photo.png',
      original: { _objectKey: 'original-key', filename: 'photo.png' },
    },
    req: {} as PayloadRequest,
  })

  expect(files).toEqual([{ key: 'original-key/photo.png', roles: [{ type: 'original' }] }])
})

it('should keep the original of a local document whose main file is built at request time', () => {
  const collection = {
    slug: 'media',
    upload: {},
  } as unknown as SanitizedCollectionConfig

  const files = collectStoredFiles({
    collection,
    doc: {
      _stored: false,
      filename: 'photo.png',
      original: { filename: 'photo.png', url: '/api/media/file/photo.png?original=true' },
      url: '/api/media/file/photo.png',
    },
    req: { payload: { config: { routes: { api: '/api' } } } } as unknown as PayloadRequest,
  })

  expect(files).toEqual([{ key: 'photo.png', roles: [{ type: 'original' }] }])
})
