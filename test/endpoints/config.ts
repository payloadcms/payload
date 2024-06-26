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
  collections: [
    {
      slug: collectionSlug,
      access: {
        read: () => true,
        create: () => true,
        delete: () => true,
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
      graphQL: false,
      endpoints: false,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  globals: [
    {
      slug: globalSlug,
      endpoints: globalEndpoints,
      fields: [],
    },
    {
      slug: noEndpointsGlobalSlug,
      graphQL: false,
      endpoints: false,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  endpoints,
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
