import { expect, it } from 'vitest'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { UploadFileEntry } from './types.js'

import {
  collectStoredFiles,
  getUploadFileEntries,
  getUploadFileObject,
  getUploadFileObjects,
  isManagedUpload,
  hasStoredOriginal,
} from './storedFiles.js'

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

it.for<{ entries: UploadFileEntry[]; expected: boolean; name: string }>([
  {
    name: 'find a stored original that shares its file with the main file',
    entries: [
      { key: 'photo.png', role: { type: 'default' }, status: 'stored' },
      { key: 'photo.png', role: { type: 'original' }, status: 'stored' },
    ],
    expected: true,
  },
  {
    name: 'find no stored original when only the main file and sizes are stored',
    entries: [
      { key: 'photo.png', role: { type: 'default' }, status: 'stored' },
      {
        key: 'photo-card.png',
        role: { sizeKey: 'card', type: 'size' },
        status: 'stored',
      },
    ],
    expected: false,
  },
  {
    name: 'find no stored original when the original is not managed',
    entries: [{ role: { type: 'original' }, status: 'unmanaged' }],
    expected: false,
  },
])('should $name', ({ entries, expected }) => {
  expect(hasStoredOriginal({ entries })).toBe(expected)
})

const localCollection = { slug: 'media', upload: {} } as SanitizedCollectionConfig
const localReq = { payload: { config: { routes: { api: '/api' } } } } as PayloadRequest

it('should group a main file and an original that share a key into one file', () => {
  const files = collectStoredFiles({
    collection,
    doc: { filename: 'photo.png', original: { filename: 'photo.png' } },
    req: {} as PayloadRequest,
  })

  expect(files).toEqual([{ key: 'photo.png', roles: [{ type: 'default' }, { type: 'original' }] }])
})

it('should leave out a local entry whose URL is not the Payload file route', () => {
  const files = collectStoredFiles({
    collection: localCollection,
    doc: {
      filename: 'photo.png',
      original: { filename: 'photo-original.png', url: '/api/media/file/photo-original.png' },
      url: 'https://cdn.example.com/photo.png',
    },
    req: localReq,
  })

  expect(files).toEqual([{ key: 'photo-original.png', roles: [{ type: 'original' }] }])
})

it('should keep a local entry whose URL is not the Payload file route when generated files are trusted', () => {
  const files = collectStoredFiles({
    collection: localCollection,
    doc: {
      filename: 'photo.png',
      original: { filename: 'photo-original.png', url: '/api/media/file/photo-original.png' },
      url: 'https://cdn.example.com/photo.png',
    },
    req: localReq,
    trustGenerated: true,
  })

  expect(files).toEqual(
    expect.arrayContaining([
      { key: 'photo.png', roles: [{ type: 'default' }] },
      { key: 'photo-original.png', roles: [{ type: 'original' }] },
    ]),
  )
  expect(files).toHaveLength(2)
})

it('should return no files for a document with no original', () => {
  const files = collectStoredFiles({
    collection,
    doc: { filename: 'photo.png', variants: { card: { filename: 'photo-card.png' } } },
    req: {} as PayloadRequest,
  })

  expect(files).toEqual([])
})

it('should list each stored variant under its size key', () => {
  const files = collectStoredFiles({
    collection,
    doc: {
      _stored: false,
      filename: 'photo.png',
      original,
      variants: { card: { filename: 'photo-card.png' }, empty: null, thumb: 'not-an-entry' },
    },
    req: {} as PayloadRequest,
  })

  expect(files).toEqual(
    expect.arrayContaining([
      { key: 'original-key/photo.png', roles: [{ type: 'original' }] },
      { key: 'photo-card.png', roles: [{ sizeKey: 'card', type: 'size' }] },
    ]),
  )
  expect(files).toHaveLength(2)
})

it('should throw for a variant whose size key is not safe', () => {
  expect(() =>
    collectStoredFiles({
      collection,
      doc: { filename: 'photo.png', original, variants: { 'a/b': { filename: 'photo-ab.png' } } },
      req: {} as PayloadRequest,
    }),
  ).toThrow('A stored variant requires a safe size key')
})

it('should list the main file, the original and each size as stored entries', () => {
  const entries = getUploadFileEntries({
    collection,
    doc: {
      _objectKey: 'main-key',
      filename: 'photo.png',
      original,
      variants: { card: { filename: 'photo-card.png' } },
    },
    req: {} as PayloadRequest,
  })

  expect(entries).toEqual([
    {
      key: 'main-key/photo.png',
      role: { type: 'default' },
      status: 'stored',
    },
    {
      key: 'original-key/photo.png',
      role: { type: 'original' },
      status: 'stored',
    },
    {
      key: 'photo-card.png',
      role: { sizeKey: 'card', type: 'size' },
      status: 'stored',
    },
  ])
})

it('should list a main file and a size that are built on request without a key', () => {
  const entries = getUploadFileEntries({
    collection,
    doc: {
      _stored: false,
      filename: 'photo.png',
      original,
      variants: { card: { _stored: false, filename: 'photo-card.png' } },
    },
    req: {} as PayloadRequest,
  })

  expect(entries).toEqual([
    { role: { type: 'default' }, status: 'requestTime' },
    {
      key: 'original-key/photo.png',
      role: { type: 'original' },
      status: 'stored',
    },
    { role: { sizeKey: 'card', type: 'size' }, status: 'requestTime' },
  ])
})

