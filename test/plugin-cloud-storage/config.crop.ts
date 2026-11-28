import type { Config } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Users } from './collections/Users.js'
import { cropMediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Lightweight config for the crop re-entry reproduction. Uses an in-memory
 * storage adapter so the test can boot without Docker / localstack.
 */
export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: dirname,
    },
  },
  collections: [
    {
      slug: cropMediaSlug,
      access: {
        create: () => true,
        delete: () => true,
        read: () => true,
        update: () => true,
      },
      fields: [],
      upload: {
        resizeOptions: { height: 800, width: 800 },
        staticDir: undefined,
      },
    },
    Users,
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  plugins: [
    cloudStoragePlugin({
      collections: {
        [cropMediaSlug]: {
          adapter: () => ({
            name: 'in-memory-adapter',
            handleDelete: () => Promise.resolve(),
            handleUpload: ({ data, file }) => ({
              ...data,
              s3URL: `https://fake-bucket.example.com/${file.filename}`,
            }),
            staticHandler: () => new Response('Not found', { status: 404 }),
          }),
        },
      },
    }),
  ],
}) as Promise<Config>
