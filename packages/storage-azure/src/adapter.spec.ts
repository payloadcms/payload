import type { CollectionConfig } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { createAzureAdapter } from './adapter.js'

const createAdapter = () =>
  createAzureAdapter({
    allowContainerCreate: false,
    baseURL: 'https://account.blob.core.windows.net',
    clientUploads: true,
    containerName: 'media',
    createContainerIfNotExists: vi.fn(),
    getStorageClient: vi.fn(),
  })

describe('Azure client uploads', () => {
  it.each([
    ['secure defaults', { upload: true }, false],
    ['explicit opt-out', { upload: { allowRestrictedFileTypes: true } }, true],
  ])('should use server uploads for %s', (_, collection, expected) => {
    const adapter = createAdapter()({
      collection: collection as unknown as CollectionConfig,
      prefix: '',
    })

    expect(adapter.uploadInstructions?.enabled).toBe(expected)
  })
})

it('should generate a public URL for the stored legacy prefix', () => {
  const collection: CollectionConfig = { slug: 'media', fields: [] }
  const adapter = createAdapter()({
    collection,
    prefix: 'uploads',
  })

  expect(
    adapter.generateURL!({ collection, data: {}, filename: 'file.png', prefix: 'legacy' }),
  ).toBe('https://account.blob.core.windows.net/media/legacy/file.png')
})
