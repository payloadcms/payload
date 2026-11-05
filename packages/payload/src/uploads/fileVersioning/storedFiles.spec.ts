import { expect, it } from 'vitest'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { collectStoredFiles } from './storedFiles.js'

const collection = {
  slug: 'media',
  upload: {
    fileOperations: {
      resolveStorageKey: ({ _objectKey, filename }: { _objectKey?: string; filename: string }) =>
        _objectKey ? `${_objectKey}/${filename}` : filename,
    },
  },
} as unknown as SanitizedCollectionConfig

const original = { _objectKey: 'original-key', filename: 'photo.png' }

it.for([
  {
    name: 'leave out a main file that has no stored object, and keep its original',
    marker: { _stored: false },
    expected: [{ key: 'original-key/photo.png', roles: [{ type: 'original' }] }],
  },
  {
    name: 'keep a main file whose marker is null',
    marker: { _stored: null },
    expected: [
      { key: 'main-key/photo.png', roles: [{ type: 'default' }] },
      { key: 'original-key/photo.png', roles: [{ type: 'original' }] },
    ],
  },
  {
    name: 'keep a main file with no marker',
    marker: {},
    expected: [
      { key: 'main-key/photo.png', roles: [{ type: 'default' }] },
      { key: 'original-key/photo.png', roles: [{ type: 'original' }] },
    ],
  },
])('should $name', ({ expected, marker }) => {
  const files = collectStoredFiles({
    collection,
    doc: { ...marker, _objectKey: 'main-key', filename: 'photo.png', original },
    req: {} as PayloadRequest,
  })

  expect(files).toEqual(expect.arrayContaining(expected))
  expect(files).toHaveLength(expected.length)
})
