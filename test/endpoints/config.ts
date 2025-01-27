import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { collectionEndpoints } from './endpoints/collections'
import { globalEndpoints } from './endpoints/globals'
import { endpoints } from './endpoints/root'
import {
  collectionSlug,
  globalSlug,
  noEndpointsCollectionSlug,
  noEndpointsGlobalSlug,
} from './shared'

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
  admin: {
    webpack: (config) => {
      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve.alias,
            express: path.resolve(__dirname, './mocks/emptyModule.js'),
          },
        },
      }
    },
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