it('should list one entry per role when a main file and an original share a key', () => {
  const entries = getUploadFileEntries({
    collection,
    doc: { filename: 'photo.png', original: { filename: 'photo.png' } },
    req: {} as PayloadRequest,
  })

  expect(entries).toEqual([
    { key: 'photo.png', role: { type: 'default' }, status: 'stored' },
    { key: 'photo.png', role: { type: 'original' }, status: 'stored' },
  ])
})

it('should list the entries of a document with no original as unmanaged', () => {
  const entries = getUploadFileEntries({
    collection,
    doc: { filename: 'photo.png', variants: { card: { filename: 'photo-card.png' } } },
    req: {} as PayloadRequest,
  })

  expect(entries).toEqual([
    { role: { type: 'default' }, status: 'unmanaged' },
    { role: { sizeKey: 'card', type: 'size' }, status: 'unmanaged' },
  ])
})

it.for([
  {
    name: 'list a local entry whose URL is not the Payload file route as unmanaged',
    trustGenerated: false,
    expected: { role: { type: 'default' }, status: 'unmanaged' },
  },
  {
    name: 'list a local entry whose URL is not the Payload file route as stored when generated files are trusted',
    trustGenerated: true,
    expected: {
      key: 'photo.png',
      role: { type: 'default' },
      status: 'stored',
    },
  },
])('should $name', ({ expected, trustGenerated }) => {
  const [mainEntry] = getUploadFileEntries({
    collection: localCollection,
    doc: {
      filename: 'photo.png',
      original: { filename: 'photo-original.png', url: '/api/media/file/photo-original.png' },
      url: 'https://cdn.example.com/photo.png',
    },
    req: localReq,
    trustGenerated,
  })

  expect(mainEntry).toEqual(expected)
})

it('should not list entries that have no filename', () => {
  const entries = getUploadFileEntries({
    collection,
    doc: {
      filename: null,
      original,
      variants: { card: { filename: null }, empty: null, thumb: 'not-an-entry' },
    },
    req: {} as PayloadRequest,
  })

  expect(entries).toEqual([
    {
      key: 'original-key/photo.png',
      role: { type: 'original' },
      status: 'stored',
    },
  ])
})

it('should throw for a stored entry whose storage key is not safe', () => {
  expect(() =>
    getUploadFileEntries({
      collection,
      doc: { filename: '../photo.png', original },
      req: {} as PayloadRequest,
    }),
  ).toThrow('Unsafe managed storage key')
})

it('should read only the given roles without checking the other entries', () => {
  const entries = getUploadFileEntries({
    collection,
    doc: {
      _objectKey: 'main-key',
      filename: 'photo.png',
      original: { ...original, filename: '../photo.png' },
      variants: { 'a/b': { filename: 'photo-ab.png' } },
    },
    req: {} as PayloadRequest,
    roles: [{ type: 'default' }],
  })

  expect(entries).toEqual([
    { key: 'main-key/photo.png', role: { type: 'default' }, status: 'stored' },
  ])
})

it('should list the main file, the original and each size object in that order', () => {
  const card = { filename: 'photo-card.png' }
  const doc = {
    filename: 'photo.png',
    original,
    variants: { card, empty: null, list: ['not-an-entry'], thumb: 'not-an-entry' },
  }

  const values = getUploadFileObjects({ doc })

  expect(values).toEqual([
    { role: { type: 'default' }, value: doc },
    { role: { type: 'original' }, value: original },
    { role: { sizeKey: 'card', type: 'size' }, value: card },
  ])
  expect(values[2]?.value).toBe(card)
})

it('should list no original or sizes when the document has none', () => {
  const doc = { filename: 'photo.png', original: null, variants: null }

  expect(getUploadFileObjects({ doc })).toEqual([{ role: { type: 'default' }, value: doc }])
})

it.for([
  { name: 'the main file', role: { type: 'default' } as const, expected: 'doc' },
  { name: 'the original', role: { type: 'original' } as const, expected: 'original' },
  { name: 'a size', role: { sizeKey: 'card', type: 'size' } as const, expected: 'card' },
  {
    name: 'a missing size',
    role: { sizeKey: 'thumb', type: 'size' } as const,
    expected: undefined,
  },
])('should return the object of $name for its role', ({ expected, role }) => {
  const card = { filename: 'photo-card.png' }
  const doc = { filename: 'photo.png', original, variants: { card } }
  const objects = { card, doc, original } as Record<string, unknown>

  expect(getUploadFileObject({ doc, role })).toBe(expected ? objects[expected] : undefined)
})

it('should list an original marked as not stored as unmanaged, because an original is never built on request', () => {
  const entries = getUploadFileEntries({
    collection,
    doc: { filename: 'photo.png', original: { ...original, _stored: false } },
    req: {} as PayloadRequest,
  })

  expect(entries).toContainEqual({
    role: { type: 'original' },
    status: 'unmanaged',
  })
})

it.for([
  {
    name: 'an original with a filename',
    doc: { original: { filename: 'photo.png' } },
    expected: true,
  },
  { name: 'an original with no filename', doc: { original: { filename: null } }, expected: false },
  { name: 'no original', doc: { original: null }, expected: false },
  { name: 'an original that is not an object', doc: { original: 'photo.png' }, expected: false },
])('should treat an upload as managed for $name: $expected', ({ doc, expected }) => {
  expect(isManagedUpload({ doc })).toBe(expected)
})
