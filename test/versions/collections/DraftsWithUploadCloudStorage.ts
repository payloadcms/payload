import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { draftWithUploadCloudStorageCollectionSlug } from '../slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Filenames passed to the mock adapter's handleDelete. Tests assert that the
 * published file is not deleted when saving a draft over a published document.
 */
export const cloudStorageDeletedFilenames: string[] = []

/**
 * Mock cloud-storage adapter that mirrors the real S3 adapter: its handleUpload
 * returns the full `data` object (see packages/storage-s3/src/adapter.ts). This is
 * what triggers the cloud-storage afterChange hook to persist the doc back to the
 * database, which previously unpublished the main document on a draft save.
 */
export const mockCloudStorageAdapter = () => ({
  name: 'mock-cloud-storage-adapter',
  handleDelete: ({ filename }: { filename: string }) => {
    cloudStorageDeletedFilenames.push(filename)
    return Promise.resolve()
  },
  handleUpload: ({ data }: { data: unknown }) => data,
  staticHandler: () => new Response('Not found', { status: 404 }),
})

export const DraftsWithUploadCloudStorage: CollectionConfig = {
  slug: draftWithUploadCloudStorageCollectionSlug,
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  upload: {
    disableLocalStorage: true,
    staticDir: path.resolve(dirname, './uploads-draft-cloud'),
  },
  versions: {
    drafts: true,
  },
}
