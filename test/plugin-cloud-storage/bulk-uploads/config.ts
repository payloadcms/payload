import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { readFile } from 'node:fs/promises'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { Media } from './collections/Media.js'
import { mediaSlug, storedFiles } from './shared.js'

export default buildConfigWithDefaults({
  suite: 'cloud-storage-bulk-uploads',
  config: {
    collections: [Media],
    upload: { useTempFiles: true },
    plugins: [
      cloudStoragePlugin({
        collections: {
          [mediaSlug]: {
            adapter: () => ({
              name: 'bulk-upload-test',
              generateURL: ({ filename }) => `https://upload-state.test/${filename}`,
              handleDelete: ({ storageFilePath }) => {
                storedFiles.delete(storageFilePath)
              },
              handleUpload: async ({ data, file, storageFilePath }) => {
                const bytes = file.tempFilePath ? await readFile(file.tempFilePath) : file.buffer
                storedFiles.set(storageFilePath, bytes)
                return { ...data, storageVersion: (data.storageVersion ?? 0) + 1 }
              },
              staticHandler: () => new Response(null, { status: 404 }),
            }),
          },
        },
      }),
    ],
  },
})
