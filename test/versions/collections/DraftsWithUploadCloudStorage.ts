import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { draftWithUploadCloudStorageCollectionSlug } from '../slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const cloudStorageDeletedFilenames: string[] = []

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
