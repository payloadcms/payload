import { expect, it } from 'vitest'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { StoredFileList } from './types.js'

import { collectStoredFiles, hasStoredOriginal } from './storedFiles.js'

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
    name: 'leave out a main file and a size that have no stored object, and keep their original',
    marker: { _stored: false, variants: { card: { _stored: false, filename: 'photo-card.png' } } },
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

it('should retain an archived original whose saved URL still asks for the original role', () => {
  const files = collectStoredFiles({
    collection: { slug: 'media', upload: {} } as SanitizedCollectionConfig,
    doc: {
      _stored: false,
      filename: 'photo.png',
      original: {
        filename: 'photo-version.png',
        url: '/api/media/file/photo-version.png?original=true',
      },
    },
    req: { payload: { config: { routes: { api: '/api' } } } } as PayloadRequest,
  })

  expect(files).toEqual([{ key: 'photo-version.png', roles: [{ type: 'original' }] }])
})

it.for<{ expected: boolean; name: string; storedFiles: StoredFileList }>([
  {
    name: 'find a stored original that shares its file with the main file',
    storedFiles: [{ key: 'photo.png', roles: [{ type: 'default' }, { type: 'original' }] }],
    expected: true,
  },
  {
    name: 'find no stored original when only the main file and sizes are stored',
    storedFiles: [
      { key: 'photo.png', roles: [{ type: 'default' }] },
      { key: 'photo-card.png', roles: [{ sizeKey: 'card', type: 'size' }] },
    ],
    expected: false,
  },
])('should $name', ({ expected, storedFiles }) => {
  expect(hasStoredOriginal({ storedFiles })).toBe(expected)
})
