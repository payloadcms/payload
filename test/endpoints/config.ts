import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { collectionEndpoints } from './endpoints/collections.js'
import { globalEndpoints } from './endpoints/globals.js'
import { endpoints } from './endpoints/root.js'
import {
  collectionSlug,
  globalSlug,
  noEndpointsCollectionSlug,
  noEndpointsGlobalSlug,
} from './shared.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: collectionSlug,
      access: {
        create: () => true,
        delete: () => true,
        read: () => true,
        update: () => true,
      },
      endpoints: collectionEndpoints,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: noEndpointsCollectionSlug,
      endpoints: false,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      graphQL: false,
    },
  ],
  endpoints,
  globals: [
    {
      slug: globalSlug,
      endpoints: globalEndpoints,
      fields: [],
    },
    {
      slug: noEndpointsGlobalSlug,
      endpoints: false,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      graphQL: false,
    },
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
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
